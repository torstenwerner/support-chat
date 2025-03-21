const REST_ENDPOINT = import.meta.env.VITE_REST_ENDPOINT;
const REST_API_KEY = import.meta.env.VITE_REST_API_KEY;

/**
 * Sends a prompt to the AI chat service and returns the response
 * @param {string} prompt - The user's prompt
 * @returns {Promise<string>} The AI's response
 */
export async function askAi(prompt) {
    const response = await fetch(REST_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': REST_API_KEY,
        },
        body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
} 