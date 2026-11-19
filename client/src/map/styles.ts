import type Geometry from 'ol/geom/Geometry.js';
import LineString from 'ol/geom/LineString.js';
import MultiPoint from 'ol/geom/MultiPoint.js';
import Point from 'ol/geom/Point.js';
import Polygon from 'ol/geom/Polygon.js';
import { getArea, getLength } from 'ol/sphere.js';
import CircleStyle from 'ol/style/Circle.js';
import Fill from 'ol/style/Fill.js';
import Stroke from 'ol/style/Stroke.js';
import Style, { type StyleFunction } from 'ol/style/Style.js';
import Text from 'ol/style/Text.js';
import type { GeometryType } from './types';
import { getSketchVertices } from './geometry';

const stroke = new Stroke({ color: '#147d64', width: 3 });
const fill = new Fill({ color: 'rgba(20, 125, 100, 0.18)' });
const vertex = new CircleStyle({
    radius: 5,
    fill: new Fill({ color: '#147d64' }),
    stroke: new Stroke({ color: '#ffffff', width: 2 }),
});

function geometryStyles(geometry: Geometry, showMeasurement = true): Style[] {
    if (geometry instanceof Point) {
        return [new Style({ geometry, image: vertex })];
    }

    if (!(geometry instanceof LineString) && !(geometry instanceof Polygon)) {
        return [];
    }

    const isPolygon = geometry instanceof Polygon;
    const vertices = isPolygon
        ? geometry.getCoordinates()[0].slice(0, -1)
        : geometry.getCoordinates();
    const styles = [
        new Style({ geometry, stroke, fill }),
        new Style({ geometry: new MultiPoint(vertices), image: vertex, zIndex: 1 }),
    ];

    if (showMeasurement && vertices.length >= (isPolygon ? 3 : 2)) {
        const measurement = isPolygon
            ? `${getArea(geometry, { projection: 'EPSG:3857' }).toFixed(1)} m²`
            : `${getLength(geometry, { projection: 'EPSG:3857' }).toFixed(1)} m`;
        const position = isPolygon
            ? geometry.getInteriorPoint()
            : new Point(geometry.getCoordinateAt(0.5));

        styles.push(
            new Style({
                geometry: position,
                zIndex: 2,
                text: new Text({
                    text: measurement,
                    font: '600 14px system-ui, sans-serif',
                    fill: new Fill({ color: '#172a3a' }),
                    backgroundFill: new Fill({ color: 'rgba(255, 255, 255, 0.95)' }),
                    backgroundStroke: new Stroke({ color: '#b5c5bf', width: 1 }),
                    padding: [5, 7, 5, 7],
                    offsetY: isPolygon ? 0 : -18,
                }),
            }),
        );
    }

    return styles;
}

export const featureStyle: StyleFunction = (feature) => {
    const geometry = feature.getGeometry();
    return geometry instanceof Point ||
        geometry instanceof LineString ||
        geometry instanceof Polygon
        ? geometryStyles(geometry)
        : [];
};

export const selectedFeatureStyle: StyleFunction = (feature) => {
    const geometry = feature.getGeometry();

    if (
        !(geometry instanceof Point) &&
        !(geometry instanceof LineString) &&
        !(geometry instanceof Polygon)
    ) {
        return [];
    }

    const styles = geometryStyles(geometry);
    styles.unshift(
        new Style({
            geometry,
            stroke: new Stroke({ color: '#ffc857', width: 8 }),
            image: new CircleStyle({
                radius: 9,
                fill: new Fill({ color: '#ffc857' }),
            }),
            zIndex: -1,
        }),
    );

    return styles;
};

export function drawingStyle(type: GeometryType): StyleFunction {
    return (feature) => {
        const geometry = feature.getGeometry();

        // Draw keeps an extra coordinate for the pointer. Render only confirmed vertices.
        // Ignore the separate cursor Point and Polygon helper LineString entirely.
        if (type === 'LineString' && geometry instanceof LineString) {
            return geometryStyles(new LineString(getSketchVertices(geometry)));
        }

        if (type === 'Polygon' && geometry instanceof Polygon) {
            const vertices = getSketchVertices(geometry);

            if (vertices.length < 3) {
                return geometryStyles(new LineString(vertices), false);
            }

            return geometryStyles(new Polygon([[...vertices, vertices[0]]]));
        }

        // A Point is rendered by the feature layer only after it is placed with a click.
        return [];
    };
}
