const ICON_PATHS = {
    home: 'M3 10 12 3l9 7M5 9v12h5v-7h4v7h5V9',
    plus: 'M12 5v14M5 12h14',
    minus: 'M5 12h14',
    draw: 'm15 4 5 5M4 20l5-1L21 7a2 2 0 0 0-5-5L4 14v6Z',
    Point: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z',
    LineString: 'm5 17 7-10 7 10M3 15h4v4H3Zm7-10h4v4h-4Zm7 10h4v4h-4Z',
    Polygon: 'm5 6 14 3-5 11-11-5Z',
    undo: 'm9 5-6 6 6 6M3 11h12a6 6 0 0 1 6 6v3',
    delete: 'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7',
    select: 'm5 3 14 9-7 1-3 7Z',
    save: 'M4 3h13l4 4v14H3V3h1ZM7 3v6h10V3M7 21v-8h10v8',
    attributes: 'M5 3h14v18H5ZM8 7h1M12 7h4M8 12h1M12 12h4M8 17h1M12 17h4',
    close: 'm6 6 12 12M18 6 6 18',
};

export type MapIconName = keyof typeof ICON_PATHS;

export default function MapIcon({ name }: { name: MapIconName }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d={ICON_PATHS[name]} />
        </svg>
    );
}
