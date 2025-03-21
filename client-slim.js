import { promises as fs } from 'fs';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { marked } from 'marked';

dotenv.config();
const restEndpoint = process.env.REST_ENDPOINT;
const restApiKey = process.env.REST_API_KEY;

/**
 * A slim test client reading the prompt from file client-request.txt,
 * calling the REST service, and writes the AI chat answer into the files answer.html and answer.md.
 */
async function main() {
    try {
        // Read the content of client-request.txt
        const prompt = await fs.readFile('client-request.txt', 'utf8');

        // Send POST request to the REST service
        const response = await fetch(restEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': restApiKey,
            },
            body: JSON.stringify({ prompt })
        });
        if (!response.ok) {
            console.error('Fetch failed: ', response.status, response.statusText);
            process.exit(1);
        }

        const answer = await response.json();
        await fs.writeFile('answer.html', marked(answer), 'utf8');
        await fs.writeFile('answer.md', answer, 'utf8');
        // console.log(answer);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

await main();
