import {promises as fs} from 'fs';
import {askAi} from "./ai-chat.js";

/**
 * A fat client that read the prompt from the file client-request.txt and writes the AI chat answer into the file answer.md.
 */
async function main() {
    try {
        // Read the content of client-request.txt
        const prompt = await fs.readFile('client-request.txt', 'utf8');

        // Send POST request to the REST service
        const answer = await askAi(prompt);
        await fs.writeFile('answer.md', answer, 'utf8');
        // console.log(answer);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

await main();
