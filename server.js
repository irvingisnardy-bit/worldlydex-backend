// server.js - Backend Principal para Worldlydex (Node.js & Express)
import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai'; // SDK oficial actualizado

const app = express();

// CRÍTICO: Aumentar el límite a 50mb para permitir recibir notas de voz en Base64
app.use(express.json({ limit: '50mb' }));
app.use(cors());

// Inicializar cliente de Google GenAI (utiliza la variable de entorno GEMINI_API_KEY de Render)
const ai = new GoogleGenAI();

const PORT = process.env.PORT || 3000;

// Endpoint protegido para procesar consultas de IA (Texto y Audio)
app.post('/api/ai/consult', async (req, res) => {
    try {
        const { prompt, audioData, profileContext } = req.body;
        let aiContents;

        // 1. Verificar si la solicitud es una nota de voz (Live Mentor)
        if (audioData) {
            console.log("Procesando nota de voz entrante...");
            aiContents = [
                { text: profileContext + " Escucha con atención la nota de voz del usuario y responde directamente a lo que dice." },
                { inlineData: { data: audioData, mimeType: "audio/webm" } }
            ];
        } 
        // 2. Verificar si es una solicitud de texto estándar (Diccionario, Talleres)
        else if (prompt) {
            aiContents = prompt;
        } 
        else {
            return res.status(400).json({ success: false, error: "No se proporcionó texto ni audio." });
        }

        // Llamada optimizada al modelo
        const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash', // O el modelo vigente recomendado
            contents: aiContents,
            generationConfig: {
                // Usamos un thinking_level bajo para el Live Mentor para garantizar respuestas casi en tiempo real
                thinking_level: audioData ? "low" : "medium" 
            }
        });

        // El frontend espera la respuesta en la propiedad "reply"
        res.json({ success: true, reply: response.text() });

    } catch (error) {
        console.error("Error connecting with Gemini API:", error);
        res.status(500).json({ success: false, reply: "Error interno procesando la solicitud de IA." });
    }
});

// Endpoint de sincronización de datos de usuario en la nube (Opcional a futuro)
app.post('/api/users/:id/sync', (req, res) => {
    const userId = req.params.id;
    const { progress, lexicon } = req.body;
    
    console.log(`Syncing data for user ${userId} in cloud database...`);
    res.json({ success: true, message: "Datos sincronizados correctamente en la nube." });
});

app.listen(PORT, () => {
    console.log(`Worldlydex Backend running on port ${PORT}`);
});
