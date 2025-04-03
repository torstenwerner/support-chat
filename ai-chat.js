import OpenAI from 'openai';
import dotenv from 'dotenv';
import {readFileSync} from 'node:fs';
import {search} from "./file-search/util.js";

dotenv.config();
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-testing'
});
const vectorStoreId = process.env.OPENAI_VECTOR_STORE_ID;

/**
 * Asks the AI using the parameter userPrompt and returns the answer.
 * It executes some specific workflow to improve the answer given by the AI.
 * @param {string} userPrompt the user prompt
 * @param {boolean} vectorStoreEnabled should the vector store be used instead of web search
 * @returns {Promise<string>} the AI chat answer
 */
export async function askAi(userPrompt, vectorStoreEnabled = false) {
    if (await isRelevant(userPrompt)) {
        const beaVersion = await fetchBeaVersion();
        return askAiWithModelAndPrompt(
            "gpt-4o-mini",
            `Sie sind ein hilfreicher, sachlicher und freundlicher Assistent, der ausschließlich Fragen zum besonderen elektronischen Anwaltspostfach beA beantwortet. Wenn eine Frage nicht zu diesem Thema gehört, erklären Sie höflich, dass Sie nur in diesem Themengebiet Auskunft geben. Bleiben Sie stets respektvoll und professionell. Ergänzen Sie bitte Verweise auf portal.beasupport.de oder handbuch.bea-brak.de, wenn diese Informationen für die Antwort hilfreich sind. Weisen Sie auf die Rolle 'VHN-Berechtigter' hin, wenn es für die Antwort hilfreich ist. Die aktuelle Version des beA ist ${beaVersion}. Eine Signatur ist für Abgabe eines elektronischen Empfangsbekenntnis nur nötig, wenn es nicht aus dem eigenen Postfach versendet wird oder Sie nicht das Recht "30 - eEBs mit VHN versenden" für dieses Postfach besitzen.

`,
            userPrompt,
            !vectorStoreEnabled,
            vectorStoreEnabled);
    } else {
        return "Es tut mir leid, aber ich kann Ihnen dabei nicht helfen, da ich ausschließlich Fragen zum besonderen elektronischen Anwaltspostfach (beA) beantworte. Wenn Sie Informationen zu beA benötigen, stehe ich Ihnen gerne zur Verfügung!";
    }
}

/**
 * Fetches the version of the beA from a REST service.
 * @returns {Promise<string>} The version of the beA
 */
async function fetchBeaVersion() {
    const response = await fetch('https://www.bea-brak.de/beaportal/api/settings');
    const data = await response.json();
    return data.version;
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
    // return true;
    const categorizationAnswer = await askAiWithoutSearch(userPrompt);
    const categorizationChat = `Frage:\n${userPrompt}\n\nAntwort:\n${categorizationAnswer}`;
    const relevanceAnswer = await askAiWithModelAndPrompt(
        "gpt-4o-mini",
        "Bewerte bitte, ob der folgende Chat mit einem Supportagenten für das besondere elektronische Anwaltspostfach beA einen thematischen Zusammenhang zu beA hat und nicht themenfremd ist. Antworte nur mit 'Ja' oder 'Nein'.",
        categorizationChat);
    return relevanceAnswer.toLowerCase().trim() === 'ja';
}

/**
 * Executes a chat with a simple developer prompt and no web search.
 * @param {string} userPrompt The user prompt
 * @returns {Promise<string>} The answer of the AI
 */
async function askAiWithoutSearch(userPrompt) {
    return askAiWithModelAndPrompt(
        "gpt-4o-mini",
        "Sie sind ein hilfreicher, sachlicher und freundlicher Assistent, der Fragen zum besonderen elektronischen Anwaltspostfach beA beantwortet.",
        userPrompt);
}

/**
 * Executes a chat with multiple parameters.
 * Cleans all URLs from the answer.
 * @param {string} model The model to use
 * @param {string} developerPrompt The developer prompt
 * @param {string} userPrompt The user prompt
 * @param {boolean} webSearchEnabled Whether web search is enabled
 * @param {boolean} vectorStoreEnabled should the vector store be used instead of web search
 * @returns {Promise<string>} The answer of the AI
 */
async function askAiWithModelAndPrompt(model, developerPrompt, userPrompt,
                                       webSearchEnabled = false, vectorStoreEnabled = false) {
    if (vectorStoreEnabled) {
        const response = await search(userPrompt);
        // console.log(JSON.stringify(response, null, 2));
        // const fileLength = response.map(item => ({ filename: item.filename, length: readFileSync(`files/${item.filename}`).length}));
        const filenames = [...new Set(response.map(item => item.filename))];
        // const fileLength = filenames.map(filename => ({ filename, length: readFileSync(`files/${filename}`).length}));
        // console.log(fileLength);
        const fileText = filenames
            .map(filename => readFileSync(`files/${filename}`).toString().substring(0, 10000))
            .join("\n\n");
        // console.log(fileText.length);
        // process.exit(0)
        // console.log(filenames);
        developerPrompt = `${developerPrompt}\n\n${fileText.substring(0, 30000)}`;
        vectorStoreEnabled = false;
    }

    const tools = webSearchEnabled ? [{
        type: "web_search_preview",
        "user_location": {
            "type": "approximate",
            "country": "DE"
        },
        "search_context_size": "medium"
    }] : (vectorStoreEnabled ? [{
            type: "file_search",
            vector_store_ids: [vectorStoreId],
        }] :
        undefined);
    const tool_choice = webSearchEnabled ? "required" : undefined;
    const response = await openai.responses.create({
        model: "gpt-4o-mini",
        instructions: developerPrompt,
        input: userPrompt,
        tools,
        tool_choice
    });
    return removeUtmSource(response.output_text);
}

/**
 * Executes a chat in order to find out which web search query the AI would use.
 * The result is more a guess than a certainty.
 * This method is currently only used for further manual analysis of problematic user prompts.
 * @param {string} userPrompt The user prompt
 * @returns {Promise<string>} The web search query
 */
export async function askAiForWebSearchQuery(userPrompt) {
    const response = await openai.responses.create({
        model: "gpt-4o-mini",
        instructions: "Sie sind ein hilfreicher, sachlicher und freundlicher Assistent, der ausschließlich Fragen zum besonderen elektronischen Anwaltspostfach beA beantwortet. Bleibe stets respektvoll und professionell. Die aktuelle Version des beA ist 3.32.1.456. Benutze bitte immer die Function custom_websearch, um zusätzliche Informationen aus dem Web zu erhalten.",
        input: userPrompt,
        tools: [
            {
                "type": "function",
                "function": {
                    "name": "custom_websearch",
                    "description": "Searches the web using a custom search engine",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "query": {
                                "type": "string",
                                "description": "The search query"
                            }
                        },
                        "required": [
                            "query"
                        ]
                    },
                    "strict": false
                }
            }
        ]
    });
    if (!!response.choices[0].message.tool_calls) {
        const webSearchQuery = JSON.parse(response.choices[0].message.tool_calls[0].function.arguments).query;
        return webSearchQuery.trim();
    }
    return "n/a";
}

/**
 * Removes the utm_source=openai parameter from URLs in the text.
 * @param {string} text The text containing URLs to process
 * @returns {string} The processed text with utm_source parameter removed from URLs
 */
export function removeUtmSource(text) {
    return text.replace(/(https?:\/\/[^?\s)]+)(\?[^?\s)]*)?/g, (match, url, params) => {
        if (!params) return url;

        const searchParams = new URLSearchParams(params.substring(1));
        searchParams.delete('utm_source');

        const remainingParams = searchParams.toString();
        return remainingParams ? `${url}?${remainingParams}` : url;
    });
}
