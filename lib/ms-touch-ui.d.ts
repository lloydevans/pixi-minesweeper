import { Container } from "pixi.js-legacy";
import { MSApp } from "./ms-app";
import { MSCellState } from "./ms-cell-state";
/**
 * UI overlay for touch and accesible controls.
 */
export declare class MSTouchUi extends Container {
    targetCell?: MSCellState;
    private app;
    private buttonFlag;
    private buttonDig;
    constructor(app: MSApp);
    /**
     *
     */
    init(): void;
    /**
     * Set current target cell.
     */
    setTargetCell(cell: MSCellState): void;
    /**
     * TODO: animation
     */
    hide(): void;
    /**
     * TODO: animation
     */
    show(): void;
}
