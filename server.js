// server.js - Backend Principal para Worldlydex (Node.js & Express)
import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai'; // SDK oficial actualizado

const app = express();

// CRÍTICO: Aumentar el límite a 50mb para recibir notas de voz en Base64
app.use(express.json({ limit: '50mb' }));
app.use(cors());

// Inicializar cliente de Google GenAI
const ai = new GoogleGenAI();

const PORT = process.env.PORT || 3000;

app.post('/api/ai/consult', async (req, res) => {
    try {
        // LEEMOS EXACTAMENTE LO QUE ENVÍA EL FRONTEND ("prompt")
        const { prompt, audioData, profileContext } = req.body;
        let aiContents;

        if (audioData) {
            console.log("Procesando nota de voz entrante...");
            aiContents = [
                { text: profileContext + " Escucha con atención la nota de voz del usuario y responde directamente a lo que dice." },
                { inlineData: { data: audioData, mimeType: "audio/webm" } }
            ];
        } 
        else if (prompt) {
            console.log("Procesando solicitud de texto:", prompt.substring(0, 50) + "...");
            aiContents = prompt;
        } 
        else {
            return res.status(400).json({ success: false, error: "No se proporcionó texto ni audio." });
        }

        const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash', // O el modelo que estés usando
            contents: aiContents,
            generationConfig: {
                thinking_level: audioData ? "low" : "medium" 
            }
        });

        // EL FRONTEND ESPERA ESTRICTAMENTE LA PROPIEDAD "reply"
        res.json({ success: true, reply: response.text() });

    } catch (error) {
        console.error("Error connecting with Gemini API:", error);
        res.status(500).json({ success: false, reply: '{"status": "FAIL", "html": "<p>Error de procesamiento de IA</p>", "detectedMistake": "Error 500"}' });
    }
});

app.listen(PORT, () => {
    console.log(`Worldlydex Backend running on port ${PORT}`);
});
