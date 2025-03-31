import { Window } from 'happy-dom';
import fs from 'fs';

async function windowOfUrl(url) {
    const window = new Window();
    // window.console = console;

    const response = await fetch(url);
    const htmlContent = await response.text()
    window.document.body.innerHTML = htmlContent;
    await window.happyDOM.waitUntilComplete();

    return window;
}

async function fetchText(url) {
    const window = await windowOfUrl(url);

    const textContent = window.document.querySelector('.col-md-9')
        .textContent
        .trim()
        .replace(/\n\s*/g, "\n");

    await window.close();
    return `${url}\n\n${textContent}\n\n`;
}

/**
 * Fetches the URLs of all target pages.
 * @returns {Promise<Array<string>>}
 */
async function fetchAllUrls() {
    const window = await windowOfUrl('https://handbuch.bea-brak.de/');

    const parsedUrls = window.document.querySelectorAll('.tab-content a')
        .values()
        .map(a => a.href)
        .toArray();

    await window.close();
    return parsedUrls;
}

let i = 0;

/**
 * Fetches the main text from the url and saves it to a file.
 * @param {string} url 
 */
async function fetchAndSaveText(url) {
    const prefix = String(i++).padStart(3, '0');
    const topic = url.replace(/.*\//, '').substring(0,16);
    const path = `manual/${prefix}-${topic}.txt`;
    const text = await fetchText(url);
    fs.writeFileSync(path, text);
    fs.appendFileSync("webapp/dist/manual-full.txt", text);
}

function prepare() {
    const directory = "manual";
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory);
    }
    const files = fs.readdirSync(directory);
    for (const file of files) {
        if (file.endsWith('.txt')) {
            const filePath = `${directory}/${file}`;
            fs.unlinkSync(filePath);
            // console.log(`Deleted: ${filePath}`);
        }
    }
    if (!fs.existsSync("webapp/dist")) {
        fs.mkdirSync("webapp/dist");
    }
    fs.writeFileSync("webapp/dist/manual-full.txt", "");
}

prepare();

const targetUrls = await fetchAllUrls();
console.log(targetUrls.length);

await Promise.all(targetUrls.map(async url => await fetchAndSaveText(url)));
