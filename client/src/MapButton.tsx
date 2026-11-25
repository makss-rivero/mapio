import type { Ref } from 'react';
import MapIcon, { type MapIconName } from './MapIcon';

type MapButtonProps = {
    icon: MapIconName;
    label: string;
    hint?: string;
    pressed?: boolean;
    disabled?: boolean;
    className?: string;
    expanded?: boolean;
    controls?: string;
    ref?: Ref<HTMLButtonElement>;
    onClick: () => void;
};

export default function MapButton({
    icon,
    label,
    hint,
    pressed,
    disabled,
    className = '',
    expanded,
    controls,
    ref,
    onClick,
}: MapButtonProps) {
    return (
        <button
            ref={ref}
            className={`map-button ${className}`.trim()}
            type="button"
            aria-label={label}
            title={hint ?? label}
            aria-pressed={pressed}
            aria-expanded={expanded}
            aria-controls={controls}
            disabled={disabled}
            onClick={onClick}
        >
            <MapIcon name={icon} />
        </button>
    );
}
