"use strict";

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 8080;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (request, response) => {
    response.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/kurse', async (request, response) => {
    try {
        const filePath = path.join(__dirname, 'data', 'kurse.json');
        const data = await fs.readFile(filePath, 'utf-8');
        const { kurse } = JSON.parse(data);
        response.status(200).json(kurse);
    } catch (error) {
        console.error('Fehler beim Lesen der Kurse:', error);
        response.status(500).json({ error: 'Kurse konnten nicht geladen werden.' });
    }
});

app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
});