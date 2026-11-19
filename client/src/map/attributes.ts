import type Feature from 'ol/Feature.js';

export type GeometryAttributes = {
    name: string;
    description: string;
    category: string;
};

export const EMPTY_ATTRIBUTES: GeometryAttributes = { name: '', description: '', category: '' };

export function readAttributes(feature: Feature | null): GeometryAttributes {
    const saved = feature?.get('attributes') as Partial<GeometryAttributes> | undefined;
    return {
        name: saved?.name ?? '',
        description: saved?.description ?? '',
        category: saved?.category ?? '',
    };
}

export function attributesMatch(first: GeometryAttributes, second: GeometryAttributes): boolean {
    return (
        first.name === second.name &&
        first.description === second.description &&
        first.category === second.category
    );
}
