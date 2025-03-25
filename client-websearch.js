import {promises as fs} from 'fs';
import {askAiForWebSearchQuery} from "./ai-chat.js";

/**
 * A client that read the prompt from the file client-valid-requests.txt and outputs the websearch query.
 */
async function main() {
    if (process.argv.length > 2 && process.argv[2] === '--all') {
        askAllQuestions();
    } else {
        askFirstQuestion();
    }
}

async function askFirstQuestion() {
        const prompt = (await fs.readFile('client-valid-requests.txt', 'utf8')).split('\n')[0];
        const query = await askAiForWebSearchQuery(prompt);
        console.log(`- Frage: ${prompt}\n- Websearch Anfrage: ${query}\n\n`);
}

async function askAllQuestions() {
    const questions = (await fs.readFile('client-valid-requests.txt', 'utf8')).split('\n');
    try {
        await fs.truncate('websearch.md', 0);
    } catch (error) {
        await fs.writeFile('websearch.md', '', 'utf8');
    }
    for (const question of questions) {
        if (question.trim() === '') {
            continue;
        }
        console.log(`Asking question: ${question}`);
        const startTime = Date.now();
        const query = await askAiForWebSearchQuery(question);
        const endTime = Date.now();
        const processingTime = ((endTime - startTime) / 1000).toFixed(1); // Convert milliseconds to seconds
        await fs.appendFile('websearch.md', `- Frage\n${question}\n\n- Websearch Anfrage: \n${query}\n- Time: ${processingTime}s\n\n`, { flush: true }, 'utf8');
    }
}

await main();
