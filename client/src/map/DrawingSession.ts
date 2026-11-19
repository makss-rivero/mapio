import type Feature from 'ol/Feature.js';
import type Geometry from 'ol/geom/Geometry.js';
import { unByKey } from 'ol/Observable.js';
import type { EventsKey } from 'ol/events.js';
import DoubleClickZoom from 'ol/interaction/DoubleClickZoom.js';
import Draw from 'ol/interaction/Draw.js';
import { getSketchVertices } from './geometry';
import type { MapRuntime } from './runtime';
import { drawingStyle } from './styles';
import { canFinishDrawing, type DrawingProgress, type GeometryType } from './types';

export class DrawingSession {
    private readonly draw: Draw;
    private readonly doubleClickZoom?: DoubleClickZoom;
    private readonly zoomWasActive: boolean;
    private readonly listeners: EventsKey[];
    private geometryListener?: EventsKey;
    private geometry?: Geometry;
    private completedFeature: Feature | null = null;
    progress: DrawingProgress = { status: 'idle' };

    constructor(
        private readonly runtime: MapRuntime,
        private readonly type: GeometryType,
        private readonly onChange: (progress: DrawingProgress) => void,
        onFinish: (feature: Feature) => void,
    ) {
        this.draw = new Draw({
            source: runtime.source,
            type,
            stopClick: true,
            freehandCondition: () => false,
            style: drawingStyle(type),
        });
        this.doubleClickZoom = runtime.map
            .getInteractions()
            .getArray()
            .find((interaction) => interaction instanceof DoubleClickZoom);
        this.zoomWasActive = this.doubleClickZoom?.getActive() ?? false;
        this.doubleClickZoom?.setActive(false);
        this.listeners = [
            this.draw.on('drawstart', ({ feature }) => this.startSketch(feature)),
            this.draw.on('drawabort', () => this.reset()),
            this.draw.on('drawend', ({ feature }) => {
                this.detachGeometry();
                this.completedFeature = feature;
                onFinish(feature);
                this.updateProgress({ status: 'finished' });
            }),
        ];
        runtime.map.addInteraction(this.draw);
    }

    private startSketch(feature: Feature) {
        this.completedFeature = null;
        this.geometry = feature.getGeometry();
        const updateVertices = () => {
            const vertexCount = getSketchVertices(this.geometry).length;
            if (this.progress.status !== 'sketching' || this.progress.vertexCount !== vertexCount) {
                this.updateProgress({ status: 'sketching', vertexCount });
            }
        };
        this.geometryListener = this.geometry?.on('change', updateVertices);
        updateVertices();
    }

    private updateProgress(progress: DrawingProgress) {
        this.progress = progress;
        this.onChange(progress);
    }

    private detachGeometry() {
        if (this.geometryListener) {
            unByKey(this.geometryListener);
        }
        this.geometryListener = undefined;
        this.geometry = undefined;
    }

    reset() {
        this.detachGeometry();
        this.completedFeature = null;
        this.updateProgress({ status: 'idle' });
    }

    finish() {
        if (!canFinishDrawing(this.progress, this.type)) {
            return null;
        }
        return this.progress.status === 'sketching'
            ? this.draw.finishDrawing()
            : this.completedFeature;
    }

    undoVertex() {
        this.draw.removeLastPoint();
    }

    getCompletedFeature() {
        return this.completedFeature;
    }

    abort() {
        this.draw.abortDrawing();
    }

    dispose() {
        unByKey(this.listeners);
        this.detachGeometry();
        this.draw.abortDrawing();
        this.runtime.map.removeInteraction(this.draw);
        this.doubleClickZoom?.setActive(this.zoomWasActive);
    }
}
