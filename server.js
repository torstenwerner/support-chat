import express from 'express';
import {askAi} from './ai-chat.js';

const app = express();
app.use(express.json());

/**
 * Implements a REST service using express.
 * The path of the REST service is `/cve-analysis` and the method is POST.
 * The user prompt is sent in the field `prompt` of the request.
 * It uses `ai-chat.js` to execute the AI chat.
 * The service response is the answer of the AI.
 */
app.post('/cve-analysis', async (req, res) => {
    try {
        const userPrompt = req.body.prompt;
        const completion = await askAi(userPrompt);
        res.json(completion);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
