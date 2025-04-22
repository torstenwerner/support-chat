import OpenAI from 'openai';
import dotenv from 'dotenv';
import {existsSync, readFileSync} from 'node:fs';
import {fetchIndexes, search} from "./file-search/util.js";

// Load environment variables
dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-testing'
});

// Model configuration
const MODELS = {
    MAIN: "gpt-4.1",
    MINI: "gpt-4.1-nano",
    // Commented options for future reference
    // MAIN: "gpt-4o",
    // MINI: "gpt-4.1-mini",
};

// Pre-load file indexes for vector search
const fileIndex = fetchIndexes();

/**
 * Asks the AI using the parameter userPrompt and returns the answer.
 * It executes some specific workflow to improve the answer given by the AI.
 * @param {string} userPrompt the user prompt
 * @param {boolean} vectorStoreEnabled should the vector store be used instead of web search
 * @returns {Promise<string>} the AI chat answer
 */
export async function askAi(userPrompt, vectorStoreEnabled = false) {
    if (await isRelevant(userPrompt)) {
        try {
            const beaVersion = await fetchBeaVersion();
            const developerPromptTemplate = `Sie sind ein hilfreicher, sachlicher und freundlicher Assistent, der ausschließlich Fragen zum besonderen elektronischen Anwaltspostfach beA beantwortet. Wenn eine Frage nicht zu diesem Thema gehört, erklären Sie höflich, dass Sie nur in diesem Themengebiet Auskunft geben. Bleiben Sie stets respektvoll und professionell. Ergänzen Sie bitte Verweise auf portal.beasupport.de oder handbuch.bea-brak.de, wenn diese Informationen für die Antwort hilfreich sind. Weisen Sie auf die Rolle 'VHN-Berechtigter' hin, wenn es für die Antwort hilfreich ist. Die aktuelle Version des beA ist ${beaVersion}. Eine Signatur ist für Abgabe eines elektronischen Empfangsbekenntnis nur nötig, wenn es nicht aus dem eigenen Postfach versendet wird oder Sie nicht das Recht "30 - eEBs mit VHN versenden" für dieses Postfach besitzen.

`;
            const fileSearchResult = vectorStoreEnabled ?
                await fileSearch(userPrompt, developerPromptTemplate) :
                undefined;
            const developerPrompt = vectorStoreEnabled ? fileSearchResult.prompt : developerPromptTemplate;
            const webSearchEnabled = !vectorStoreEnabled;
            const answer = await askAiWithModelAndPrompt(MODELS.MAIN, developerPrompt, userPrompt, webSearchEnabled);
            return vectorStoreEnabled ? addSources(fileSearchResult.filenames, answer) : answer;
        } catch (error) {
            console.error("Error in askAi:", error);
            return "Es tut mir leid, aber es ist ein Fehler aufgetreten. Bitte versuchen Sie es später noch einmal.";
        }
    } else {
        return "Es tut mir leid, aber ich kann Ihnen dabei nicht helfen, da ich ausschließlich Fragen zum besonderen elektronischen Anwaltspostfach (beA) beantworte. Wenn Sie Informationen zu beA benötigen, stehe ich Ihnen gerne zur Verfügung!";
    }
}

let lastVersion = '3.32.1';

/**
 * Fetches the version of the beA from a REST service.
 * @returns {Promise<string>} The version of the beA or a default version if the fetch fails
 */
async function fetchBeaVersion() {
    try {
        const response = await fetch('https://www.bea-brak.de/beaportal/api/settings', {
            timeout: 5000, // 5 second timeout
            headers: {
                'User-Agent': 'beA-Support-Chat'
            }
        });

        if (!response.ok) {
            console.error(`HTTP error! Status: ${response.status}`);
            return lastVersion;
        }

        const data = await response.json();
        lastVersion = data.version || lastVersion;
        return lastVersion;
    } catch (error) {
        console.error('Error fetching beA version:', error);
        return lastVersion;
    }
}

/**
 * Shortens the version 3.32.1.456 to 3.32.1.
 * It is not used yet because it does not improve the results.
 * @param {string} version the original version
 * @returns {string} the shortened version
 */
export function normalizedVersion(version) {
    return version.split('.').slice(0, 3).join('.');
}

/**
 * Checks if the user prompt is relevant to the beA.
 * Executes a chat with a simple developer prompt and no web search first.
 * And then let's the AI evaluate this chat if it relates to beA or not.
 * @param {string} userPrompt The user prompt
 * @returns {Promise<boolean>} true if the user prompt is relevant to the beA, false otherwise
 */
export async function isRelevant(userPrompt) {
    try {
        // Uncomment the line below to bypass relevance check during development
        // return true;

        const categorizationAnswer = await askAiWithoutSearch(userPrompt);
        const categorizationChat = `Frage:\n${userPrompt}\n\nAntwort:\n${categorizationAnswer}`;
        const relevanceAnswer = await askAiWithModelAndPrompt(
            MODELS.MINI,
            "Bewerte bitte, ob der folgende Chat mit einem Supportagenten für das besondere elektronische Anwaltspostfach beA einen thematischen Zusammenhang zu beA hat und nicht themenfremd ist. Antworte nur mit 'Ja' oder 'Nein'.",
            categorizationChat);
        return relevanceAnswer.toLowerCase().trim() === 'ja';
    } catch (error) {
        console.error("Error in isRelevant:", error);
        return true;
    }
}

/**
 * Executes a chat with a simple developer prompt and no web search.
 * Used for initial categorization of user queries.
 * @param {string} userPrompt The user prompt
 * @returns {Promise<string>} The answer of the AI
 */
async function askAiWithoutSearch(userPrompt) {
    try {
        return await askAiWithModelAndPrompt(
            MODELS.MINI,
            "Sie sind ein hilfreicher, sachlicher und freundlicher Assistent, der Fragen zum besonderen elektronischen Anwaltspostfach beA beantwortet.",
            userPrompt);
    } catch (error) {
        console.error("Error in askAiWithoutSearch:", error);
        return "Ich konnte Ihre Anfrage leider nicht verarbeiten.";
    }
}

/**
 * Create an extended developerPrompt using the file-search with the vector store.
 * The file content will be cut to avoid an excessive prompt size.
 * It implements a Cache-Augmented Generation (CAG).
 * @param {string} userPrompt - The user's query
 * @param {string} developerPrompt - The initial developer prompt
 * @returns {Promise<{filenames: string[], prompt: string}>} - Object containing relevant filenames and enhanced prompt
 */
async function fileSearch(userPrompt, developerPrompt) {
    try {
        // Maximum size for file content and total prompt to prevent token limit issues
        const MAX_FILE_SIZE = 10000;
        const MAX_TOTAL_SIZE = 30000;
        const FILES_DIR = "files";

        const response = await search(userPrompt);

        // De-duplicate filenames but keep their order "score descending"
        const filenames = [...new Set(response.map(item => item.filename))];

        // Process file content with error handling for each file
        const fileText = filenames
            .filter(filename => {
                try {
                    const filePath = `${FILES_DIR}/${filename}`;
                    const exists = existsSync(filePath);
                    if (!exists) {
                        console.warn(`File "${filePath}" not found.`);
                    }
                    return exists;
                } catch (error) {
                    console.error(`Error checking file ${filename}:`, error);
                    return false;
                }
            })
            .map(filename => {
                try {
                    const content = readFileSync(`${FILES_DIR}/${filename}`).toString();
                    return content.substring(0, MAX_FILE_SIZE);
                } catch (error) {
                    console.error(`Error reading file ${filename}:`, error);
                    return "";
                }
            })
            .filter(content => content.length > 0) // Remove empty content
            .join("\n\n");

        return {
            filenames,
            prompt: `${developerPrompt}\n\n${fileText.substring(0, MAX_TOTAL_SIZE)}`
        };
    } catch (error) {
        console.error("Error in fileSearch:", error);
        // Return a minimal result with just the developer prompt if search fails
        return {
            filenames: [],
            prompt: developerPrompt
        };
    }
}

/**
 * Executes a chat with multiple parameters.
 * Cleans all URLs from the answer.
 * @param {string} model - The OpenAI model to use
 * @param {string} developerPrompt - The system instructions for the AI
 * @param {string} userPrompt - The user's query
 * @param {boolean} webSearchEnabled - Whether to enable web search capability
 * @returns {Promise<string>} - The processed answer from the AI
 * @throws {Error} - If the OpenAI API call fails
 */
async function askAiWithModelAndPrompt(model, developerPrompt, userPrompt, webSearchEnabled = false) {
    // Configure web search tools if enabled
    const tools = webSearchEnabled ? [{
        type: "web_search_preview",
        user_location: {
            type: "approximate",
            country: "DE"
        },
        search_context_size: "medium"
    }] : undefined;

    const tool_choice = webSearchEnabled ? "required" : undefined;

    // Set timeout to 60 s for the request
    const requestOptions = {
        timeout: 60000
    };

    const response = await openai.responses.create({
        model: model,
        instructions: developerPrompt,
        input: userPrompt,
        tools,
        tool_choice
    }, requestOptions);

    if (!response || !response.output_text) {
        throw new Error("Invalid response from OpenAI API");
    }

    return removeUtmSource(response.output_text);
}

/**
 * Add sources to the answer as formatted links.
 * @param {string[]} filenames - Array of filenames to use as sources
 * @param {string} answer - The original answer text
 * @returns {string} - The answer with appended sources
 */
function addSources(filenames, answer) {
    if (!filenames || filenames.length === 0) {
        return answer;
    }

    try {
        const heading = "\n\n**Quellen:**\n\n";
        const sources = filenames
            .filter(filename => fileIndex && fileIndex[filename])
            .map(filename => {
                const data = fileIndex[filename];
                if (!data || !data.url) {
                    console.warn(`Missing data for source: ${filename}`);
                    return null;
                }

                // Sanitize URL and title to prevent XSS
                const url = data.url.replace(/"/g, '&quot;');
                const title = data.title ?
                    data.title.replace(/</g, '&lt;').replace(/>/g, '&gt;') :
                    filename;

                return `- <a href="${url}" target="_blank">${title}</a>`;
            })
            .filter(source => source !== null)
            .join("\n");

        // Only add sources section if we have valid sources
        return sources.length > 0 ? `${answer}${heading}${sources}\n` : answer;
    } catch (error) {
        console.error("Error in addSources:", error);
        return answer; // Return original answer if there's an error
    }
}

/**
 * Executes a chat to determine what web search query the AI would use.
 * This is a diagnostic tool for analyzing how the AI formulates search queries.
 * This method is currently only used for further manual analysis of problematic user prompts.
 *
 * @param {string} userPrompt - The user's query to analyze
 * @returns {Promise<string>} - The web search query the AI would use, or "n/a" if not available
 */
export async function askAiForWebSearchQuery(userPrompt) {
    if (!userPrompt || typeof userPrompt !== 'string') {
        console.error("Invalid userPrompt provided to askAiForWebSearchQuery");
        return "n/a";
    }

    try {
        const beaVersion = await fetchBeaVersion();
        const response = await openai.responses.create({
            model: MODELS.MINI,
            instructions: `Sie sind ein hilfreicher, sachlicher und freundlicher Assistent, der ausschließlich Fragen zum besonderen elektronischen Anwaltspostfach beA beantwortet. Bleibe stets respektvoll und professionell. Die aktuelle Version des beA ist ${beaVersion}. Benutze bitte immer die Function custom_websearch, um zusätzliche Informationen aus dem Web zu erhalten.`,
            input: userPrompt,
            tools: [
                {
                    type: "function",
                    function: {
                        name: "custom_websearch",
                        description: "Searches the web using a custom search engine",
                        parameters: {
                            type: "object",
                            properties: {
                                query: {
                                    type: "string",
                                    description: "The search query"
                                }
                            },
                            required: [
                                "query"
                            ]
                        },
                        strict: false
                    }
                }
            ],
            timeout: 30000 // 30 second timeout
        });
        const toolCalls = response?.choices[0]?.message?.tool_calls;
        if (!!toolCalls) {
            const webSearchQuery = JSON.parse(toolCalls[0]?.function?.arguments)?.query;
            return webSearchQuery?.trim();
        }

        return "n/a";
    } catch (error) {
        console.error("Error in askAiForWebSearchQuery:", error);
        return "n/a";
    }
}

/**
 * Removes tracking parameters (utm_source, utm_medium, utm_campaign) from URLs in the text.
 * This improves privacy and makes URLs cleaner.
 *
 * @param {string} text - The text containing URLs to process
 * @returns {string} - The processed text with tracking parameters removed from URLs
 */
export function removeUtmSource(text) {
    if (!text || typeof text !== 'string') {
        console.warn("removeUtmSource received invalid input:", text);
        return text || "";
    }

    try {
        // List of tracking parameters to remove
        const TRACKING_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

        return text.replace(/(https?:\/\/[^?\s)]+)(\?[^?\s)]*)?/g, (match, url, params) => {
            if (!params) return url;

            try {
                const searchParams = new URLSearchParams(params.substring(1));

                // Remove all tracking parameters
                TRACKING_PARAMS.forEach(param => searchParams.delete(param));

                const remainingParams = searchParams.toString();
                return remainingParams ? `${url}?${remainingParams}` : url;
            } catch (parseError) {
                console.warn("Error parsing URL parameters:", parseError);
                return match; // Return original URL if parsing fails
            }
        });
    } catch (error) {
        console.error("Error in removeUtmSource:", error);
        return text; // Return original text if processing fails
    }
}
