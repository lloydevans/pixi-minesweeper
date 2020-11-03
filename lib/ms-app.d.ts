import { AppBase } from "./common/app-base";
import type { MSCellState } from "./ms-cell-state";
import type { MSConfig, MSGameConfig } from "./ms-config";
import { MSState } from "./ms-state";
/**
 * Core App class.
 */
export declare class MSApp extends AppBase {
    state: MSState;
    timeActive: boolean;
    time: number;
    config: MSConfig;
    private gameConfig;
    private background;
    private board;
    private boardHeight;
    private boardWidth;
    private cellHeight;
    private cellWidth;
    private container;
    private grid;
    private isFirstClick;
    private touchUi;
    private ui;
    /**
     *
     */
    constructor();
    /**
     * Init callback.
     */
    private onInit;
    /**
     * Load callback.
     */
    private onLoad;
    /**
     * Update callback.
     *
     * @param dt
     */
    private onUpdate;
    /**
     * Resize callback.
     *
     * @param width
     * @param height
     */
    private onResize;
    /**
     *
     * @param config
     */
    parseConfig(config?: Partial<MSConfig>): MSConfig;
    /**
     *
     */
    private initGrid;
    /**
     *
     * @param cellWidth
     * @param cellHeight
     */
    private updateCellSize;
    /**
     * Update all cell state. TODO: more efficient update.
     *
     */
    updateCellStates(): void;
    /**
     * Start a new game with given config.
     *
     * @param config
     */
    newGame(config?: MSGameConfig): void;
    /**
     * End current game.
     */
    private endGame;
    /**
     * Animate win.
     */
    private animateWin;
    /**
     * Animate loss.
     */
    private animateLose;
    /**
     *
     */
    leftClick(cellState: MSCellState): void;
    /**
     *
     * @param cellState
     */
    rightClick(cellState: MSCellState): void;
    /**
     *
     * @param e
     */
    private onPointerTap;
}
