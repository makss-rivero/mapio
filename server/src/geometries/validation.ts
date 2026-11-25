import { GeometryRequestError } from './request-error.ts';
import type { Geometry, GeometryAttributes, NewGeometry, Position } from './types.ts';

const attributeLimits = { name: 120, description: 2000, category: 60 };
const requestKeyPattern = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPosition(value: unknown): value is Position {
    if (!Array.isArray(value) || (value.length !== 2 && value.length !== 3)) {
        return false;
    }

    const [longitude, latitude, altitude] = value;
    return (
        Number.isFinite(longitude) &&
        Number.isFinite(latitude) &&
        Math.abs(longitude) <= 180 &&
        Math.abs(latitude) <= 90 &&
        (value.length === 2 || Number.isFinite(altitude))
    );
}

function isLineString(value: unknown): value is Position[] {
    return Array.isArray(value) && value.length >= 2 && value.every(isPosition);
}

function isRing(value: unknown): value is Position[] {
    if (!isLineString(value) || value.length < 4) {
        return false;
    }

    const first = value[0];
    const last = value[value.length - 1];
    return (
        first.length === last.length && first.every((ordinate, index) => ordinate === last[index])
    );
}

function readGeometry(value: unknown): Geometry {
    if (isObject(value)) {
        const { type, coordinates } = value;
        if (type === 'Point' && isPosition(coordinates)) {
            return { type, coordinates };
        }
        if (type === 'LineString' && isLineString(coordinates)) {
            return { type, coordinates };
        }
        if (
            type === 'Polygon' &&
            Array.isArray(coordinates) &&
            coordinates.length &&
            coordinates.every(isRing)
        ) {
            return { type, coordinates };
        }
    }

    throw new GeometryRequestError(
        400,
        'Send a valid GeoJSON Point, LineString or Polygon in WGS84.',
    );
}

function readAttribute(name: keyof GeometryAttributes, value: unknown): string {
    const limit = attributeLimits[name];
    if (typeof value !== 'string' || [...value].length > limit) {
        throw new GeometryRequestError(
            400,
            `Attribute "${name}" must be text up to ${limit} characters.`,
        );
    }
    return value;
}

function readAttributes(value: unknown): GeometryAttributes {
    if (!isObject(value)) {
        throw new GeometryRequestError(400, 'Attributes must be an object.');
    }

    const { name = '', description = '', category = '' } = value;
    return {
        name: readAttribute('name', name),
        description: readAttribute('description', description),
        category: readAttribute('category', category),
    };
}

export function readNewGeometry(body: unknown): NewGeometry {
    if (!isObject(body)) {
        throw new GeometryRequestError(400, 'Send a JSON object with geometry and attributes.');
    }

    return { geometry: readGeometry(body.geometry), attributes: readAttributes(body.attributes) };
}

export function readAttributeUpdate(body: unknown): Partial<GeometryAttributes> {
    if (!isObject(body) || Object.keys(body).some((key) => key !== 'attributes')) {
        throw new GeometryRequestError(400, 'Send a JSON object containing only attributes.');
    }
    if (!isObject(body.attributes)) {
        throw new GeometryRequestError(400, 'Attributes must be an object.');
    }

    const entries = Object.entries(body.attributes);
    if (!entries.length) {
        throw new GeometryRequestError(400, 'Send at least one attribute to update.');
    }

    const attributes: Partial<GeometryAttributes> = {};
    for (const [key, value] of entries) {
        if (!Object.hasOwn(attributeLimits, key)) {
            throw new GeometryRequestError(400, `Unknown attribute "${key}".`);
        }
        const name = key as keyof GeometryAttributes;
        attributes[name] = readAttribute(name, value);
    }
    return attributes;
}

export function readGeometryId(value: string): number {
    const id = Number(value);
    if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(id)) {
        throw new GeometryRequestError(400, 'Geometry ID must be a positive integer.');
    }
    return id;
}

export function readRequestKey(value: string | undefined) {
    if (value === undefined) {
        return undefined;
    }
    if (!requestKeyPattern.test(value)) {
        throw new GeometryRequestError(400, 'Idempotency-Key must be a UUID.');
    }
    return value.toLowerCase();
}
