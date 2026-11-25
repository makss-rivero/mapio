import { createHash } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import type { Geometry, NewGeometry } from './types.ts';

export function fingerprintGeometry(payload: NewGeometry) {
    return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

export function initializeCreateRequests(database: DatabaseSync) {
    // Retain each key and its original fingerprint even after its geometry is deleted.
    database.exec(`
        CREATE TABLE IF NOT EXISTS geometry_create_requests (
            request_key TEXT PRIMARY KEY,
            geometry_id INTEGER NOT NULL,
            fingerprint TEXT NOT NULL
        ) STRICT
    `);

    const legacyTable = database
        .prepare("SELECT 1 FROM sqlite_schema WHERE type = 'table' AND name = 'geometry_requests'")
        .get();
    if (!legacyTable) {
        return;
    }

    const legacyRequests = database.prepare(`
        SELECT request_key, geometry_id, geometry, name, description, category
        FROM geometry_requests
        JOIN geometries ON geometries.id = geometry_requests.geometry_id
        WHERE request_key NOT IN (SELECT request_key FROM geometry_create_requests)
    `);
    const saveRequest = database.prepare(`
        INSERT INTO geometry_create_requests (request_key, geometry_id, fingerprint)
        VALUES (?, ?, ?)
        ON CONFLICT (request_key) DO NOTHING
    `);

    for (const row of legacyRequests.all()) {
        const payload = {
            geometry: JSON.parse(String(row.geometry)) as Geometry,
            attributes: {
                name: String(row.name),
                description: String(row.description),
                category: String(row.category),
            },
        };
        saveRequest.run(row.request_key, row.geometry_id, fingerprintGeometry(payload));
    }
}
