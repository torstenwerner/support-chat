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

/**
 * Fetches all page URLs from the main page
 * @param {string} url of the main pages
 * @returns {Promise<Array<string>>} the URLs of the child pages
 */
async function fetchMainUrls(url) {
    const window = await windowOfUrl(url);

    const parsedUrls = window.document.querySelectorAll('nav[aria-label="Fragen und Antworten"] a')
        .values()
        .map(a => `https://portal.beasupport.de${a.href}`)
        .toArray();

    await window.close();
    return parsedUrls;
}

async function fetchTargetUrls(url) {
    const window = await windowOfUrl(url);

    const parsedUrls = window.document.querySelectorAll('.faq-list a')
        .values()
        .map(a => `https://portal.beasupport.de${a.href}`)
        .toArray();

    await window.close();
    return parsedUrls;
}

async function fetchText(url) {
    const window = await windowOfUrl(url);

    const textContent = window.document.querySelector('.faq-details')
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
    const pageUrls = await fetchMainUrls('https://portal.beasupport.de/fragen-antworten');
    return Promise.all(pageUrls.map(async url => await fetchTargetUrls(url)))
}

let i = 0;

/**
 * Fetches the main text from the url and saves it to a file.
 * @param {string} url 
 */
async function fetchAndSaveText(url) {
    const prefix = String(i++).padStart(3, '0');
    const topic = url.replace(/.*\//, '').substring(0, 16);
    const path = `portal/${prefix}-${topic}.txt`;
    const text = await fetchText(url);
    fs.writeFileSync(path, text);
    fs.appendFileSync("webapp/dist/portal-full.txt", text);
}

function prepare() {
    const directory = "portal";
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
    fs.writeFileSync("webapp/dist/portal-full.txt", "");
}

prepare();

const targetUrls = (await fetchAllUrls()).flat(1);
console.log(targetUrls.length);

await Promise.all(targetUrls.map(async url => await fetchAndSaveText(url)));
