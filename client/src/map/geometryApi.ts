import Feature from 'ol/Feature.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import type { GeometryAttributes } from './attributes';

const endpoint = '/api/geometries';
const projection = { dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857' };
const format = new GeoJSON();

type MapGeometry = Extract<
    ReturnType<GeoJSON['writeGeometryObject']>,
    { type: 'Point' | 'LineString' | 'Polygon' }
>;

export type GeometryInput = { geometry: MapGeometry; attributes: GeometryAttributes };
export type StoredGeometry = GeometryInput & { id: number; createdAt: string; updatedAt: string };

export class GeometryRequestError extends Error {
    constructor(
        message: string,
        readonly status: number,
    ) {
        super(message);
    }
}

async function fetchRequest(path: string, options: RequestInit): Promise<Response> {
    const response = await fetch(path, options);

    if (!response.ok) {
        const body: unknown = await response.json().catch(() => null);
        const message =
            body && typeof body === 'object' && 'error' in body && typeof body.error === 'string'
                ? body.error
                : `Mapio API returned HTTP ${response.status}.`;
        throw new GeometryRequestError(message, response.status);
    }

    return response;
}

async function fetchJson<T>(path: string, options: RequestInit): Promise<T> {
    return (await fetchRequest(path, options)).json() as Promise<T>;
}

export function listGeometries(signal?: AbortSignal) {
    const timeout = AbortSignal.timeout(15000);
    return fetchJson<StoredGeometry[]>(endpoint, {
        signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    });
}

export function createGeometry(input: GeometryInput, requestKey: string) {
    return fetchJson<StoredGeometry>(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': requestKey },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(15000),
    });
}

export function updateGeometry(id: number, attributes: Partial<GeometryAttributes>) {
    return fetchJson<StoredGeometry>(`${endpoint}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attributes }),
        signal: AbortSignal.timeout(15000),
    });
}

export async function deleteGeometry(id: number): Promise<void> {
    await fetchRequest(`${endpoint}/${id}`, {
        method: 'DELETE',
        signal: AbortSignal.timeout(15000),
    });
}

export function geometryInput(feature: Feature, attributes: GeometryAttributes): GeometryInput {
    const shape = feature.getGeometry();
    if (shape) {
        const geometry = format.writeGeometryObject(shape, projection);
        if (
            geometry.type === 'Point' ||
            geometry.type === 'LineString' ||
            geometry.type === 'Polygon'
        ) {
            return { geometry, attributes };
        }
    }
    throw new Error('Choose a finished point, line, or polygon to save.');
}

export function readStoredGeometry(record: StoredGeometry) {
    const geometry = format.readGeometry(record.geometry, projection);
    if (!geometry) {
        throw new Error('A saved record is missing its geometry.');
    }
    const feature = new Feature({ geometry, attributes: record.attributes });
    feature.setId(record.id);
    return feature;
}

export function isStoredGeometry(feature: Feature) {
    return typeof feature.getId() === 'number';
}
