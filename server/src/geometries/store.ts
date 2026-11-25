import type { DatabaseSync, SQLOutputValue } from 'node:sqlite';
import { fingerprintGeometry } from './create-requests.ts';
import { GeometryRequestError } from './request-error.ts';
import type { Geometry, GeometryAttributes, GeometryRecord, NewGeometry } from './types.ts';

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
    const findRequest = database.prepare(`
        SELECT fingerprint, ${columns}
        FROM geometry_create_requests
        LEFT JOIN geometries ON geometries.id = geometry_create_requests.geometry_id
        WHERE request_key = ?
    `);
    const insertRequest = database.prepare(`
        INSERT INTO geometry_create_requests (request_key, geometry_id, fingerprint)
        VALUES (?, ?, ?)
    `);
    const updateRow = database.prepare(`
        UPDATE geometries
        SET name = COALESCE(?, name),
            description = COALESCE(?, description),
            category = COALESCE(?, category),
            updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        WHERE id = ?
        RETURNING ${columns}
    `);
    const deleteRow = database.prepare('DELETE FROM geometries WHERE id = ?');

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
        const fingerprint = fingerprintGeometry(payload);
        const existing = findRequest.get(key);
        if (existing) {
            if (existing.fingerprint !== fingerprint) {
                throw new GeometryRequestError(
                    409,
                    'This Idempotency-Key was used for a different geometry.',
                );
            }
            if (existing.id === null) {
                throw new GeometryRequestError(
                    410,
                    'The geometry created by this request was deleted.',
                );
            }
            return toRecord(existing);
        }
        const record = insert(payload);
        insertRequest.run(key, record.id, fingerprint);
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

    function updateAttributes(
        id: number,
        { name, description, category }: Partial<GeometryAttributes>,
    ) {
        const row = updateRow.get(name ?? null, description ?? null, category ?? null, id);
        if (!row) {
            throw new GeometryRequestError(404, 'Geometry not found.');
        }
        return toRecord(row);
    }

    function remove(id: number) {
        if (deleteRow.run(id).changes === 0) {
            throw new GeometryRequestError(404, 'Geometry not found.');
        }
    }

    return { create, updateAttributes, remove, list: () => listRows.all().map(toRecord) };
}
