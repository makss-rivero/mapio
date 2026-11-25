import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { openDatabase } from '../database.ts';
import { createGeometryStore } from './store.ts';
import type { NewGeometry } from './types.ts';
import { readAttributeUpdate, readGeometryId } from './validation.ts';

const initialGeometry: NewGeometry = {
    geometry: { type: 'Point', coordinates: [24.1052, 56.9496] },
    attributes: { name: 'Riga', description: 'Original description', category: 'City' },
};
const requestKey = 'ad6ce5df-2967-434d-984a-1ea1905fd6cf';

test('attribute updates preserve geometry, ID, creation time and omitted fields', (context) => {
    const database = openDatabase(':memory:');
    context.after(() => database.close());
    const store = createGeometryStore(database);
    const original = store.create(initialGeometry);
    const originalUpdate = '2000-01-01T00:00:00.000Z';
    database
        .prepare('UPDATE geometries SET updated_at = ? WHERE id = ?')
        .run(originalUpdate, original.id);

    const updated = store.updateAttributes(original.id, { name: 'Old Riga', description: '' });

    assert.deepEqual(updated, {
        ...original,
        attributes: { name: 'Old Riga', description: '', category: 'City' },
        updatedAt: updated.updatedAt,
    });
    assert.ok(Date.parse(updated.updatedAt) > Date.parse(originalUpdate));
    assert.deepEqual(store.list(), [updated]);
    assert.throws(() => store.updateAttributes(original.id + 1, { name: '' }), { status: 404 });
});

test('attribute updates validate known text fields and geometry IDs', () => {
    assert.deepEqual(readAttributeUpdate({ attributes: { name: '', category: 'City' } }), {
        name: '',
        category: 'City',
    });
    assert.equal(readGeometryId('42'), 42);

    for (const body of [
        null,
        {},
        { attributes: [] },
        { attributes: {} },
        { attributes: { name: null } },
        { attributes: { category: 'x'.repeat(61) } },
        { attributes: { name: 'City', unknown: '' } },
        { attributes: { name: 'City' }, geometry: initialGeometry.geometry },
    ]) {
        assert.throws(() => readAttributeUpdate(body), { status: 400 }, JSON.stringify(body));
    }

    for (const id of ['0', '-1', '1.5', '1e2', 'NaN', '9007199254740992']) {
        assert.throws(() => readGeometryId(id), { status: 400 }, id);
    }
});

test('create retries preserve changes and cannot restore a deleted geometry', (context) => {
    const database = openDatabase(':memory:');
    context.after(() => database.close());
    const store = createGeometryStore(database);
    const original = store.create(initialGeometry, requestKey);
    const updated = store.updateAttributes(original.id, { name: 'Old Riga' });
    const changedPayload = { ...initialGeometry, attributes: updated.attributes };

    assert.deepEqual(store.create(initialGeometry, requestKey), updated);
    assert.throws(() => store.create(changedPayload, requestKey), { status: 409 });

    store.remove(original.id);

    assert.throws(() => store.remove(original.id), { status: 404 });
    assert.throws(() => store.create(initialGeometry, requestKey), { status: 410 });
    assert.deepEqual(store.list(), []);
});

test('existing create keys migrate and prevent restoration after reopening the database', (context) => {
    const directory = mkdtempSync(join(tmpdir(), 'mapio-test-'));
    const path = join(directory, 'mapio.sqlite');
    context.after(() => rmSync(directory, { recursive: true, force: true }));

    let geometryId: number;
    {
        using database = openDatabase(path);
        geometryId = createGeometryStore(database).create(initialGeometry).id;
        database.exec(`
            CREATE TABLE geometry_requests (
                request_key TEXT PRIMARY KEY,
                geometry_id INTEGER NOT NULL REFERENCES geometries(id) ON DELETE CASCADE
            ) STRICT
        `);
        database.prepare('INSERT INTO geometry_requests VALUES (?, ?)').run(requestKey, geometryId);
    }
    {
        using database = openDatabase(path);
        const store = createGeometryStore(database);
        store.updateAttributes(geometryId, { name: 'Old Riga' });
        assert.equal(store.create(initialGeometry, requestKey).attributes.name, 'Old Riga');
        store.remove(geometryId);
        assert.equal(
            database.prepare('SELECT count(*) AS count FROM geometry_requests').get()?.count,
            0,
        );
    }
    {
        using database = openDatabase(path);
        const store = createGeometryStore(database);
        assert.throws(() => store.create(initialGeometry, requestKey), { status: 410 });
        assert.deepEqual(store.list(), []);
    }
});
