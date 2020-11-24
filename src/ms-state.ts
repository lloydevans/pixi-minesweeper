import { shallowObjectEquals } from "./common/utils";
import { MSCellState, MSCellType } from "./ms-cell-state";
import { MSGameConfig } from "./ms-config";

export const MIN_GRID_WIDTH = 4;
export const MIN_GRID_HEIGHT = 4;
export const MAX_GRID_WIDTH = 24;
export const MAX_GRID_HEIGHT = 24;
export const MIN_EMPTY = 2;

/**
 *
 */
export interface ResultData {
	incorrect: MSCellState[];
	correct: MSCellState[];
}

export interface MSStateJson {
	config: MSGameConfig;
	firstMove: boolean;
	history: MoveData[];
	cells: MSCellState[];
}

export interface MSStateClientJson {
	config: MSGameConfig;
	history: MoveData[];
	firstMove: boolean;
	cells: MSCellType[];
	result?: MSCellState[];
}

export interface MoveData {
	uncovered: { x: number; y: number }[];
	flag: boolean;
	x: number;
	y: number;
}

/**
 * Class handles Minesweeper game state and logic.
 */
export class MSState {
	public width: number = 0;
	public height: number = 0;
	public config: MSGameConfig = {
		startMines: 1,
		gridWidth: 4,
		gridHeight: 4,
	};
	public get totalMines() {
		return this.cells.filter((el) => el.mine).length;
	}
	public get totalFlags() {
		return this.cells.filter((el) => el.flag).length;
	}
	public get totalCells() {
		return this.cells.length;
	}
	public get flagCount() {
		return this.totalMines - this.totalFlags;
	}
	public get lastMove(): MoveData | undefined {
		return this.history[0];
	}

	private firstMove = false;

	private readonly cells: MSCellState[] = [];

	private readonly history: MoveData[] = [];

	/**
	 * Initialize a game from a game config object.
	 *
	 * @param config - Game config object.
	 */
	public initGame(config: MSGameConfig) {
		this.setConfig(config);
		this.initCells();
		this.firstMove = true;
	}

	/**
	 * Set current game config object.
	 *
	 * @param config - Game config object.
	 */
	private setConfig(config: MSGameConfig) {
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
		if (config.startMines > config.gridWidth * config.gridHeight - 2) {
			throw new Error(
				`Too many mines (${config.startMines}) for grid size: ${config.gridWidth} x ${config.gridHeight}`
			);
		}
		this.config = { ...config };
		this.width = config.gridWidth;
		this.height = config.gridHeight;
	}

	/**
	 * Initialize all cells.
	 */
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

	/**
	 * Clear and set the moves history.
	 *
	 * @param moves - Array of MoveData onbjects.
	 */
	private setHistory(moves: MoveData[]) {
		this.history.length = 0;
		this.history.push(...moves);
	}

	/**
	 * Add a move to the history list.
	 *
	 * @param moves - Array of MoveData onbjects.
	 */
	private addHistory(move: MoveData) {
		this.history.unshift(move);
	}

	/**
	 * Convert the current game state to server-side data.
	 */
	public toServerJsonObject(): MSStateJson {
		return {
			firstMove: this.firstMove,
			history: this.history,
			config: this.config,
			cells: this.cells,
		};
	}

	/**
	 * Parse the current game state from server-side data.
	 *
	 * @param object - Server game state object revealing all info about the game.
	 */
	public parseServerJsonObject(object: MSStateJson) {
		this.initGame(object.config);
		this.setHistory(object.history);
		this.firstMove = object.firstMove;
		for (let i = 0; i < object.cells.length; i++) {
			Object.assign(this.cells[i], object.cells[i]);
		}
	}

	/**
	 * Convert the current game state to client-safe data. When no more moves can be
	 * done, the results can be included.
	 *
	 * @param includeResult - Include results?
	 */
	public toClientJsonObject(includeResult = false): MSStateClientJson {
		const cells: MSCellType[] = [];

		for (let i = 0; i < this.cells.length; i++) {
			const el = this.cells[i];

			if (el.covered && el.flag) {
				cells.push(MSCellType.Flag);
			} else if (el.covered) {
				cells.push(MSCellType.Covered);
			} else if (el.adjacent > 0) {
				cells.push(MSCellType[("Adjacent" + el.adjacent) as keyof typeof MSCellType]);
			} else if (!el.mine) {
				cells.push(MSCellType.Empty);
			} else {
				cells.push(MSCellType.Mine);
			}
		}

		let result;

		if (includeResult) {
			result = [...this.cells];
		}

		return {
			firstMove: this.firstMove,
			history: this.history,
			config: this.config,
			result,
			cells,
		};
	}

	/**
	 * Parse the current game state from client-safe data.
	 *
	 * @param object - Client state object.
	 */
	public parseClientJsonObject(object: MSStateClientJson) {
		if (object.cells.length !== this.cells.length) {
			throw new Error("Cell type array must match length.");
		}

		if (!shallowObjectEquals(object.config, this.config)) {
			throw new Error("Trying to parse config for different format game.");
		}

		this.setConfig(object.config);
		this.setHistory(object.history);
		this.firstMove = object.firstMove;

		if (object.result) {
			this.readCellStates(object.result);
		} else {
			this.readCellTypes(object.cells);
		}
	}

	/**
	 * Assign cells state list directly.
	 *
	 * @param cells - Cell state object.
	 */
	private readCellStates(cells: MSCellState[]) {
		if (cells.length !== this.cells.length) {
			throw new Error("Cell type array must match length.");
		}

		for (let i = 0; i < cells.length; i++) {
			Object.assign(this.cells[i], cells[i]);
		}
	}

	/**
	 * Set cell properties from cell type list.
	 *
	 * @param cells - Cell state object.
	 */
	private readCellTypes(cells: MSCellType[]) {
		if (cells.length !== this.cells.length) {
			throw new Error("Cell type array must match length.");
		}

		for (let i = 0; i < cells.length; i++) {
			const cell = this.cells[i];

			cell.adjacent = 0;
			cell.covered = false;
			cell.flag = false;
			cell.mine = false;

			switch (cells[i]) {
				default:
				case MSCellType.Empty:
					break;

				case MSCellType.Covered:
					cell.covered = true;
					break;

				case MSCellType.Flag:
					cell.covered = true;
					cell.flag = true;
					break;

				case MSCellType.Mine:
					cell.mine = true;
					break;

				case MSCellType.Adjacent1:
					cell.adjacent = 1;
					break;

				case MSCellType.Adjacent2:
					cell.adjacent = 2;
					break;

				case MSCellType.Adjacent3:
					cell.adjacent = 3;
					break;

				case MSCellType.Adjacent4:
					cell.adjacent = 4;
					break;

				case MSCellType.Adjacent5:
					cell.adjacent = 5;
					break;

				case MSCellType.Adjacent6:
					cell.adjacent = 6;
					break;

				case MSCellType.Adjacent7:
					cell.adjacent = 7;
					break;

				case MSCellType.Adjacent8:
					cell.adjacent = 8;
					break;
			}
		}
	}

	/**
	 * Reset the state.
	 */
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
	}

	/**
	 * Performs the specified action for each element in an array.
	 *
	 * @param cb - Callback function
	 */
	public forEach(cb: (cell: MSCellState, i: number) => void) {
		this.cells.forEach(cb);
	}

	/**
	 * Get cell at coords.
	 *
	 * @param x - X coord
	 * @param y - Y coord
	 */
	public cellAt(x: number, y: number): MSCellState | undefined {
		return this.cells[x + y * this.width];
	}

	/**
	 * Returns the value of the first cell where predicate is true, and undefined otherwise.
	 *
	 * @param x - X coord
	 * @param y - Y coord
	 */
	public find(predicate: (value: MSCellState, index: number) => boolean): MSCellState | undefined {
		return this.cells.find(predicate);
	}

	/**
	 * Place a flag at given coords.
	 *
	 * @param x - X coord
	 * @param y - Y coord
	 */
	public placeFlag(x: number, y: number) {
		const cell = this.cellAt(x, y);

		if (!cell) {
			throw new Error(`Can't find cell at ${x},${y}`);
		}

		cell.flag = true;
	}

	/**
	 * Clear flag at given coords.
	 *
	 * @param x - X coord
	 * @param y - Y coord
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
	 *
	 * @param x - X coord
	 * @param y - Y coord
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
	 *
	 * @param x - X coord
	 * @param y - Y coord
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
	 *
	 */
	public isWin(): boolean {
		// Can we find a covered cell without a mine?
		return !this.cells.find((el) => el.covered && !el.mine);
	}

	/**
	 * Check if the current game is in lose state.
	 *
	 */
	public isLose(): boolean {
		// Check if there is an uncovered cell containing a mine.
		return !!this.cells.find((el) => !el.covered && el.mine);
	}

	/**
	 * Is the game win/lose state determined?
	 *
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
			this.firstMove = false;
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

	/**
	 * Randomly shuffle some mines into the current game. Any existing
	 * mines are cleared before shuffling.
	 *
	 * @param total - Total mines to shuffle.
	 */
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
