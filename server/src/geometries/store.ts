import type { DatabaseSync, SQLOutputValue } from 'node:sqlite';
import { GeometryRequestError } from './request-error.ts';
import type { Geometry, GeometryRecord, NewGeometry } from './types.ts';

const columns = 'id, geometry, name, description, category, created_at, updated_at';

function toRecord(row: Record<string, SQLOutputValue>): GeometryRecord {
    return {
        id: Number(row.id),
        geometry: JSON.parse(String(row.geometry)) as Geometry,
        attributes: {
            name: String(row.name),
            description: String(row.description),
            category: String(row.category),
        },
        createdAt: String(row.created_at),
        updatedAt: String(row.updated_at),
    };
}

export function createGeometryStore(database: DatabaseSync) {
    const listRows = database.prepare(`SELECT ${columns} FROM geometries ORDER BY id`);
    const insertGeometry = database.prepare(`
        INSERT INTO geometries (geometry, name, description, category)
        VALUES (?, ?, ?, ?)
        RETURNING ${columns}
    `);
    const findExisting = database.prepare(`
        SELECT ${columns}
        FROM geometries
        WHERE id = (SELECT geometry_id FROM geometry_requests WHERE request_key = ?)
    `);
    const insertRequest = database.prepare(
        'INSERT INTO geometry_requests (request_key, geometry_id) VALUES (?, ?)',
    );

    function insert(payload: NewGeometry) {
        const { name, description, category } = payload.attributes;
        const row = insertGeometry.get(
            JSON.stringify(payload.geometry),
            name,
            description,
            category,
        );
        if (!row) {
            throw new Error('The database did not return the new geometry.');
        }
        return toRecord(row);
    }

    function insertWithKey(payload: NewGeometry, key: string) {
        const existing = findExisting.get(key);
        if (existing) {
            const record = toRecord(existing);
            const previous = { geometry: record.geometry, attributes: record.attributes };
            if (JSON.stringify(previous) !== JSON.stringify(payload)) {
                throw new GeometryRequestError(
                    409,
                    'This Idempotency-Key was used for a different geometry.',
                );
            }
            return record;
        }
        const record = insert(payload);
        insertRequest.run(key, record.id);
        return record;
    }

    function create(payload: NewGeometry, key?: string) {
        if (key === undefined) {
            return insert(payload);
        }

        database.exec('BEGIN IMMEDIATE');
        try {
            const record = insertWithKey(payload, key);
            database.exec('COMMIT');
            return record;
        } catch (error) {
            if (database.isTransaction) {
                database.exec('ROLLBACK');
            }
            throw error;
        }
    }

    return { create, list: () => listRows.all().map(toRecord) };
}
