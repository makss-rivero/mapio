import type { DatabaseSync } from 'node:sqlite';
import express, { type ErrorRequestHandler } from 'express';
import { GeometryRequestError } from './request-error.ts';
import { createGeometryStore } from './store.ts';
import {
    readAttributeUpdate,
    readGeometryId,
    readNewGeometry,
    readRequestKey,
} from './validation.ts';

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
    const parseJson = express.json({ limit: '256kb' });

    router.get('/', (_request, response) => {
        response.json(store.list());
    });
    router.post('/', parseJson, (request, response) => {
        const payload = readNewGeometry(request.body);
        const key = readRequestKey(request.get('Idempotency-Key'));
        response.status(201).json(store.create(payload, key));
    });
    router.patch('/:id', parseJson, (request, response) => {
        const id = readGeometryId(request.params.id);
        const attributes = readAttributeUpdate(request.body);
        response.json(store.updateAttributes(id, attributes));
    });
    router.delete('/:id', (request, response) => {
        store.remove(readGeometryId(request.params.id));
        response.status(204).end();
    });
    router.use(handleGeometryError);

    return router;
}
