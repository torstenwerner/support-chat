import {fetchUrls, processSite} from "./fetch-util.js";

/**
 * Fetches all page URLs from the main page
 * @returns {Promise<string[]>} the URLs of the child pages
 */
function fetchMainUrls() {
    return fetchUrls('https://portal.beasupport.de/fragen-antworten', 'nav[aria-label="Fragen und Antworten"] a',
        'https://portal.beasupport.de');
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
    const mainUrls = await fetchMainUrls();
    const allUrls = await Promise.all(mainUrls.map(async url => await fetchTargetUrls(url)));
    return allUrls.flat();
}

/**
 * Returns the URL of the status page.
 * @returns {Promise<string[]>}
 */
async function fetchStatusUrls() {
    return ['https://portal.beasupport.de/verfuegbarkeit'];
}

await processSite('portal', fetchAllUrls, '.faq-details');
await processSite('status', fetchStatusUrls, '.ce-status');
