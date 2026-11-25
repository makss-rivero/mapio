import { useRef, useState, type RefObject } from 'react';
import type Feature from 'ol/Feature.js';
import { deleteGeometry, GeometryRequestError } from './map/geometryApi';
import type { MapRuntime } from './map/runtime';

type DeleteMessage = { text: string; isError: boolean };

export type GeometryDeletion = {
    deleting: Feature | null;
    message: DeleteMessage | null;
    deleteSaved: (feature: Feature) => Promise<void>;
    deletedIds: RefObject<Set<number>>;
};

async function deleteFromServer(id: number) {
    try {
        await deleteGeometry(id);
    } catch (error) {
        if (error instanceof GeometryRequestError && error.status === 404) {
            return;
        }
        throw error;
    }
}

export function useGeometryDelete(
    runtime: MapRuntime | null,
    mutationLock: RefObject<boolean>,
): GeometryDeletion {
    const deletedIds = useRef(new Set<number>());
    const [deleting, setDeleting] = useState<Feature | null>(null);
    const [message, setMessage] = useState<DeleteMessage | null>(null);

    async function deleteSaved(feature: Feature) {
        const id = feature.getId();
        if (!runtime || typeof id !== 'number' || mutationLock.current) {
            return;
        }
        if (!window.confirm('Delete this saved geometry permanently?')) {
            return;
        }

        mutationLock.current = true;
        setDeleting(feature);
        setMessage(null);
        try {
            await deleteFromServer(id);
            deletedIds.current.add(id);
            runtime.selection.getFeatures().remove(feature);
            runtime.source.removeFeature(feature);
            setMessage({ text: 'Saved geometry deleted.', isError: false });
        } catch (error) {
            const text =
                error instanceof GeometryRequestError
                    ? error.message
                    : 'Could not confirm deletion. Try deleting again.';
            setMessage({ text, isError: true });
        } finally {
            mutationLock.current = false;
            setDeleting(null);
        }
    }

    return { deleting, message, deleteSaved, deletedIds };
}
