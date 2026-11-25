import type Feature from 'ol/Feature.js';

export const GEOMETRY_TYPES = ['Point', 'LineString', 'Polygon'] as const;
export type GeometryType = (typeof GEOMETRY_TYPES)[number];

export const MINIMUM_VERTICES: Record<GeometryType, number> = {
    Point: 1,
    LineString: 2,
    Polygon: 3,
};

export type DrawingProgress =
    { status: 'idle' } | { status: 'sketching'; vertexCount: number } | { status: 'finished' };

export function canFinishDrawing(progress: DrawingProgress, type: GeometryType): boolean {
    if (progress.status === 'finished') {
        return true;
    }

    return progress.status === 'sketching' && progress.vertexCount >= MINIMUM_VERTICES[type];
}

export type EditorState = {
    geometryType: GeometryType;
    isDrawing: boolean;
    canUndo: boolean;
    canFinishDrawing: boolean;
    canSaveGeometry: boolean;
    canDelete: boolean;
    featureCount: number;
    selectedType?: string;
};

export type EditorActions = {
    chooseGeometry: (type: GeometryType) => void;
    toggleDrawing: () => void;
    select: () => void;
    finishDrawing: () => Feature | null;
    undo: () => void;
    deleteSelected: () => void;
    home: () => void;
    zoom: (delta: number) => void;
    escape: () => void;
};
