import fs from 'fs';
import {fetchText, fetchUrls} from "./fetch-util.js";

/**
 * Fetches all page URLs from the main page
 * @param {string} url of the main pages
 * @returns {Promise<string[]>} the URLs of the child pages
 */
function fetchMainUrls(url) {
    return fetchUrls(url, 'nav[aria-label="Fragen und Antworten"] a', 'https://portal.beasupport.de');
}

/**
 * Fetch all target URLs from the subpage.
 * @param {string} url of the subpage
 * @returns {Promise<string[]>}
 */
function fetchTargetUrls(url) {
    return fetchUrls(url, '.faq-list a', 'https://portal.beasupport.de');
}

/**
 * Fetches the URLs of all target pages.
 * @returns {Promise<string[]>}
 */
async function fetchAllUrls() {
    const pageUrls = await fetchMainUrls('https://portal.beasupport.de/fragen-antworten');
    const allUrls = await Promise.all(pageUrls.map(async url => await fetchTargetUrls(url)));
    return allUrls.flat();
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
    const text = await fetchText(url, '.faq-details');
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

const targetUrls = await fetchAllUrls();
console.log(`fetching ${targetUrls.length} pages`);

await Promise.all(targetUrls.map(async url => await fetchAndSaveText(url)));
