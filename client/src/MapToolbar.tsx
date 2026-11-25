import type { RefObject } from 'react';
import MapButton from './MapButton';
import { GEOMETRY_TYPES, type EditorActions, type EditorState } from './map/types';
import type { AttributesEditor } from './useGeometryAttributes';

type ToolbarProps = {
    state: EditorState;
    actions: EditorActions;
    attributes: Pick<AttributesEditor, 'canOpen' | 'isOpen' | 'open'> & {
        buttonRef: RefObject<HTMLButtonElement | null>;
    };
};

function DrawingTools({ state, actions, attributes }: ToolbarProps) {
    return (
        <div className="drawing-tools" role="group" aria-label="Drawing tools">
            <MapButton
                icon="select"
                label="Select geometry"
                pressed={!state.isDrawing}
                onClick={actions.select}
            />
            <MapButton
                icon="draw"
                label="Draw geometry"
                pressed={state.isDrawing}
                hint={state.isDrawing ? 'Stop drawing (Esc)' : 'Start drawing'}
                onClick={actions.toggleDrawing}
            />
            <div className="drawing-tools__types" role="group" aria-label="Geometry type">
                {GEOMETRY_TYPES.map((type) => (
                    <MapButton
                        key={type}
                        icon={type}
                        label={type}
                        pressed={state.geometryType === type}
                        onClick={() => actions.chooseGeometry(type)}
                    />
                ))}
            </div>
            <MapButton
                icon="save"
                label="Save geometry"
                hint="Save the current geometry on this map"
                disabled={!state.canSave}
                onClick={actions.save}
            />
            <MapButton
                icon="undo"
                label="Undo"
                hint="Undo last vertex or action"
                disabled={!state.canUndo}
                onClick={actions.undo}
            />
            <MapButton
                ref={attributes.buttonRef}
                icon="attributes"
                label="Attributes"
                disabled={!attributes.canOpen}
                expanded={attributes.isOpen}
                controls="geometry-attributes"
                onClick={attributes.open}
            />
            <MapButton
                icon="delete"
                label="Delete selected geometry"
                className="map-button--delete"
                disabled={!state.canDelete}
                onClick={actions.deleteSelected}
            />
        </div>
    );
}

export default function MapToolbar({ state, actions, attributes }: ToolbarProps) {
    return (
        <>
            <nav className="map-navigation" aria-label="Map navigation">
                <MapButton
                    icon="home"
                    label="Home"
                    hint="Home: Baltic region"
                    onClick={actions.home}
                />
                <MapButton icon="plus" label="Zoom in" onClick={() => actions.zoom(1)} />
                <MapButton icon="minus" label="Zoom out" onClick={() => actions.zoom(-1)} />
            </nav>
            <DrawingTools state={state} actions={actions} attributes={attributes} />
        </>
    );
}
