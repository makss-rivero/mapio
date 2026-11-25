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
        if (state.isDrawing) {
            actions.save();
        }
        attributes.open();
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
                    if (attributes.isOpen) {
                        closeAttributes();
                    } else {
                        actions.escape();
                    }
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
                    attributes={{
                        canOpen: attributes.canOpen || state.canSave,
                        isOpen: attributes.isOpen,
                        open: openAttributes,
                        buttonRef: attributesButton,
                    }}
                />
                <MapStatus state={state} savedLoad={savedLoad} deletion={deletion} />
            </div>
            <AttributesPanel editor={attributes} onClose={closeAttributes} />
        </section>
    );
}
