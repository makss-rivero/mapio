import { useEffect, useRef } from 'react';
import AttributesPanel from './AttributesPanel';
import MapStatus from './MapStatus';
import MapToolbar from './MapToolbar';
import { useGeometryAttributes } from './useGeometryAttributes';
import { useMapEditor } from './useMapEditor';

export default function MapView() {
    const { mapElement, state, actions, attributeTarget, savedLoad, persistence, deletion } =
        useMapEditor();
    const attributes = useGeometryAttributes(attributeTarget, persistence, deletion.deleting);
    const attributesButton = useRef<HTMLButtonElement>(null);
    const restoreFocus = useRef(false);
    const className = [
        'map-workspace',
        state.isDrawing && 'map-workspace--drawing',
        attributes.isOpen && 'map-workspace--attributes-open',
    ]
        .filter(Boolean)
        .join(' ');

    useEffect(() => {
        if (!attributes.isOpen && restoreFocus.current) {
            restoreFocus.current = false;
            const button = attributesButton.current;
            const target = button && !button.disabled ? button : mapElement.current;
            target?.focus({ preventScroll: true });
        }
    }, [attributes.isOpen, mapElement]);

    function openAttributes() {
        if (state.isDrawing && !actions.finishDrawing()) {
            return;
        }
        attributes.open();
    }

    function saveGeometry() {
        const feature = state.isDrawing ? actions.finishDrawing() : attributeTarget;
        if (feature) {
            void attributes.saveFeature(feature);
        }
    }

    function closeAttributes() {
        restoreFocus.current = true;
        attributes.close();
    }

    return (
        <section
            className={className}
            aria-label="Map workspace"
            onKeyDown={(event) => {
                if (event.key === 'Escape') {
                    const closeOrEscape = attributes.isOpen ? closeAttributes : actions.escape;
                    closeOrEscape();
                }
            }}
        >
            <div className="map-workspace__canvas">
                <div
                    ref={mapElement}
                    className="app__map"
                    role="region"
                    aria-label="Interactive map"
                    tabIndex={0}
                />
                <MapToolbar
                    state={state}
                    actions={actions}
                    saveGeometry={saveGeometry}
                    attributes={{
                        canOpen: state.isDrawing ? state.canFinishDrawing : attributes.canOpen,
                        isOpen: attributes.isOpen,
                        open: openAttributes,
                        buttonRef: attributesButton,
                    }}
                />
                <MapStatus
                    state={state}
                    savedLoad={savedLoad}
                    deletion={deletion}
                    save={attributes.isOpen ? undefined : attributes}
                />
            </div>
            <AttributesPanel editor={attributes} onClose={closeAttributes} />
        </section>
    );
}
