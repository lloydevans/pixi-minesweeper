import { MSCell } from "./ms-cell";

/**
 *
 */
export interface MSCellState {
	/**
	 * X index of the cell.
	 */
	x: number;

	/**
	 * Y index of the cell.
	 */
	y: number;

	/**
	 * Number of adjacent mines.
	 */
	adjacent: number;

	/**
	 * Whether the cell is covered or not.
	 */
	covered: boolean;

	/**
	 * Whether the cell contains a mine or not.
	 */
	mine: boolean;

	/**
	 * Whether the cell contains a flag or not.
	 */
	flag: boolean;

	/**
	 * View object reference.
	 */
	view?: MSCell;
}
