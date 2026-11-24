import { fileURLToPath } from 'node:url';
import { createApp } from './app.ts';
import { openDatabase } from './database.ts';

const host = '127.0.0.1';
const port = Number(process.env.PORT ?? 3001);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
}

const databasePath =
    process.env.MAPIO_DB_PATH ?? fileURLToPath(new URL('../data/mapio.sqlite', import.meta.url));
const database = openDatabase(databasePath);
const app = createApp(database);

app.listen(port, host, (error) => {
    if (error) {
        database.close();
        throw error;
    }
    console.log(`Mapio API listening at http://${host}:${port}`);
});
