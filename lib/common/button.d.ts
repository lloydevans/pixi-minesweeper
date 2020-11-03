import { Sprite, Texture } from "pixi.js-legacy";
import { AppBase } from "./app-base";
/**
 * Very quick button class.
 */
export declare class Button extends Sprite {
    private app;
    private content;
    constructor(app: AppBase, texture: Texture);
    /**
     *
     * @param e
     */
    private onPointerOut;
    /**
     *
     * @param e
     */
    private onPointerOver;
    /**
     *
     * @param e
     */
    private onPointerUp;
    /**
     *
     * @param e
     */
    private onPointerDown;
    /**
     *
     * @param e
     */
    private onPointerCancel;
    /**
     *
     * @param e
     */
    private onPointerTap;
}
