import { useRef, useState, type RefObject } from 'react';
import Feature from 'ol/Feature.js';
import { changedAttributes, readAttributes, type GeometryAttributes } from './map/attributes';
import {
    createGeometry,
    geometryInput,
    GeometryRequestError,
    updateGeometry,
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

export function useGeometrySave(runtime: MapRuntime | null, mutationLock: RefObject<boolean>) {
    const attempts = useRef(new WeakMap<Feature, CreateAttempt>());
    const [saving, setSaving] = useState<Feature | null>(null);
    const [feedback, setFeedback] = useState<SaveFeedback | null>(null);

    function prepareCreate(feature: Feature, attributes: GeometryAttributes) {
        const cached = attempts.current.get(feature);
        if (cached) {
            return cached;
        }
        try {
            const attempt = { key: crypto.randomUUID(), input: geometryInput(feature, attributes) };
            attempts.current.set(feature, attempt);
            return attempt;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Could not prepare geometry.';
            setFeedback({ feature, message, isError: true });
        }
    }

    async function save(feature: Feature, attributes: GeometryAttributes): Promise<boolean> {
        if (mutationLock.current || !runtime) {
            return false;
        }
        const id = feature.getId();
        const stored = typeof id === 'number';
        const changes = changedAttributes(readAttributes(feature), attributes);
        const attempt = stored ? undefined : prepareCreate(feature, attributes);
        let request: () => Promise<StoredGeometry>;
        if (attempt) {
            request = () => createGeometry(attempt.input, attempt.key);
        } else if (stored && Object.keys(changes).length > 0) {
            request = () => updateGeometry(id, changes);
        } else {
            return false;
        }

        mutationLock.current = true;
        setSaving(feature);
        setFeedback(null);
        try {
            const record = await request();
            applySavedRecord(runtime, feature, record);
            attempts.current.delete(feature);
            setFeedback({
                feature,
                message: stored
                    ? 'Attributes saved.'
                    : 'Geometry and attributes saved to the database.',
                isError: false,
            });
            return true;
        } catch (error) {
            let message = stored
                ? 'Could not confirm the attribute update. Retry Save.'
                : 'Save could not be confirmed. Retry Save to check.';
            if (wasRejected(error)) {
                attempts.current.delete(feature);
                message = error.message;
            }
            setFeedback({ feature, message, isError: true });
            return false;
        } finally {
            mutationLock.current = false;
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
