import type Feature from 'ol/Feature.js';

export type GeometryAttributes = {
    name: string;
    description: string;
    category: string;
};

export const EMPTY_ATTRIBUTES: GeometryAttributes = { name: '', description: '', category: '' };
const ATTRIBUTE_FIELDS = ['name', 'description', 'category'] as const;

export function readAttributes(feature: Feature | null): GeometryAttributes {
    const saved = feature?.get('attributes') as Partial<GeometryAttributes> | undefined;
    return {
        name: saved?.name ?? '',
        description: saved?.description ?? '',
        category: saved?.category ?? '',
    };
}

export function attributesMatch(first: GeometryAttributes, second: GeometryAttributes): boolean {
    return ATTRIBUTE_FIELDS.every((field) => first[field] === second[field]);
}

export function changedAttributes(saved: GeometryAttributes, draft: GeometryAttributes) {
    const changes: Partial<GeometryAttributes> = {};
    for (const field of ATTRIBUTE_FIELDS) {
        if (draft[field] !== saved[field]) {
            changes[field] = draft[field];
        }
    }
    return changes;
}
