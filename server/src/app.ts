import type { DatabaseSync } from 'node:sqlite';
import express from 'express';
import { createGeometryRouter } from './geometries/router.ts';

export function createApp(database: DatabaseSync) {
    const app = express();
    app.disable('x-powered-by');

    app.get('/api/health', (_request, response) => {
        try {
            database.prepare('SELECT id FROM geometries LIMIT 1').get();
            response.json({ status: 'ok', database: 'ok' });
        } catch (error) {
            console.error('Database health check failed:', error);
            response.status(503).json({ status: 'unavailable', database: 'unavailable' });
        }
    });

    app.use('/api/geometries', createGeometryRouter(database));
    return app;
}
