import { Container } from "pixi.js-legacy";
import { MSCell } from "./ms-cell";
/**
 *
 */
export declare class MSGrid extends Container {
    private cells;
    gridWidth: number;
    gridHeight: number;
    cellWidth: number;
    cellHeight: number;
    /**
     *
     * @param width
     * @param height
     */
    constructor(gridWidth: number, gridHeight: number, cellWidth: number, cellHeight: number);
    /**
     *
     */
    private initCells;
    /**
     *
     * @param x
     * @param y
     */
    cellAt(x: number, y: number): MSCell | undefined;
}
