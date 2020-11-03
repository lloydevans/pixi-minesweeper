import { Container } from "pixi.js-legacy";
import { MSApp } from "./ms-app";
import type { MSCellState } from "./ms-cell-state";
export declare const REF_WIDTH = 64;
export declare const REF_HEIGHT = 64;
/**
 *
 */
export declare class MSCell extends Container {
    cellWidth: number;
    cellHeight: number;
    get ix(): number;
    get iy(): number;
    private app;
    private flag;
    private mine;
    private back;
    private front;
    private hover;
    private feedback;
    private text;
    private textureBack;
    private textureFront;
    private textureBackTileSize;
    private textureFrontTileSize;
    private edges;
    private viewState;
    /**
     *
     * @param app
     * @param cell
     * @param cellWidth
     * @param cellHeight
     */
    constructor(app: MSApp, cellWidth: number, cellHeight: number);
    /**
     *
     */
    private createFlag;
    /**
     *
     */
    private createMine;
    /**
     *
     * @param cellWidth
     * @param cellHeight
     */
    updateCellSize(cellWidth: number, cellHeight: number): void;
    /**
     *
     * @param ix
     * @param iy
     */
    private updateGridPosition;
    /**
     *
     */
    private createEdgeSprite;
    /**
     *
     */
    updateEdgeSprites(): void;
    /**
     *
     * @param state
     */
    updateState(state: MSCellState): void;
    /**
     *
     */
    animatePress(): void;
    /**
     *
     */
    animateHoverStart(): void;
    /**
     *
     */
    animateHoverEnd(): void;
    /**
     *
     */
    showResult(): void;
    /**
     *
     * @param total
     */
    private setText;
    /**
     *
     * @param enabled
     */
    setCoveredEnabled(enabled?: boolean): void;
    /**
     *
     * @param enabled
     */
    setInteractiveEnabled(enabled?: boolean): void;
    /**
     *
     */
    setMineEnabled(enabled?: boolean): void;
    /**
     *
     */
    setFlagEnabled(enabled?: boolean): void;
    /**
     *
     */
    animateCorrect(): void;
    /**
     *
     */
    animateIncorrect(): void;
    /**
     *
     */
    explodeMine(): void;
    /**
     *
     */
    placeFlagStart(): void;
    /**
     *
     */
    placeFlag(): void;
    /**
     *
     */
    clearFlagStart(): void;
    /**
     *
     */
    clearFlag(): void;
}
