import { useEffect, useState, type RefObject } from 'react';
import type Feature from 'ol/Feature.js';
import { unByKey } from 'ol/Observable.js';
import { createMapRuntime, type MapRuntime } from './map/runtime';

export function useMapRuntime(element: RefObject<HTMLDivElement | null>) {
    const [runtime, setRuntime] = useState<MapRuntime | null>(null);
    const [featureCount, setFeatureCount] = useState(0);
    const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);

    useEffect(() => {
        if (!element.current) {
            return;
        }

        const current = createMapRuntime(element.current);
        const selected = current.selection.getFeatures();
        const updateCount = () => setFeatureCount(current.source.getFeatures().length);
        const updateSelection = () => setSelectedFeature(selected.item(0) ?? null);
        const listeners = [
            ...current.source.on(['addfeature', 'removefeature'], updateCount),
            ...selected.on(['add', 'remove'], updateSelection),
        ];
        setRuntime(current);

        return () => {
            unByKey(listeners);
            current.map.dispose();
        };
    }, [element]);

    return { runtime, featureCount, selectedFeature };
}
