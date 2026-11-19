import type { EditorState, GeometryType } from './map/types';

const DRAWING_INSTRUCTIONS: Record<GeometryType, string> = {
    Point: 'Click to place a point, then press Save. Select or Esc stops drawing.',
    LineString: 'Click to add vertices. Save finishes the line after two vertices. Esc cancels.',
    Polygon: 'Click to add vertices. Save closes the polygon after three vertices. Esc cancels.',
};

function getStatusContent(state: EditorState) {
    if (state.isDrawing) {
        return {
            title: `Drawing ${state.geometryType}`,
            instructions: DRAWING_INSTRUCTIONS[state.geometryType],
        };
    }
    if (state.selectedType) {
        return {
            title: `${state.selectedType} selected`,
            instructions:
                'Use Attributes to edit details, or the trash button to delete this geometry.',
        };
    }
    return {
        title: 'Explore the map',
        instructions:
            'Select a shape on the map, or choose a geometry and press the pencil to draw.',
    };
}

export default function MapStatus({ state }: { state: EditorState }) {
    const { title, instructions } = getStatusContent(state);
    const countLabel = state.featureCount === 1 ? 'geometry' : 'geometries';
    return (
        <div className="map-status" role="status">
            <strong>{title}</strong>
            <span>{instructions}</span>
            <span className="map-status__count">
                {state.featureCount} {countLabel} · This session only
            </span>
        </div>
    );
}
