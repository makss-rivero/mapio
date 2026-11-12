import { useEffect, useRef } from 'react';
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import TileLayer from 'ol/layer/Tile.js';
import { fromLonLat } from 'ol/proj.js';
import OSM from 'ol/source/OSM.js';

const DEFAULT_CENTER = [24.9, 56.7];
const DEFAULT_ZOOM = 7.3;

export default function MapView() {
    const mapElement = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!mapElement.current) {
            return;
        }

        const map = new Map({
            target: mapElement.current,
            layers: [new TileLayer({ source: new OSM() })],
            view: new View({ center: fromLonLat(DEFAULT_CENTER), zoom: DEFAULT_ZOOM }),
        });

        return () => map.setTarget(undefined);
    }, []);

    return <div ref={mapElement} className="app__map" aria-label="Interactive map" />;
}
