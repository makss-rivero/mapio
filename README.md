# Mapio

A web map application for creating geographic objects. Choose the Point, LineString, or Polygon icon and press the pencil to start drawing. Home restores the Baltic view; the plus/minus buttons change zoom.

Click to place a point or add vertices, then press Save to finish the geometry on the map. Save requires at least two line vertices or three polygon vertices and returns to Select with the geometry highlighted. Double-click finishing and clicking a polygon's first vertex also work.

Use Select to pick an existing shape. Select, Escape, or the pencil toggle cancels an unfinished sketch. Undo removes the last sketch vertex or reverses the creation or deletion of a local draft. To remove a draft, select it and press the trash button.

Attributes opens a right-side Name, Description, and Category form for the selected geometry or a valid current drawing. Close and X retain a draft for the current session. Save in Attributes sends the geometry and fields to SQLite and keeps the panel open. Discard clears the form. Switching drafts restores each one's values.

Saved shapes and attributes reload from SQLite when the map opens. Select a saved shape and open Attributes to view it. Editing and deleting saved records are planned. If the API cannot be reached, the map offers a load retry and preserves the form values during a save retry.

Only clicked vertices are visible. Lines display length in metres with one decimal place; polygons display area in square metres with one decimal place and a translucent fill. Measurements update after each vertex is placed and remain on completed shapes.

Requires Node.js 24 and npm 11. From the repository root:

```sh
npm install
npm run dev
```

Start the API in a separate terminal from the repository root:

```sh
npm run dev:server
curl http://127.0.0.1:3001/api/health
curl http://127.0.0.1:3001/api/geometries
```

The health endpoint returns `{"status":"ok","database":"ok"}` when it can query SQLite. The API uses Node 24's built-in `node:sqlite` and creates `server/data/mapio.sqlite` on startup. Set `PORT` or `MAPIO_DB_PATH` in the server environment to override the defaults. Vite forwards `/api` to `http://127.0.0.1:3001` in development. If you change the API port, set `MAPIO_API_TARGET` before starting Vite. The app uses one local workspace without sign-in.

`GET /api/geometries` lists saved records. `POST /api/geometries` accepts a GeoJSON `geometry` in WGS84 and an `attributes` object. The browser sends an `Idempotency-Key` on creation so it can retry an unconfirmed save without duplicating the record.

Use `npm run check` for formatting, linting, and types, `npm test` for backend geometry regression tests, and `npm run build` for the client production build.

`MapView.tsx` renders the interface. `useMapEditor.ts` connects the map, drawing, and history hooks; `useGeometryAttributes.ts` keeps per-geometry drafts. OpenLayers setup and geometry helpers live in `client/src/map/`. SCSS modules under `client/src/styles/` cover layout, map controls, and the attributes panel.

ESLint limits client TypeScript files to 180 code lines and functions to 80, excluding blank lines and comments. Keep each module focused on one responsibility.
