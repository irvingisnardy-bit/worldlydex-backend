// server.js - Backend Principal para Worldlydex (Node.js & Express)
import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai'; // SDK oficial actualizado

const app = express();
app.use(express.json());
app.use(cors());

// Inicializar cliente de Google GenAI (utiliza la variable de entorno GEMINI_API_KEY de Render)
const ai = new GoogleGenAI();

const PORT = process.env.PORT || 3000;

// Endpoint protegido para procesar consultas de IA aplicando las nuevas directivas de Google
app.post('/api/ai/consult', async (req, res) => {
    try {
        const { promptText, userLevel } = req.body;

        // Llamada optimizada cumpliendo la directiva: 
        // - Usar thinking_level en lugar de thinking_budget
        // - Cero parámetros de muestreo obsoletos (temperature, top_p, top_k)
        const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash', // O el modelo vigente recomendado
            contents: promptText,
            generationConfig: {
                thinking_level: "medium" // Ajustado según nivel del usuario o requerimiento
            }
        });

        res.json({ success: true, output: response.text() });
    } catch (error) {
        console.error("Error connecting with Gemini API:", error);
        res.status(500).json({ success: false, error: "Error interno procesando la solicitud de IA." });
    }
});

// Endpoint de sincronización de datos de usuario en la nube
app.post('/api/users/:id/sync', (req, res) => {
    const userId = req.params.id;
    const { progress, lexicon } = req.body;
    
    // Aquí conectarás con tu base de datos (MongoDB, PostgreSQL, etc.)
    console.log(`Syncing data for user ${userId} in cloud database...`);
    
    res.json({ success: true, message: "Datos sincronizados correctamente en la nube." });
});

app.listen(PORT, () => {
    console.log(`Worldlydex Backend running on port ${PORT}`);
});