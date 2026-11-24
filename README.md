# Mapio

A web map application for creating geographic objects. Choose the Point, LineString, or Polygon icon and press the pencil to start drawing. Home restores the Baltic view; the plus/minus buttons change zoom.

Click to place a point or add vertices, then press Save to finish the geometry on the map. Save requires at least two line vertices or three polygon vertices and returns to Select with the geometry highlighted. Double-click finishing and clicking a polygon's first vertex also work.

Use Select to pick an existing shape. Select, Escape, or the pencil toggle cancels an unfinished sketch. Undo removes the last sketch vertex or reverses the last creation/deletion. To delete a shape, select it and press the trash button. Shapes and attributes last only for the map session; refreshing clears them. Server persistence is planned.

Attributes opens a right-side Name, Description, and Category form for the selected geometry or a valid current drawing. Close and X retain the draft for that geometry. Save copies the values onto the geometry and keeps the panel open. Discard clears the form; press Save to apply the cleared values. Switching geometries restores each one's draft.

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
```

The API checks SQLite through `/api/health`. It uses Node 24's built-in `node:sqlite` and creates `server/data/mapio.sqlite` on startup. Set `PORT` or `MAPIO_DB_PATH` in the server environment to override the defaults. The server listens on loopback for local development and uses one workspace without sign-in. Geometry endpoints and frontend integration are the next step.

Use `npm run check` for formatting, linting, and types; `npm test` for geometry tests; and `npm run build` for the client production build.

`MapView.tsx` renders the interface. `useMapEditor.ts` connects the map, drawing, and history hooks; `useGeometryAttributes.ts` keeps per-geometry drafts. OpenLayers setup and geometry helpers live in `client/src/map/`. SCSS modules under `client/src/styles/` cover layout, map controls, and the attributes panel.

ESLint limits client TypeScript files to 180 code lines and functions to 80, excluding blank lines and comments. Keep each module focused on one responsibility.
