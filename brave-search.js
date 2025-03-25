import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();
const BRAVE_API_KEY = process.env.BRAVE_API_KEY;

export async function searchBrave(query) {
    try {
        const response = await fetch(
            `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}`,
            {
                headers: {
                    'Accept': 'application/json',
                    'Accept-Encoding': 'gzip',
                    'X-Subscription-Token': BRAVE_API_KEY
                }
            }
        );

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
        }

        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error:', error.message);
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    searchBrave("beA Karte wird nicht erkannt");
}
