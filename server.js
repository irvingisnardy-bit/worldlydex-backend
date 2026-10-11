// server.js - Backend Principal para Worldlydex (Node.js & Express)
import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';

const app = express();

app.use(express.json({ limit: '50mb' }));

const allowedOrigins = [
  'http://localhost:5500', 
  'http://127.0.0.1:5500', 
  'https://worldlydex.irvingabreuv.workers.dev'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Bloqueado por CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

const ai = new GoogleGenAI({}); 

const PORT = process.env.PORT || 3000;

// --- NUEVA RUTA LIGERA PARA EL CRON-JOB ---
app.get('/api/ping', (req, res) => {
    res.status(200).send('OK');
});

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

        const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash', 
            contents: finalContents,
            config: {}
        });

        res.json({ success: true, reply: response.text });

    } catch (error) {
        console.error("Error connecting with Gemini API:", error);
        res.status(500).json({ success: false, reply: '{"status": "FAIL", "html": "<p>Error interno del servidor de IA</p>", "detectedMistake": "Error 500"}' });
    }
});

app.listen(PORT, () => {
    console.log(`Worldlydex Backend running on port ${PORT}`);
});
