import { useRef, useState } from 'react';
import { resetView, zoomView } from './map/runtime';
import {
    canFinishDrawing,
    type EditorActions,
    type EditorState,
    type GeometryType,
} from './map/types';
import { useDrawing } from './useDrawing';
import { useMapHistory } from './useMapHistory';
import { useMapRuntime } from './useMapRuntime';

export function useMapEditor() {
    const mapElement = useRef<HTMLDivElement>(null);
    const [geometryType, setGeometryType] = useState<GeometryType>('Point');
    const [isDrawing, setIsDrawing] = useState(false);
    const { runtime, featureCount, selectedFeature } = useMapRuntime(mapElement);
    const history = useMapHistory(runtime?.source);
    const drawing = useDrawing(runtime, isDrawing, geometryType, history.recordAddition);
    const isSketching = drawing.progress.status === 'sketching';
    const clearSelection = () => runtime?.selection.getFeatures().clear();

    function save() {
        const feature = drawing.finish();
        if (feature && runtime) {
            setIsDrawing(false);
            clearSelection();
            runtime.selection.getFeatures().push(feature);
        }
    }

    function undo() {
        if (isSketching) {
            drawing.undoVertex();
            return;
        }
        clearSelection();
        history.undo();
        drawing.reset();
    }

    function deleteSelected() {
        if (selectedFeature && !isDrawing) {
            clearSelection();
            history.deleteFeature(selectedFeature);
        }
    }

    const state: EditorState = {
        geometryType,
        isDrawing,
        featureCount,
        selectedType: selectedFeature?.getGeometry()?.getType(),
        canUndo: isSketching || history.canUndo,
        canSave: isDrawing && canFinishDrawing(drawing.progress, geometryType),
        canDelete: !isDrawing && selectedFeature !== null,
    };
    const actions: EditorActions = {
        chooseGeometry: setGeometryType,
        toggleDrawing: () => setIsDrawing((active) => !active),
        select: () => setIsDrawing(false),
        save,
        undo,
        deleteSelected,
        home: () => {
            drawing.abort();
            if (runtime) {
                resetView(runtime.map.getView());
            }
        },
        zoom: (delta) => {
            if (runtime) {
                zoomView(runtime.map.getView(), delta);
            }
        },
        escape: () => {
            setIsDrawing(false);
            clearSelection();
        },
    };
    const attributeTarget = selectedFeature ?? drawing.completedFeature;
    return { mapElement, state, actions, attributeTarget };
}
