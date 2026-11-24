export type Position = [number, number] | [number, number, number];

export type Geometry =
    | { type: 'Point'; coordinates: Position }
    | { type: 'LineString'; coordinates: Position[] }
    | { type: 'Polygon'; coordinates: Position[][] };

export interface GeometryAttributes {
    name: string;
    description: string;
    category: string;
}

export interface NewGeometry {
    geometry: Geometry;
    attributes: GeometryAttributes;
}

export interface GeometryRecord extends NewGeometry {
    id: number;
    createdAt: string;
    updatedAt: string;
}
