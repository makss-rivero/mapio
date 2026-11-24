import { useRef, useState } from 'react';
import Feature from 'ol/Feature.js';
import type { GeometryAttributes } from './map/attributes';
import {
    createGeometry,
    geometryInput,
    GeometryRequestError,
    isStoredGeometry,
    type GeometryInput,
    type StoredGeometry,
} from './map/geometryApi';
import type { MapRuntime } from './map/runtime';

type CreateAttempt = { key: string; input: GeometryInput };
type SaveFeedback = { feature: Feature; message: string; isError: boolean };

function applySavedRecord(runtime: MapRuntime, feature: Feature, record: StoredGeometry) {
    const duplicate = runtime.source.getFeatureById(record.id);
    const selected = runtime.selection.getFeatures();
    const wasSelected = duplicate instanceof Feature && selected.getArray().includes(duplicate);
    if (duplicate instanceof Feature && duplicate !== feature) {
        selected.remove(duplicate);
        runtime.source.removeFeature(duplicate);
    }
    feature.set('attributes', record.attributes);
    feature.setId(record.id);
    if (wasSelected && duplicate !== feature) {
        selected.push(feature);
    }
}

function wasRejected(error: unknown): error is GeometryRequestError {
    return (
        error instanceof GeometryRequestError &&
        error.status >= 400 &&
        error.status < 500 &&
        error.status !== 408
    );
}

export function useGeometrySave(runtime: MapRuntime | null) {
    const attempts = useRef(new WeakMap<Feature, CreateAttempt>());
    const busy = useRef(false);
    const [saving, setSaving] = useState<Feature | null>(null);
    const [feedback, setFeedback] = useState<SaveFeedback | null>(null);

    async function save(feature: Feature, attributes: GeometryAttributes) {
        if (busy.current || !runtime || isStoredGeometry(feature)) {
            return;
        }

        let attempt = attempts.current.get(feature);
        if (!attempt) {
            try {
                attempt = { key: crypto.randomUUID(), input: geometryInput(feature, attributes) };
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : 'Could not prepare geometry.';
                setFeedback({ feature, message, isError: true });
                return;
            }
            attempts.current.set(feature, attempt);
        }

        busy.current = true;
        setSaving(feature);
        setFeedback(null);
        try {
            const record = await createGeometry(attempt.input, attempt.key);
            applySavedRecord(runtime, feature, record);
            attempts.current.delete(feature);
            setFeedback({
                feature,
                message: 'Geometry and attributes saved to the database.',
                isError: false,
            });
        } catch (error) {
            let message = 'Save could not be confirmed. Retry Save to check.';
            if (wasRejected(error)) {
                attempts.current.delete(feature);
                message = error.message;
            }
            setFeedback({ feature, message, isError: true });
        } finally {
            busy.current = false;
            setSaving(null);
        }
    }

    return {
        save,
        saving,
        feedback,
        clearFeedback: () => setFeedback(null),
        hasPendingCreate: (feature: Feature) => attempts.current.has(feature),
    };
}

export type GeometrySave = ReturnType<typeof useGeometrySave>;
