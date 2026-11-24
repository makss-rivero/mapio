import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export function openDatabase(path: string) {
    mkdirSync(dirname(path), { recursive: true });
    const database = new DatabaseSync(path);

    try {
        database.exec(`
            CREATE TABLE IF NOT EXISTS geometries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                geometry TEXT NOT NULL CHECK (json_valid(geometry)),
                name TEXT NOT NULL DEFAULT '' CHECK (length(name) <= 120),
                description TEXT NOT NULL DEFAULT '' CHECK (length(description) <= 2000),
                category TEXT NOT NULL DEFAULT '' CHECK (length(category) <= 60),
                created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
                updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
            ) STRICT
        `);
        return database;
    } catch (error) {
        database.close();
        throw error;
    }
}
