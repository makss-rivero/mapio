import { useEffect, useRef } from 'react';
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import TileLayer from 'ol/layer/Tile.js';
import OSM from 'ol/source/OSM.js';

export default function MapView() {
    const mapElement = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!mapElement.current) {
            return;
        }

        const map = new Map({
            target: mapElement.current,
            layers: [new TileLayer({ source: new OSM() })],
            view: new View({ center: [0, 0], zoom: 2 }),
        });

        return () => map.setTarget(undefined);
    }, []);

    return <div ref={mapElement} className="app__map" aria-label="Interactive map" />;
}
