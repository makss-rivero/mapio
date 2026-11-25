import { useEffect, useState, type RefObject } from 'react';
import type VectorSource from 'ol/source/Vector.js';
import { listGeometries, readStoredGeometry } from './map/geometryApi';

type LoadState = {
    status: 'loading' | 'ready' | 'error';
    error: string;
};

const loading: LoadState = { status: 'loading', error: '' };

export type SavedGeometriesLoad = LoadState & { retry: () => void };

export function useSavedGeometries(
    source: VectorSource | undefined,
    deletedIds: RefObject<Set<number>>,
): SavedGeometriesLoad {
    const [state, setState] = useState(loading);
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        if (!source) {
            return;
        }

        const controller = new AbortController();
        const { signal } = controller;
        void listGeometries(signal)
            .then((records) => {
                if (signal.aborted) {
                    return;
                }

                source.addFeatures(
                    records
                        .filter((record) => !deletedIds.current.has(record.id))
                        .map(readStoredGeometry),
                );
                setState({ status: 'ready', error: '' });
            })
            .catch(() => {
                if (!signal.aborted) {
                    setState({ status: 'error', error: 'Could not load saved geometries.' });
                }
            });

        return () => controller.abort();
    }, [source, attempt, deletedIds]);

    function retry() {
        setState(loading);
        setAttempt((previous) => previous + 1);
    }

    return { ...state, retry };
}
