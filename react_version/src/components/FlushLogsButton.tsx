import React from 'react';
import { Button, Box, Typography } from '@mui/material';
import { getLogs, clearLogs } from '../utils/storage';
import { debugLogger } from '../utils/logger';

interface FlushLogsButtonProps {
    onFlushComplete?: () => void;
}

const FlushLogsButton: React.FC<FlushLogsButtonProps> = ({ onFlushComplete }) => {
    const handleFlushLogs = async () => {
        try {
            const logs = await getLogs();
            if (logs.length === 0) {
                debugLogger.info('No logs to flush');
                return;
            }

            const response = await fetch('http://localhost:3001/api/logs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ logs }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            await clearLogs();
            debugLogger.info(`Successfully flushed ${logs.length} logs`);
            onFlushComplete?.();
        } catch (error) {
            debugLogger.error('Failed to flush logs:', error);
        }
    };

    return (
        <Box sx={{ mt: 2 }}>
            <Button
                variant="contained"
                color="secondary"
                onClick={handleFlushLogs}
                fullWidth
            >
                Flush Logs
            </Button>
            <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                Sends stored logs to the server and clears local storage
            </Typography>
        </Box>
    );
};

export default FlushLogsButton; 