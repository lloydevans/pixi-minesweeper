import { Container } from "pixi.js-legacy";
import { MSApp } from "./ms-app";
/**
 * Class handle UI elements.
 */
export declare class MSUi extends Container {
    private app;
    private background;
    private buttonRestart;
    private flagsContainer;
    private flagsGraphic;
    private flagsCount;
    private timeContainer;
    private timeGraphic;
    private timeCount;
    /**
     *
     * @param app
     */
    constructor(app: MSApp);
    /**
     * Initialisation must be called after assets are loaded.
     */
    init(): void;
    /**
     * Update callback.
     * Simple poll for changes.
     * TODO: observables/signals/listeners?
     *
     * @param dt
     */
    onUpdate(dt: number): void;
    /**
     * Resize callback.
     */
    onResize(width: number, height: number): void;
}
