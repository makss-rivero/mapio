import { useCallback, useState } from 'react';
import type Feature from 'ol/Feature.js';
import type VectorSource from 'ol/source/Vector.js';
import { isStoredGeometry } from './map/geometryApi';

type HistoryEntry = { action: 'add' | 'delete'; feature: Feature };

export function useMapHistory(
    source: VectorSource | undefined,
    hasPendingSave: (feature: Feature) => boolean,
) {
    const [entries, setEntries] = useState<HistoryEntry[]>([]);
    const entry = entries.filter(({ feature }) => !isStoredGeometry(feature)).at(-1);
    const canUndo = entry !== undefined && !hasPendingSave(entry.feature);
    const recordAddition = useCallback((feature: Feature) => {
        setEntries((previous) => [...previous, { action: 'add', feature }]);
    }, []);

    function deleteFeature(feature: Feature) {
        if (source) {
            source.removeFeature(feature);
            setEntries((previous) => [...previous, { action: 'delete', feature }]);
        }
    }

    function undo() {
        if (!entry || !source || hasPendingSave(entry.feature)) {
            return;
        }

        if (entry.action === 'add') {
            source.removeFeature(entry.feature);
        } else {
            source.addFeature(entry.feature);
        }

        setEntries((previous) => previous.filter((item) => item !== entry));
    }

    return { recordAddition, deleteFeature, undo, canUndo };
}
