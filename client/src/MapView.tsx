import AttributesPanel from './AttributesPanel';
import MapStatus from './MapStatus';
import MapToolbar from './MapToolbar';
import { useGeometryAttributes } from './useGeometryAttributes';
import { useMapEditor } from './useMapEditor';

export default function MapView() {
    const { mapElement, state, actions, attributeTarget, savedLoad, persistence } = useMapEditor();
    const attributes = useGeometryAttributes(attributeTarget, persistence);
    const className = state.isDrawing ? 'map-workspace map-workspace--drawing' : 'map-workspace';

    function openAttributes() {
        if (state.isDrawing) {
            actions.save();
        }
        attributes.open();
    }

    return (
        <section
            className={className}
            aria-label="Map workspace"
            onKeyDown={(event) => {
                if (event.key === 'Escape') {
                    if (attributes.isOpen) {
                        attributes.close();
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
                    }}
                />
                <MapStatus state={state} savedLoad={savedLoad} />
            </div>
            <AttributesPanel editor={attributes} />
        </section>
    );
}
