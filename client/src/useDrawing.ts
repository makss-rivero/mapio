import { useEffect, useRef, useState } from 'react';
import type Feature from 'ol/Feature.js';
import { DrawingSession } from './map/DrawingSession';
import type { MapRuntime } from './map/runtime';
import type { DrawingProgress, GeometryType } from './map/types';

export function useDrawing(
    runtime: MapRuntime | null,
    isDrawing: boolean,
    type: GeometryType,
    onFinish: (feature: Feature) => void,
) {
    const session = useRef<DrawingSession | null>(null);
    const [progress, setProgress] = useState<DrawingProgress>({ status: 'idle' });

    useEffect(() => {
        runtime?.selection.setActive(!isDrawing);
        setProgress({ status: 'idle' });
        if (!runtime || !isDrawing) {
            return;
        }

        runtime.selection.getFeatures().clear();
        const current = new DrawingSession(runtime, type, setProgress, onFinish);
        session.current = current;
        return () => {
            current.dispose();
            session.current = null;
        };
    }, [runtime, isDrawing, type, onFinish]);

    return {
        progress,
        completedFeature:
            progress.status === 'finished'
                ? (session.current?.getCompletedFeature() ?? null)
                : null,
        finish: () => session.current?.finish(),
        abort: () => session.current?.abort(),
        undoVertex: () => session.current?.undoVertex(),
        reset: () => session.current?.reset(),
    };
}
