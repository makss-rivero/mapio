import { useEffect, useRef } from 'react';
import type { AttributesEditor } from './useGeometryAttributes';

type FieldsProps = Pick<AttributesEditor, 'draft' | 'change'>;

export default function AttributeFields({ draft, change }: FieldsProps) {
    const nameInput = useRef<HTMLInputElement>(null);
    useEffect(() => {
        nameInput.current?.focus();
    }, []);

    return (
        <div className="attributes-panel__fields">
            <label htmlFor="attribute-name">Name</label>
            <input
                ref={nameInput}
                id="attribute-name"
                name="name"
                type="text"
                maxLength={120}
                value={draft.name}
                onChange={(event) => change('name', event.target.value)}
            />
            <label htmlFor="attribute-description">Description</label>
            <textarea
                id="attribute-description"
                name="description"
                rows={5}
                maxLength={2000}
                value={draft.description}
                onChange={(event) => change('description', event.target.value)}
            />
            <label htmlFor="attribute-category">Category</label>
            <input
                id="attribute-category"
                name="category"
                type="text"
                maxLength={60}
                value={draft.category}
                onChange={(event) => change('category', event.target.value)}
            />
        </div>
    );
}
