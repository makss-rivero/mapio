import Map from 'ol/Map.js';
import View from 'ol/View.js';
import { defaults as defaultControls } from 'ol/control/defaults.js';
import { never } from 'ol/events/condition.js';
import Select from 'ol/interaction/Select.js';
import TileLayer from 'ol/layer/Tile.js';
import VectorLayer from 'ol/layer/Vector.js';
import { fromLonLat } from 'ol/proj.js';
import OSM from 'ol/source/OSM.js';
import VectorSource from 'ol/source/Vector.js';
import { featureStyle, selectedFeatureStyle } from './styles';

const DEFAULT_CENTER = [24.9, 56.7];
const DEFAULT_ZOOM = 7.3;

export type MapRuntime = ReturnType<typeof createMapRuntime>;

export function createMapRuntime(target: HTMLDivElement) {
    const source = new VectorSource({ wrapX: false });
    const vectorLayer = new VectorLayer({ source, style: featureStyle });
    const selection = new Select({
        layers: [vectorLayer],
        hitTolerance: 8,
        toggleCondition: never,
        style: selectedFeatureStyle,
    });
    const map = new Map({
        target,
        controls: defaultControls({ zoom: false, rotate: false }),
        layers: [new TileLayer({ source: new OSM() }), vectorLayer],
        view: new View({ center: fromLonLat(DEFAULT_CENTER), zoom: DEFAULT_ZOOM }),
    });
    map.addInteraction(selection);

    return { map, source, selection };
}

function resetView(view: View) {
    view.cancelAnimations();
    view.animate({
        center: fromLonLat(DEFAULT_CENTER),
        zoom: DEFAULT_ZOOM,
        rotation: 0,
        duration: 300,
    });
}

function zoomView(view: View, delta: number) {
    const zoom = view.getZoom();

    if (zoom !== undefined) {
        view.cancelAnimations();
        view.animate({ zoom: zoom + delta, duration: 200 });
    }
}

export function mapNavigation(view: View | undefined, abortDrawing: () => void) {
    return {
        home: () => {
            abortDrawing();
            if (view) {
                resetView(view);
            }
        },
        zoom: (delta: number) => view && zoomView(view, delta),
    };
}
