import { useEffect, useState } from 'react';
import type Feature from 'ol/Feature.js';
import {
    attributesMatch,
    EMPTY_ATTRIBUTES,
    readAttributes,
    type GeometryAttributes,
} from './map/attributes';
import { isStoredGeometry } from './map/geometryApi';
import type { GeometrySave } from './useGeometrySave';

export type AttributesEditor = ReturnType<typeof useGeometryAttributes>;

export function useGeometryAttributes(
    target: Feature | null,
    persistence: GeometrySave,
    deleting: Feature | null,
) {
    const [panelOpen, setPanelOpen] = useState(false);
    const [drafts, setDrafts] = useState(new Map<Feature, GeometryAttributes>());
    const [feedback, setFeedback] = useState<{ feature: Feature; text: string } | null>(null);
    const stored = target !== null && isStoredGeometry(target);
    const pending = target !== null && persistence.hasPendingCreate(target);
    const isSaving = target !== null && persistence.saving === target;
    const readOnly = pending || isSaving || (target !== null && target === deleting);
    const saved = readAttributes(target);
    const draft = (target && drafts.get(target)) || saved;
    const isDirty = !attributesMatch(draft, saved);
    const canSave = target !== null && !persistence.saving && !deleting && (!stored || isDirty);
    const saveFeedback = persistence.feedback?.feature === target ? persistence.feedback : null;
    const message = getMessage({
        isSaving,
        stored,
        pending,
        feedback: saveFeedback?.message ?? (feedback?.feature === target ? feedback.text : ''),
    });

    useEffect(() => {
        if (!target) {
            setPanelOpen(false);
        }
    }, [target]);

    function updateDraft(values: GeometryAttributes) {
        if (target && !readOnly) {
            setDrafts((previous) => new Map(previous).set(target, values));
        }
    }

    function change(field: keyof GeometryAttributes, value: string) {
        updateDraft({ ...draft, [field]: value });
        setFeedback(null);
        persistence.clearFeedback();
    }

    function discard() {
        if (target && !readOnly) {
            updateDraft({ ...EMPTY_ATTRIBUTES });
            setFeedback({ feature: target, text: 'Form cleared. Save to apply these changes.' });
            persistence.clearFeedback();
        }
    }

    async function save() {
        if (!canSave || !target) {
            return;
        }
        setFeedback(null);
        if (await persistence.save(target, draft)) {
            setDrafts((previous) => {
                const remaining = new Map(previous);
                remaining.delete(target);
                return remaining;
            });
        }
    }

    return {
        canOpen: target !== null,
        isOpen: panelOpen && target !== null,
        geometryType: target?.getGeometry()?.getType(),
        draft,
        isDirty,
        readOnly,
        isSaving,
        canSave,
        message,
        hasError: saveFeedback?.isError || (pending && !isSaving),
        change,
        save,
        discard,
        open: () => {
            setPanelOpen(true);
            setFeedback(null);
        },
        close: () => setPanelOpen(false),
    };
}

function getMessage({
    isSaving,
    stored,
    pending,
    feedback,
}: {
    isSaving: boolean;
    stored: boolean;
    pending: boolean;
    feedback: string;
}) {
    if (isSaving) {
        return stored ? 'Saving attributes…' : 'Saving geometry and attributes…';
    }
    if (feedback) {
        return feedback;
    }
    if (stored) {
        return 'Saved in the database.';
    }
    return pending ? 'Save could not be confirmed. Retry Save to check.' : '';
}
