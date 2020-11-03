import type { MSCellState } from "./ms-cell-state";
import type { MSGameConfig } from "./ms-config";
/**
 *
 */
export interface LossData {
    incorrect: MSCellState[];
    correct: MSCellState[];
}
/**
 * Class handles Minesweeper game state and logic.
 */
export declare class MSState {
    width: number;
    height: number;
    config: MSGameConfig;
    get totalMines(): number;
    get totalFlags(): number;
    get totalCells(): number;
    get flagCount(): number;
    private cells;
    /**
     *
     * @param config
     */
    init(config: MSGameConfig): void;
    /**
     * Initialize all cells.
     */
    private initCells;
    /**
     * Get cell at coords.
     *
     * @param x
     * @param y
     */
    cellAt(x: number, y: number): MSCellState;
    /**
     * Find a cell that satisfies predicate.
     *
     * @param x
     * @param y
     */
    find(predicate: (value: MSCellState, index: number) => boolean): MSCellState | undefined;
    /**
     * Place a flag at given coords.
     *
     * @param x
     * @param y
     */
    placeFlag(x: number, y: number): void;
    /**
     * Clear flag at given coords.
     *
     * @param x
     * @param y
     */
    clearFlag(x: number, y: number): void;
    /**
     * Place a mine at given coords.
     *
     * @param index
     */
    placeMine(x: number, y: number): void;
    /**
     * Clear a mine at given coords.
     *
     * @param x
     * @param y
     */
    clearMine(x: number, y: number): void;
    /**
     * Clear mines.
     */
    clearAllMines(): void;
    /**
     * Check and get losing cell states.
     */
    getLossData(): LossData;
    /**
     * Return array of unplaced flags.
     */
    getUnplacedFlag(): MSCellState[];
    /**
     * Check if the current game is in win state.
     *
     */
    isWin(): boolean;
    /**
     * Get array index of some coords.
     *
     * @param x
     * @param y
     */
    indexOf(x: number, y: number): number;
    /**
     * Check array index in bounds.
     *
     * @param x
     * @param y
     */
    indexInBounds(index: number): boolean;
    /**
     * Get coords of an array index.
     *
     * @param index
     */
    coordsOf(index: number): [number, number];
    /**
     * Check if coords are in bounds.
     *
     * @param x
     * @param y
     */
    coordsInBounds(x: number, y: number): boolean;
    /**
     * uncover a selected cell.
     *
     * @param x
     * @param y
     */
    select(x: number, y: number): void;
    /**
     * Special logic for ensuring no mine is hit on first click.
     *
     * @param x
     * @param y
     */
    selectFirst(x: number, y: number): void;
    /**
     * Uncover a given cell.
     *
     * @param cell
     */
    uncover(x: number, y: number): void;
    /**
     * Simple fill.
     *
     * @param x
     * @param y
     */
    private fill;
    /**
     * Calculate number of adjacent mines for all cells.
     */
    calculateAdjacent(): void;
    /**
     *
     * @param total
     */
    shuffleMines(total: number): void;
}
