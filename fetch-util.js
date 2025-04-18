import {Window} from 'happy-dom';
import fs from "fs";
import {deleteFilesStartingWith, uploadFile} from "./file-search/util.js";

/**
 * Fetches all URLs from the page at url that are selected by selector.
 * The urlPrefix is added in front of the href value.
 * @param {string} url of the main pages
 * @param {string} selector the CSS selector to find the links
 * @param {string} urlPrefix the optional prefix that is added before the href value
 * @returns {Promise<string[]>} the URLs of the child pages
 */
export async function fetchUrls(url, selector, urlPrefix = '') {
    const window = await windowOfUrl(url);

    const parsedUrls = window.document.querySelectorAll(selector)
        .values()
        .map(a => `${urlPrefix}${a.href}`)
        .toArray();

    await window.close();
    return parsedUrls;
}

/**
 * Processes a site
 * @param {string} name of the site
 * @param {function (): Promise<string[]>} urlFetcher a function that fetches all URLs for this site
 * @param textSelector the CSS selector for the page text
 * @returns {Promise<void>}
 */
export async function processSite(name, urlFetcher, textSelector) {
    prepareOutput(name);
    const targetUrls = await urlFetcher();
    return processPages(targetUrls, textSelector, name);
}

/**
 * Prepare output directories and files.
 * @param {string} name the directory name and file name prefix
 * @return {void}
 */
async function prepareOutput(name) {
    if (!fs.existsSync("files")) {
        fs.mkdirSync("files");
    }
    const files = fs.readdirSync("files");
    for (const file of files) {
        if (file.startsWith(name) && file.endsWith('.txt')) {
            const filePath = `files/${file}`;
            fs.unlinkSync(filePath);
        }
    }
    if (!fs.existsSync("webapp/dist")) {
        fs.mkdirSync("webapp/dist");
    }
    fs.writeFileSync(`webapp/dist/${name}-full.txt`, "");
    // await deleteFilesStartingWith(name);
}

/**
 * Processes all URLs.
 * @param {string[]} urls of all pages to process
 * @param {string} selector the CSS selector for the page text
 * @param {string} name the directory name and file name prefix
 * @return {Promise<void>}
 */
async function processPages(urls, selector, name) {
    console.log(`fetching ${urls.length} ${name} pages`);
    const processor = pageProcessor(selector, name);
    const dataByFilename = {};
    await Promise.all(urls.map(async url => {
        const document = await processor(url);
        dataByFilename[document.filename] = {url, title: document.title};
    }));
    fs.writeFileSync(`files/index-${name}.json`, JSON.stringify(dataByFilename, null, 2));
}

/**
 * Return a function with a URL parameter that fetches and saves the page.
 * The function returns the filename and title;
 * It maintains an internal state between invocations.
 * @param {string} selector the CSS selector for the page text
 * @param {string} name the directory name and file name prefix
 * @return {function(url: string): Promise<{filename: string, title: string}>}
 */
function pageProcessor(selector, name) {
    let i = 0;
    return async (url) => {
        const prefix = String(i++).padStart(3, '0');
        const topic = url.replace(/.*\//, '').substring(0, 16);
        const filename = `${name}${prefix}-${topic}.txt`;
        const path = `files/${filename}`;
        const document = await fetchText(url, selector);
        fs.writeFileSync(path, document.text);
        fs.appendFileSync(`webapp/dist/${name}-full.txt`, document.text);
        await uploadFile(path);
        return {filename, title: document.title};
    }
}

/**
 * Fetches the text and title from the URL and normalizes them.
 * @param url of the page to fetch
 * @param selector the CSS selector where the textContent is extracted
 * @returns {Promise<{text: string, title: string}>}
 */
async function fetchText(url, selector) {
    const window = await windowOfUrl(url);

    const text = window.document.querySelector(selector)
        .textContent
        .trim()
        .replace(/\n\s*/g, "\n")
        .replace(/[\u00A0\t ]+/g, " ")
        .replace(/[„“"]/g, "");
    const title = window.document.title.replace(/ \| beA SUPPORT/, "");

    await window.close();
    return {text, title};
}

/**
 * Create a new DOM window and loads the HTML from the URL into its document's body.
 * @param {string} url
 * @returns {Promise<Window>}
 */
async function windowOfUrl(url) {
    const window = new Window();

    const response = await fetch(url);
    window.document.body.innerHTML = await response.text();
    await window.happyDOM.waitUntilComplete();

    return window;
}
