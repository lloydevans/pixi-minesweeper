import { Application, Container, LoaderResource, Texture, utils } from "pixi.js-legacy";
/**
 * Max selectable device pixel ratio.
 */
export declare const MAX_DPR = 4;
/**
 * Spine animation reference pixel ratio.
 */
export declare const SPINE_SCALE = 4;
/**
 * General purpose app functionality.
 */
export declare class AppBase extends Application {
    dpr: number;
    width: number;
    height: number;
    root: Container;
    events: utils.EventEmitter;
    /**
     *
     */
    init(): void;
    /**
     *
     * @param dt
     */
    private update;
    /**
     *
     */
    requestFullscreen(): void;
    /**
     *
     */
    private resizeRoot;
    /**
     *
     * @param atlasName
     */
    getAtlas(atlasName: string): LoaderResource;
    /**
     *
     * @param atlasName
     * @param frameName
     */
    getFrame(atlasName: string, frameName: string): Texture;
    /**
     *
     * @param spineName
     */
    getSpine(spineName: string): any;
    /**
     *
     * @param spineName
     */
    getJson(jsonName: string): any;
    /**
     * Add a spine asset to the loader.
     *
     * @param spineName
     * @param scale
     */
    addSpine(spineName: string, scale?: number): void;
    /**
     * Add an atlas asset to the loader.
     *
     * @param atlasName
     * @param scale
     */
    addAtlas(atlasName: string, scale?: number): void;
    /**
     * Add an JSON asset to the loader.
     *
     * @param atlasName
     * @param scale
     */
    addJson(name: string, url: string): void;
}
