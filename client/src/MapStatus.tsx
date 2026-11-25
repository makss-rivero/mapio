import type { EditorState, GeometryType } from './map/types';
import type { GeometryDeletion } from './useGeometryDelete';
import type { SavedGeometriesLoad } from './useSavedGeometries';

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

type MapStatusProps = {
    state: EditorState;
    savedLoad: SavedGeometriesLoad;
    deletion: Pick<GeometryDeletion, 'deleting' | 'message'>;
};

export default function MapStatus({ state, savedLoad, deletion }: MapStatusProps) {
    const { title, instructions } = getStatusContent(state);
    const countLabel = state.featureCount === 1 ? 'geometry' : 'geometries';
    return (
        <div className="map-status">
            <div className="map-status__summary" role="status">
                <strong>{title}</strong>
                <span>{instructions}</span>
                <span className="map-status__count">
                    {state.featureCount} {countLabel}
                </span>
                {savedLoad.status === 'loading' && <span>Loading saved geometries…</span>}
                {savedLoad.status === 'error' && <span>{savedLoad.error}</span>}
                {deletion.deleting && <span>Deleting saved geometry…</span>}
                {deletion.message && !deletion.message.isError && (
                    <span>{deletion.message.text}</span>
                )}
            </div>
            {deletion.message?.isError && <span role="alert">{deletion.message.text}</span>}
            {savedLoad.status === 'error' && (
                <button className="map-status__retry" type="button" onClick={savedLoad.retry}>
                    Retry loading
                </button>
            )}
        </div>
    );
}
