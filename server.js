import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint for chat text generation
app.post('/api/chat', async (req, res) => {
    try {
        const { message, history, systemPrompt, npcName } = req.body;
        
        let messages = [
            { role: 'system', content: systemPrompt }
        ];
        if (history && history.length > 0) {
            history.forEach(entry => {
                messages.push({
                    role: entry.role === 'user' ? 'user' : 'assistant',
                    content: entry.content
                });
            });
        }
        messages.push({ role: 'user', content: message });

        const pollinationsUrl = `https://text.pollinations.ai/openai/chat/completions`;

        const response = await fetch(pollinationsUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: messages,
                model: 'openai'
            })
        });
        
        if (!response.ok) {
            throw new Error(`Pollinations API error: ${response.statusText}`);
        }

        const data = await response.json();
        res.json({ reply: data.choices[0].message.content });

    } catch (error) {
        console.error("Chat API Error:", error);
        res.status(500).json({ error: "Failed to generate dialogue." });
    }
});

// Endpoint for image generation (comic panels)
app.post('/api/image', async (req, res) => {
    try {
        const { sceneDescription, characterContext } = req.body;
        
        // Enhance the prompt for a comic panel style
        const imagePrompt = `${characterContext || 'cyberpunk character'}, comic book style panel, sci-fi illustration, detailed line art, cinematic lighting, ${sceneDescription}`;
        const encodedPrompt = encodeURIComponent(imagePrompt);
        
        // Pollinations Image API uses GET with random seed for uniqueness
        const randomSeed = Math.floor(Math.random() * 1000000);
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=400&nologo=true&seed=${randomSeed}`;

        // Return the URL to the frontend so it can render the image tag
        res.json({ imageUrl });

    } catch (error) {
        console.error("Image API Error:", error);
        res.status(500).json({ error: "Failed to generate image." });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
