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
    onClick,
}: MapButtonProps) {
    return (
        <button
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
