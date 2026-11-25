import { useRef, useState } from 'react';
import { isStoredGeometry } from './map/geometryApi';
import { resetView, zoomView } from './map/runtime';
import {
    canFinishDrawing,
    type EditorActions,
    type EditorState,
    type GeometryType,
} from './map/types';
import { useDrawing } from './useDrawing';
import { useGeometryDelete } from './useGeometryDelete';
import { useGeometrySave } from './useGeometrySave';
import { useMapHistory } from './useMapHistory';
import { useMapRuntime } from './useMapRuntime';
import { useSavedGeometries } from './useSavedGeometries';

export function useMapEditor() {
    const mapElement = useRef<HTMLDivElement>(null);
    const mutationLock = useRef(false);
    const [geometryType, setGeometryType] = useState<GeometryType>('Point');
    const [isDrawing, setIsDrawing] = useState(false);
    const { runtime, featureCount, selectedFeature } = useMapRuntime(mapElement);
    const persistence = useGeometrySave(runtime, mutationLock);
    const deletion = useGeometryDelete(runtime, mutationLock);
    const savedLoad = useSavedGeometries(runtime?.source, deletion.deletedIds);
    const history = useMapHistory(runtime?.source, persistence.hasPendingSave);
    const drawing = useDrawing(runtime, isDrawing, geometryType, history.recordAddition);
    const isSketching = drawing.progress.status === 'sketching';
    const clearSelection = () => runtime?.selection.getFeatures().clear();
    const view = runtime?.map.getView();
    const canDelete =
        selectedFeature !== null &&
        !isDrawing &&
        !(persistence.saving || deletion.deleting) &&
        (isStoredGeometry(selectedFeature) || !persistence.hasPendingSave(selectedFeature));

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
        if (history.canUndo) {
            clearSelection();
            history.undo();
            drawing.reset();
        }
    }

    function deleteSelected() {
        if (!selectedFeature || !canDelete) {
            return;
        }
        if (isStoredGeometry(selectedFeature)) {
            void deletion.deleteSaved(selectedFeature);
            return;
        }
        clearSelection();
        history.deleteFeature(selectedFeature);
    }

    const state: EditorState = {
        geometryType,
        isDrawing,
        featureCount,
        selectedType: selectedFeature?.getGeometry()?.getType(),
        canUndo: isSketching || history.canUndo,
        canSave: isDrawing && canFinishDrawing(drawing.progress, geometryType),
        canDelete,
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
            if (view) {
                resetView(view);
            }
        },
        zoom: (delta) => view && zoomView(view, delta),
        escape: () => {
            setIsDrawing(false);
            clearSelection();
        },
    };
    const attributeTarget = selectedFeature ?? drawing.completedFeature;
    return { mapElement, state, actions, attributeTarget, savedLoad, persistence, deletion };
}
