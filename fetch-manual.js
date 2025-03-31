import fs from 'fs';
import {fetchText, fetchUrls} from "./fetch-util.js";

/**
 * Fetches the URLs of all target pages.
 * @returns {Promise<string[]>}
 */
function fetchAllUrls() {
    return fetchUrls('https://handbuch.bea-brak.de/', '.tab-content a');
}

let i = 0;

/**
 * Fetches the main text from the url and saves it to a file.
 * @param {string} url
 */
async function fetchAndSaveText(url) {
    const prefix = String(i++).padStart(3, '0');
    const topic = url.replace(/.*\//, '').substring(0, 16);
    const path = `manual/${prefix}-${topic}.txt`;
    const text = await fetchText(url, '.col-md-9');
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
console.log(`fetching ${targetUrls.length} pages`);

await Promise.all(targetUrls.map(async url => await fetchAndSaveText(url)));
