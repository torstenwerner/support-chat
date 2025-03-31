import {Window} from 'happy-dom';

/**
 * Fetches the text from the URL and normalizes it.
 * @param url of the page to fetch
 * @param selector the CSS selector where the textContent is extracted
 * @returns {Promise<string>}
 */
export async function fetchText(url, selector) {
    const window = await windowOfUrl(url);

    const textContent = window.document.querySelector(selector)
        .textContent
        .trim()
        .replace(/\n\s*/g, "\n");

    await window.close();
    return `${url}\n\n${textContent}\n\n`;
}

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
 * Create a new DOM window and loads the HTML from the URL into its document's body.
 * @param {string} url
 * @returns {Promise<Window>}
 */
async function windowOfUrl(url) {
    const window = new Window();
    // window.console = console;

    const response = await fetch(url);
    const htmlContent = await response.text()
    window.document.body.innerHTML = htmlContent;
    await window.happyDOM.waitUntilComplete();

    return window;
}
