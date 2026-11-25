import { useRef, useState, type RefObject } from 'react';
import Feature from 'ol/Feature.js';
import { changedAttributes, readAttributes, type GeometryAttributes } from './map/attributes';
import {
    createGeometry,
    geometryInput,
    GeometryRequestError,
    updateGeometry,
    type StoredGeometry,
} from './map/geometryApi';
import type { MapRuntime } from './map/runtime';

type SaveAttempt = { send: () => Promise<StoredGeometry>; isCreate: boolean };
type SaveFeedback = { feature: Feature; message: string; isError: boolean };

function applySavedRecord(runtime: MapRuntime, feature: Feature, record: StoredGeometry) {
    const duplicate = runtime.source.getFeatureById(record.id);
    const selected = runtime.selection.getFeatures();
    let replaceSelection = false;
    if (duplicate instanceof Feature && duplicate !== feature) {
        replaceSelection = selected.remove(duplicate) !== undefined;
        runtime.source.removeFeature(duplicate);
    }
    feature.set('attributes', record.attributes);
    if (feature.getId() !== record.id) {
        feature.setId(record.id);
    }
    if (replaceSelection) {
        selected.push(feature);
    }
}

function prepareSave(feature: Feature, attributes: GeometryAttributes): SaveAttempt | undefined {
    const id = feature.getId();
    if (typeof id === 'number') {
        const changes = changedAttributes(readAttributes(feature), attributes);
        if (Object.keys(changes).length > 0) {
            return { send: () => updateGeometry(id, changes), isCreate: false };
        }
        return;
    }

    const input = geometryInput(feature, attributes);
    const key = crypto.randomUUID();
    return { send: () => createGeometry(input, key), isCreate: true };
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
    const attempts = useRef(new WeakMap<Feature, SaveAttempt>());
    const [saving, setSaving] = useState<Feature | null>(null);
    const [feedback, setFeedback] = useState<SaveFeedback | null>(null);

    async function save(feature: Feature, attributes: GeometryAttributes): Promise<boolean> {
        if (mutationLock.current || !runtime) {
            return false;
        }

        let attempt: SaveAttempt | undefined;
        try {
            attempt = attempts.current.get(feature) ?? prepareSave(feature, attributes);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Could not prepare geometry.';
            setFeedback({ feature, message, isError: true });
            return false;
        }
        if (!attempt) {
            return false;
        }

        attempts.current.set(feature, attempt);
        mutationLock.current = true;
        setSaving(feature);
        setFeedback(null);
        try {
            const record = await attempt.send();
            applySavedRecord(runtime, feature, record);
            attempts.current.delete(feature);
            setFeedback({
                feature,
                message: attempt.isCreate
                    ? 'Geometry and attributes saved to the database.'
                    : 'Attributes saved.',
                isError: false,
            });
            return true;
        } catch (error) {
            let message = 'Save could not be confirmed. Retry Save to check.';
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
        hasPendingSave: (feature: Feature) => attempts.current.has(feature),
    };
}

export type GeometrySave = ReturnType<typeof useGeometrySave>;
