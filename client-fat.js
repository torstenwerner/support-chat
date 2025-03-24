import {promises as fs} from 'fs';
import {askAi} from "./ai-chat.js";

/**
 * A fat client that read the prompt from the file client-request.txt and writes the AI chat answer into the file answer.md.
 */
async function main() {
    if (process.argv.length > 2 && process.argv[2] === '--all') {
        askAllQuestions();
    } else {
        askFirstQuestion();
    }
}

async function askFirstQuestion() {
        const prompt = (await fs.readFile('client-request.txt', 'utf8')).split('\n')[0];
        const answer = await askAi(prompt);
        await fs.writeFile('chat.md', `# Frage\n${prompt}\n\n# Antwort\n${answer}`, 'utf8');
}

async function askAllQuestions() {
    const questions = (await fs.readFile('client-request.txt', 'utf8')).split('\n');
    await fs.truncate('chat.md', 0);
    for (const question of questions) {
        if (question.trim() === '') {
            continue;
        }
        console.log(`Asking question: ${question}`);
        const startTime = Date.now();
        const answer = await askAi(question);
        const endTime = Date.now();
        const processingTime = ((endTime - startTime) / 1000).toFixed(1); // Convert milliseconds to seconds
        await fs.appendFile('chat.md', `# Frage\n${question}\n\n# Antwort\n${answer}\n\nTime: ${processingTime}s\n\n`, { flush: true }, 'utf8');
    }
}

await main();
