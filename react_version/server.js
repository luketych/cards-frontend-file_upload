import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
}

// Log endpoint
app.post('/api/logs', (req, res) => {
    console.log('Received logs request:', req.body);
    const logs = req.body.logs;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logFile = path.join(logsDir, `logs-${timestamp}.json`);

    // Save logs to file
    fs.writeFile(logFile, JSON.stringify(logs, null, 2), (err) => {
        if (err) {
            console.error('Error saving logs:', err);
            return res.status(500).json({ error: 'Failed to save logs' });
        }
        console.log(`Saved ${logs.length} logs to ${logFile}`);
        res.json({ message: 'Logs received and saved successfully' });
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Log server running at http://localhost:${PORT}`);
}).on('error', (err) => {
    console.error('Server error:', err);
}); 