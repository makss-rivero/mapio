import { useCallback, useState } from 'react';
import type Feature from 'ol/Feature.js';
import type VectorSource from 'ol/source/Vector.js';

type HistoryEntry = { action: 'add' | 'delete'; feature: Feature };

export function useMapHistory(source?: VectorSource) {
    const [entries, setEntries] = useState<HistoryEntry[]>([]);
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
        const entry = entries.at(-1);

        if (!entry || !source) {
            return;
        }

        if (entry.action === 'add') {
            source.removeFeature(entry.feature);
        } else {
            source.addFeature(entry.feature);
        }

        setEntries((previous) => previous.slice(0, -1));
    }

    return { recordAddition, deleteFeature, undo, canUndo: entries.length > 0 };
}
