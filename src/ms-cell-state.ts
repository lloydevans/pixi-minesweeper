/**
 *
 */
export enum MSCellType {
	Covered,
	Flag,
	Empty,
	Mine,
	Adjacent1,
	Adjacent2,
	Adjacent3,
	Adjacent4,
	Adjacent5,
	Adjacent6,
	Adjacent7,
	Adjacent8,
}

/**
 *
 */
export interface MSCellState {
	/**
	 * X grid position of the cell.
	 */
	x: number;

	/**
	 * Y grid position of the cell.
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
}

/**
 *
 */
export const CELL_STATE_DEFAULT: MSCellState = {
	x: -1,
	y: -1,
	adjacent: 0,
	covered: false,
	mine: false,
	flag: false,
};
