import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logFilePath = path.join(__dirname, '..', 'server.log');

/**
 * Enterprise correlation ID middleware.
 * Hooks every HTTP request to append a trace correlation header,
 * enabling seamless log stitching between Express and FastAPI.
 */
export const correlationMiddleware = (req, res, next) => {
    const headerName = 'x-correlation-id';
    // Reuse existing client header or generate high-entropy trace ID
    const correlationId = req.headers[headerName] || crypto.randomUUID();
    
    req.correlationId = correlationId;
    res.setHeader('X-Correlation-ID', correlationId);
    next();
};

/**
 * Metric latency logging middleware.
 * Audits downstream API call latencies, database connections, and auth execution.
 */
export const requestLatencyLogger = (req, res, next) => {
    const start = process.hrtime();
    
    res.on('finish', () => {
        const diff = process.hrtime(start);
        const timeMs = roundToTwo((diff[0] * 1e9 + diff[1]) / 1e6);
        
        const auditLog = {
            timestamp: new Date().toISOString(),
            correlationId: req.correlationId || 'system',
            method: req.method,
            path: req.originalUrl,
            status: res.statusCode,
            latencyMs: timeMs
        };
        
        // Append trace log to server.log
        const logLine = `${JSON.stringify(auditLog)}\n`;
        fs.appendFile(logFilePath, logLine, (err) => {
            if (err) console.error('[Error] Writing correlation trace logs:', err);
        });
    });
    
    next();
};

/**
 * Stamp structured logs inside Express.
 */
export const logWithTrace = (correlationId, message, level = 'INFO') => {
    const logItem = {
        timestamp: new Date().toISOString(),
        correlationId: correlationId || 'system',
        level,
        message
    };
    console.log(`[${level}] [TraceID: ${logItem.correlationId}] ${message}`);
};

const roundToTwo = (num) => {
    return +(Math.round(num + "e+2") + "e-2");
};
