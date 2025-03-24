import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-testing'
});

/**
 * Asks the AI using the parameter userPrompt and returns the answer as a promise.
 * It sends a request to the OpenAI `/v1/chat/completions` API with a hard coded developer prompt
 * that asks for the vulnerability research.
 * The user prompt is limited in size to reduce the risk of prompt injection attacks.
 *
 * @param userPrompt just a CVE id e.g., CVE-2024-12397
 * @returns {Promise<string>} the AI chat answer as a promise
 */
export async function askAi(userPrompt) {
    if (await isRelevant(userPrompt)) {
        return askAiWithModelAndPrompt(
            "gpt-4o-mini-search-preview",
            "Sie sind ein hilfreicher, sachlicher und freundlicher Assistent, der ausschließlich Fragen zum besonderen elektronischen Anwaltspostfach beA beantwortet. Wenn eine Frage nicht zu diesem Thema gehört, erkläre höflich, dass du nur in diesem Themengebiet Auskunft gibst. Bleibe stets respektvoll und professionell.",
            userPrompt,
            {});
    } else {
        return "Es tut mir leid, aber ich kann Ihnen dabei nicht helfen, da ich ausschließlich Fragen zum besonderen elektronischen Anwaltspostfach (beA) beantworte. Wenn Sie Informationen zu beA benötigen, stehe ich Ihnen gerne zur Verfügung!";
    }
}

async function isRelevant(userPrompt) {
    const categorizationChat = await askAiWithoutSearch(userPrompt);
    const relevanceAnswer = await askAiWithModelAndPrompt(
        "gpt-4o-mini",
        "Bewerte bitte, ob der folgende Chat mit einem Supportagenten für das besondere elektronische Anwaltspostfach beA einen thematischen Zusammenhang zu beA hat und nicht themenfremd ist. Antworte nur mit 'Ja' oder 'Nein'.",
        categorizationChat);
    return relevanceAnswer.toLowerCase().trim() === 'ja';
}

async function askAiWithoutSearch(userPrompt) {
    return askAiWithModelAndPrompt(
        "gpt-4o-mini",
        "Sie sind ein hilfreicher, sachlicher und freundlicher Assistent, der Fragen zum besonderen elektronischen Anwaltspostfach beA beantwortet.",
        userPrompt);
}

async function askAiWithModelAndPrompt(model, developerPrompt, userPrompt, webSearchOptions = undefined) {
    const response = await openai.chat.completions.create({
        model,
        messages: [
            {
                role: "developer",
                content: developerPrompt
            },
            {
                role: "user",
                content: userPrompt
            }
        ],
        web_search_options: webSearchOptions
})
return removeUtmSource(response.choices[0].message.content);
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
