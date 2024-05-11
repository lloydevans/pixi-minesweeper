import type { MSCellState } from "./ms-cell-state";
import type { MSGameConfig } from "./ms-config";
import * as PIXI from "pixi.js";

export const MIN_GRID_WIDTH = 4;
export const MIN_GRID_HEIGHT = 4;
export const MAX_GRID_WIDTH = 24;
export const MAX_GRID_HEIGHT = 24;
export const MIN_EMPTY = 2;

/**
 *
 */
export enum GameResolution {
	Incomplete,
	Quit,
	Lost,
	Won,
}

export interface ResultData {
	incorrect: MSCellState[];
	correct: MSCellState[];
}

export interface MSStateServer {
	resolution: GameResolution;
	startTime?: number;
	resolveTime?: number;
	config: MSStateConfig;
	history: MoveDataHistory[];
	cells: MSCellState[];
}

export interface MSStateClient {
	config: MSStateConfig;
	history: MoveDataHistory[];
	cells: MSCellType[];
	result?: MSCellState[];
}

export interface MoveData {
	flag: boolean;
	x: number;
	y: number;
}

export interface MoveDataHistory extends MoveData {
	uncovered: { x: number; y: number }[];
}
export interface MSStateConfig {
	startMines: number;
	gridWidth: number;
	gridHeight: number;
	cheatMode?: boolean;
}

export const MS_STATE_CONFIG_DEFAULT: MSStateConfig = {
	startMines: 5,
	gridWidth: 9,
	gridHeight: 7,
};

/**
 * Class handles Minesweeper game state and logic.
 */
export class MSState {
	public static fromServerState(data: MSStateServer): MSState {
		const state = new MSState(data.config);
		state.parseServerState(data);
		return state;
	}

	public static fromClientState(data: MSStateClient): MSState {
		const state = new MSState(data.config);
		state.parseClientState(data);
		return state;
	}

	public width: number = 0;
	public height: number = 0;
	public config: MSStateConfig = {
		startMines: 1,
		gridWidth: 4,
		gridHeight: 4,
	};
	public get totalFlags() {
		return this.cells.filter((el) => el.flag).length;
	}
	public get totalCells() {
		return this.cells.length;
	}
	public get flagCount() {
		return this.config.startMines - this.totalFlags;
	}
	public get lastMove(): MoveDataHistory | undefined {
		return this.history[0];
	}
	public get firstMove(): boolean {
		return !this.cells.find((el) => !el.covered);
	}

	private readonly cells: MSCellState[] = [];

	private readonly history: MoveDataHistory[] = [];

	private resolution: GameResolution = GameResolution.Incomplete;

	constructor(config: Partial<MSStateConfig> = {}) {
		Object.entries(MS_STATE_CONFIG_DEFAULT).forEach((entry) => {
			const key = entry[0] as keyof MSStateConfig;
			const el = entry[1];
			config[key] = config[key] ?? el;
		});

		this.setConfig(config as MSStateConfig);
	}

	public init(config: MSGameConfig) {
		if (config.gridWidth < MIN_GRID_WIDTH) {
			throw new Error("Grid width below " + MIN_GRID_WIDTH);
		}
		if (config.gridHeight < MIN_GRID_HEIGHT) {
			throw new Error("Grid height below " + MIN_GRID_HEIGHT);
		}
		if (config.gridWidth > MAX_GRID_WIDTH) {
			throw new Error("Grid width bigger than " + MAX_GRID_WIDTH);
		}
		if (config.gridHeight > MAX_GRID_HEIGHT) {
			throw new Error("Grid height bigger than " + MAX_GRID_HEIGHT);
		}
		if (config.startMines < 1) {
			throw new Error("Must have at least 1 mine");
		}
		if (config.startMines > config.gridWidth * config.gridHeight - MIN_EMPTY) {
			throw new Error(
				`Too many mines (${config.startMines}) for grid size: ${config.gridWidth} x ${config.gridHeight}`
			);
		}
		this.config = { ...config };
		this.width = config.gridWidth;
		this.height = config.gridHeight;
		this.initCells();
		this.shuffleMines(config.startMines);
	}

	public reset() {
		for (let x = 0; x < this.width; x++) {
			for (let y = 0; y < this.height; y++) {
				const cell = this.cells[this.indexOf(x, y)];
				cell.x = x;
				cell.y = y;
				cell.adjacent = 0;
				cell.mine = false;
				cell.flag = false;
				cell.covered = true;
			}
		}
		this.shuffleMines(this.config.startMines);
	}

	private initCells() {
		this.cells.length = 0;

		for (let x = 0; x < this.width; x++) {
			for (let y = 0; y < this.height; y++) {
				this.cells[this.indexOf(x, y)] = {
					x,
					y,
					adjacent: 0,
					covered: true,
					mine: false,
					flag: false,
				};
			}
		}
	}

	public forEach(cb: (cell: MSCellState, i: number) => void) {
		this.cells.forEach(cb);
	}

	public cellAt(x: number, y: number): MSCellState | undefined {
		const cell = this.cells[x + y * this.width];

		if (!cell) {
			throw new Error(`Can't find cell at ${x},${y}`);
		}

		return cell;
	}

	/**
	 * Returns the value of the first cell where predicate is true, and undefined otherwise.
	 */
	public find(predicate: (value: MSCellState, index: number) => boolean): MSCellState | undefined {
		return this.cells.find(predicate);
	}

	/**
	 * Place a flag at given coords.
	 */
	public placeFlag(x: number, y: number) {
		const cell = this.cellAt(x, y);

		if (!cell) {
			throw new Error(`Can't find cell at ${x},${y}`);
		}

		cell.flag = true;
	}

	/**
	 * Toggle flag existence at given coords.
	 *
	 * @param x - X coord
	 * @param y - Y coord
	 */
	public toggleFlag(x: number, y: number) {
		const cell = this.cellAt(x, y);

		if (!cell) {
			throw new Error(`Can't find cell at ${x},${y}`);
		}

		cell.flag = !cell.flag;
	}

	/**
	 * Clear flag at given coords.
	 */
	public clearFlag(x: number, y: number) {
		const cell = this.cellAt(x, y);

		if (!cell) {
			throw new Error(`Can't find cell at ${x},${y}`);
		}

		cell.flag = false;
	}

	/**
	 * Place a mine at given coords.
	 */
	public placeMine(x: number, y: number) {
		const cell = this.cellAt(x, y);

		if (!cell) {
			throw new Error(`Can't find cell at ${x},${y}`);
		}

		cell.mine = true;
	}

	/**
	 * Clear a mine at given coords.
	 */
	public clearMine(x: number, y: number) {
		const cell = this.cellAt(x, y);

		if (!cell) {
			throw new Error(`Can't find cell at ${x},${y}`);
		}

		if (cell.mine) {
			cell.mine = false;
		}
	}

	/**
	 * Clear mines.
	 */
	public clearAllMines() {
		for (let x = 0; x < this.width; x++) {
			for (let y = 0; y < this.height; y++) {
				this.clearMine(x, y);
			}
		}
	}

	/**
	 * Check and get losing cell states.
	 */
	public getResultData() {
		const lossData: ResultData = {
			correct: [],
			incorrect: [],
		};

		for (let i = 0; i < this.cells.length; i++) {
			const cell = this.cells[i];

			if (cell.mine && cell.flag) {
				lossData.correct.push(cell);
			}
			if (cell.mine && !cell.flag) {
				lossData.incorrect.push(cell);
			}
			if (!cell.mine && cell.flag) {
				lossData.incorrect.push(cell);
			}
		}

		return lossData;
	}

	/**
	 * Return array of unplaced flags.
	 */
	public getUnplacedFlags() {
		return this.cells.filter((el) => el.mine && !el.flag);
	}

	/**
	 * Return array of correctly placed flags.
	 */
	public getCorrectFlags() {
		return this.cells.filter((el) => el.covered && el.mine && el.flag);
	}

	/**
	 * Check if the current game is in win state.
	 */
	public isWin(): boolean {
		// Can we find a covered cell without a mine?
		return !this.cells.find((el) => el.covered && !el.mine);
	}

	/**
	 * Check if the current game is in lose state.
	 */
	public isLose(): boolean {
		// Check if there is an uncovered cell containing a mine.
		return !!this.cells.find((el) => !el.covered && el.mine);
	}

	/**
	 * Is the game win/lose state determined?
	 */
	public canAcceptNewMove() {
		return !this.isWin() && !this.isLose();
	}

	/**
	 * Get array index of some coords.
	 *
	 * @param x - X coord
	 * @param y - Y coord
	 */
	public indexOf(x: number, y: number): number {
		return (x % this.width) + y * this.width;
	}

	/**
	 * Check array index in bounds.
	 *
	 * @param x - X coord
	 * @param y - Y coord
	 */
	public indexInBounds(index: number) {
		return index > -1 && index < this.cells.length;
	}

	/**
	 * Get coords of an array index.
	 *
	 * @param index
	 */
	public coordsOf(index: number): [number, number] {
		return [index % this.width, Math.floor(index / this.width)];
	}

	/**
	 * Check if coords are in bounds.
	 *
	 * @param x - X coord
	 * @param y - Y coord
	 */
	public coordsInBounds(x: number, y: number) {
		return x > -1 && x < this.width && y > -1 && y < this.height;
	}

	/**
	 * User action on a cell. Uncovered cells are returned in an array.
	 *
	 * @param x - X coord
	 * @param y - Y coord
	 */
	public select(x: number, y: number, flag: boolean = false): MSCellState[] {
		const cell = this.cellAt(x, y);

		if (!cell) {
			throw new Error(`Can't find cell at ${x},${y}`);
		}

		if (this.firstMove) {
			this.findGoodFirstMove(x, y);
		}

		const result: MSCellState[] = [];

		if (cell.adjacent === 0 && !cell.mine) {
			this.fill(x, y, result);
		} //
		else if (cell.adjacent > 0) {
			result.push(cell);
			this.uncover(x, y);
		} //
		else if (cell.mine) {
			result.push(cell);
			this.uncover(x, y);
		}

		const uncovered = result.map((el) => {
			return { x: el.x, y: el.y };
		});

		this.addHistory({ x, y, flag, uncovered });

		return result;
	}

	/**
	 * Special logic for ensuring no mine is hit on first click.
	 *
	 * @param x - X coord
	 * @param y - Y coord
	 */
	private findGoodFirstMove(x: number, y: number) {
		const cell = this.cellAt(x, y);

		if (!cell) {
			throw new Error(`Can't find cell at ${x},${y}`);
		}

		let foundMove = !cell.mine && cell.adjacent === 0;
		let i = 0;

		while (!foundMove) {
			this.shuffleMines(this.config.startMines);

			if (i < 1000) {
				foundMove = !cell.mine && cell.adjacent === 0;
			} else {
				foundMove = !cell.mine;
			}

			i++;
		}
	}

	/**
	 * Uncover a given cell.
	 *
	 * @param cell - Cell state object.
	 */
	public uncover(x: number, y: number) {
		const cell = this.cellAt(x, y);

		if (!cell) {
			throw new Error(`Can't find cell at ${x},${y}`);
		}

		cell.covered = false;

		if (cell.flag) {
			cell.flag = false;
		}
	}

	/**
	 * Simple fill.
	 *
	 * @param x
	 * @param y
	 */
	private fill(x: number, y: number, result: MSCellState[]) {
		const cell = this.cellAt(x, y);

		if (!cell) {
			throw new Error(`Can't find cell at ${x},${y}`);
		}

		if (cell.covered) {
			result.push(cell);
			this.uncover(x, y);

			if (cell.adjacent > 0) {
				return;
			}

			if (x > 0) {
				this.fill(x - 1, y, result);

				if (y > 0) {
					this.fill(x - 1, y - 1, result);
				}

				if (y < this.height - 1) {
					this.fill(x - 1, y + 1, result);
				}
			}

			if (x < this.width - 1) {
				this.fill(x + 1, y, result);

				if (y > 0) {
					this.fill(x + 1, y - 1, result);
				}

				if (y < this.height - 1) {
					this.fill(x + 1, y + 1, result);
				}
			}

			if (y > 0) {
				this.fill(x, y - 1, result);
			}

			if (y < this.height - 1) {
				this.fill(x, y + 1, result);
			}
		}
	}

	/**
	 * Calculate number of adjacent mines for all cells.
	 */
	public calculateAdjacent() {
		const width = this.width;
		const height = this.height;

		for (let i = 0; i < this.cells.length; i++) {
			const el = this.cells[i];
			const x = i % width;
			const y = Math.floor(i / width);

			let count = 0;

			if (x > 0) {
				count += this.cells[i - 1].mine ? 1 : 0;

				if (y < height - 1) {
					count += this.cells[i - 1 + width].mine ? 1 : 0;
				}

				if (y > 0) {
					count += this.cells[i - 1 - width].mine ? 1 : 0;
				}
			}

			if (x < width - 1) {
				count += this.cells[i + 1].mine ? 1 : 0;

				if (y < height - 1) {
					count += this.cells[i + 1 + width].mine ? 1 : 0;
				}

				if (y > 0) {
					count += this.cells[i + 1 - width].mine ? 1 : 0;
				}
			}

			if (y > 0) {
				count += this.cells[i - width].mine ? 1 : 0;
			}

			if (y < height - 1) {
				count += this.cells[i + width].mine ? 1 : 0;
			}

			el.adjacent = count;
		}
	}

	public shuffleMines(total: number) {
		this.clearAllMines();

		const sequence: number[] = [];

		while (sequence.length < total) {
			const idx = Math.floor(Math.random() * this.cells.length);
			if (sequence.indexOf(idx) === -1) {
				sequence.push(idx);
			}
		}

		sequence.forEach((idx) => (this.cells[idx].mine = true));

		this.calculateAdjacent();
	}
}
