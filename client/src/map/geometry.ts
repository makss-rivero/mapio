import type { Coordinate } from 'ol/coordinate.js';
import type Geometry from 'ol/geom/Geometry.js';
import LineString from 'ol/geom/LineString.js';
import Point from 'ol/geom/Point.js';
import Polygon from 'ol/geom/Polygon.js';

/** Clicked sketch vertices, excluding Draw's temporary pointer coordinate and ring closure. */
export function getSketchVertices(geometry: Geometry | undefined): Coordinate[] {
    if (geometry instanceof Point) {
        return [geometry.getCoordinates()];
    }

    if (geometry instanceof LineString) {
        // [clicked A, clicked B, pointer] becomes [A, B].
        return geometry.getCoordinates().slice(0, -1);
    }

    if (geometry instanceof Polygon) {
        const ring = geometry.getCoordinates()[0] ?? [];
        // Initially: [A, pointer]. Later: [A, B, pointer, closing A].
        // Remove the pointer and, once present, the automatic ring closure.
        return ring.slice(0, ring.length > 2 ? -2 : -1);
    }

    return [];
}
