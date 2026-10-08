// server.js - Backend Principal para Worldlydex (Node.js & Express)
import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai'; // SDK oficial actualizado

const app = express();

// Aumentar el límite a 50mb para recibir notas de voz en Base64
app.use(express.json({ limit: '50mb' }));
app.use(cors());

// Inicializar cliente de Google GenAI (requiere GEMINI_API_KEY en entorno)
const ai = new GoogleGenAI({}); 

const PORT = process.env.PORT || 3000;

app.post('/api/ai/consult', async (req, res) => {
    try {
        const { prompt, audioData, profileContext } = req.body;
        let finalContents;

        if (audioData) {
            console.log("Procesando nota de voz entrante...");
            finalContents = [
                profileContext + " Escucha con atención la nota de voz del usuario y responde directamente a lo que dice.",
                { inlineData: { data: audioData, mimeType: "audio/webm" } }
            ];
        } 
        else if (prompt) {
            console.log("Procesando solicitud de texto:", prompt.substring(0, 50) + "...");
            finalContents = prompt;
        } 
        else {
            return res.status(400).json({ success: false, error: "No se proporcionó texto ni audio." });
        }

        // USO CORRECTO DEL SDK @google/genai Y MODELO gemini-3.8-flash
        const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash', 
            contents: finalContents,
            config: {
                 // Configuración por defecto
            }
        });

        // CRÍTICO: En el nuevo SDK, .text es una propiedad, NO una función (sin paréntesis)
        res.json({ success: true, reply: response.text });

    } catch (error) {
        console.error("Error connecting with Gemini API:", error);
        res.status(500).json({ success: false, reply: '{"status": "FAIL", "html": "<p>Error interno del servidor de IA</p>", "detectedMistake": "Error 500"}' });
    }
});

app.listen(PORT, () => {
    console.log(`Worldlydex Backend running on port ${PORT}`);
});
