import { useEffect, useState } from 'react';
import type Feature from 'ol/Feature.js';
import {
    attributesMatch,
    EMPTY_ATTRIBUTES,
    readAttributes,
    type GeometryAttributes,
} from './map/attributes';

export type AttributesEditor = ReturnType<typeof useGeometryAttributes>;

export function useGeometryAttributes(target: Feature | null) {
    const [panelOpen, setPanelOpen] = useState(false);
    const [drafts, setDrafts] = useState(new Map<Feature, GeometryAttributes>());
    const [feedback, setFeedback] = useState<{ feature: Feature; text: string } | null>(null);
    const saved = readAttributes(target);
    const draft = (target && drafts.get(target)) || saved;
    const isDirty = !attributesMatch(draft, saved);

    useEffect(() => {
        if (!target) {
            setPanelOpen(false);
        }
    }, [target]);

    function updateDraft(values: GeometryAttributes) {
        if (target) {
            setDrafts((previous) => new Map(previous).set(target, values));
        }
    }

    function change(field: keyof GeometryAttributes, value: string) {
        updateDraft({ ...draft, [field]: value });
        setFeedback(null);
    }

    function save() {
        if (target) {
            target.set('attributes', { ...draft });
            setFeedback({ feature: target, text: 'Attributes saved on this map.' });
        }
    }

    function discard() {
        if (target) {
            updateDraft({ ...EMPTY_ATTRIBUTES });
            setFeedback({ feature: target, text: 'Form cleared. Save to apply these changes.' });
        }
    }

    return {
        canOpen: target !== null,
        isOpen: panelOpen && target !== null,
        geometryType: target?.getGeometry()?.getType(),
        draft,
        isDirty,
        message: feedback?.feature === target ? feedback.text : '',
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
