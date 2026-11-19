import AttributeFields from './AttributeFields';
import MapIcon from './MapIcon';
import type { AttributesEditor } from './useGeometryAttributes';

export default function AttributesPanel({ editor }: { editor: AttributesEditor }) {
    if (!editor.isOpen) {
        return null;
    }

    return (
        <aside
            id="geometry-attributes"
            className="attributes-panel"
            aria-labelledby="attributes-title"
        >
            <header className="attributes-panel__header">
                <div>
                    <h2 id="attributes-title">Attributes</h2>
                    <p>{editor.geometryType} geometry</p>
                </div>
                <button
                    className="attributes-panel__close"
                    type="button"
                    aria-label="Close attributes"
                    title="Close attributes"
                    onClick={editor.close}
                >
                    <MapIcon name="close" />
                </button>
            </header>
            <form
                className="attributes-panel__form"
                onSubmit={(event) => {
                    event.preventDefault();
                    editor.save();
                }}
            >
                <AttributeFields draft={editor.draft} change={editor.change} />
                <p className="attributes-panel__feedback" role="status">
                    {editor.message ||
                        (editor.isDirty ? 'Unsaved changes' : 'Details for this geometry')}
                </p>
                <footer className="attributes-panel__actions">
                    <button
                        type="button"
                        aria-label="Close attributes panel"
                        onClick={editor.close}
                    >
                        Close
                    </button>
                    <button type="button" aria-label="Discard attributes" onClick={editor.discard}>
                        Discard
                    </button>
                    <button
                        type="submit"
                        className="attributes-panel__save"
                        aria-label="Save attributes"
                    >
                        Save
                    </button>
                </footer>
            </form>
        </aside>
    );
}
