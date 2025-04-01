import {fetchUrls, processSite} from "./fetch-util.js";

/**
 * Fetches the URLs of all target pages.
 * @returns {Promise<string[]>}
 */
function fetchAllUrls() {
    return fetchUrls('https://handbuch.bea-brak.de/', '.tab-content a');
}

await processSite('manual', fetchAllUrls, '.col-md-9');
