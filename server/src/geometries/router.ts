import type { DatabaseSync } from 'node:sqlite';
import express, { type ErrorRequestHandler } from 'express';
import { GeometryRequestError } from './request-error.ts';
import { createGeometryStore } from './store.ts';
import { readNewGeometry, readRequestKey } from './validation.ts';

const jsonErrorMessages = {
    400: 'Send a valid JSON request body.',
    413: 'Geometry request exceeds the 256 KB limit.',
    415: 'The JSON request encoding is unsupported.',
};

const handleGeometryError: ErrorRequestHandler = (error: unknown, _request, response, next) => {
    if (response.headersSent) {
        next(error);
        return;
    }
    if (error instanceof GeometryRequestError) {
        response.status(error.status).json({ error: error.message });
        return;
    }
    if (error instanceof Error && 'status' in error) {
        const { status } = error;
        if (status === 400 || status === 413 || status === 415) {
            response.status(status).json({ error: jsonErrorMessages[status] });
            return;
        }
    }

    console.error('Geometry API request failed:', error);
    response.status(500).json({ error: 'Could not complete the geometry request.' });
};

export function createGeometryRouter(database: DatabaseSync) {
    const router = express.Router();
    const store = createGeometryStore(database);

    router.get('/', (_request, response) => {
        response.json(store.list());
    });
    router.post('/', express.json({ limit: '256kb' }), (request, response) => {
        const payload = readNewGeometry(request.body);
        const key = readRequestKey(request.get('Idempotency-Key'));
        response.status(201).json(store.create(payload, key));
    });
    router.use(handleGeometryError);

    return router;
}
