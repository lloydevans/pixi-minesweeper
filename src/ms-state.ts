import { jsonClone, shallowObjectEquals } from "./common/utils";
import { MSCellState, MSCellType } from "./ms-cell-state";

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

	/**
	 * Set current game config object.
	 *
	 * @param config - Game config object.
	 */
	public setConfig(config: MSStateConfig) {
		if (
			!config ||
			typeof config.gridWidth !== "number" ||
			typeof config.gridHeight !== "number" ||
			typeof config.startMines !== "number"
		) {
			throw new Error("Invalid config");
		}

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
	private setHistory(moves: MoveDataHistory[]) {
		this.history.length = 0;
		this.history.push(...moves);
	}

	/**
	 * Add a move to the history list.
	 *
	 * @param moves - Array of MoveData onbjects.
	 */
	private addHistory(move: MoveDataHistory) {
		this.history.unshift(move);
	}

	/**
	 * Convert the current game state to server-side data.
	 */
	public toServerState(): MSStateServer {
		return jsonClone({
			resolution: this.resolution,
			history: this.history,
			config: this.config,
			cells: this.cells,
		});
	}

	/**
	 * Convert the current game state to client-safe data. When no more moves can be
	 * done, the results can be included.
	 *
	 * @param includeResult - Include results?
	 */
	public toClientState(includeResult = false): MSStateClient {
		const cells: MSCellType[] = [];

		for (let i = 0; i < this.cells.length; i++) {
			cells.push(this.cellToType(this.cells[i]));
		}

		const result = includeResult ? this.cells : void 0;

		return jsonClone({
			history: this.history,
			config: this.config,
			result,
			cells,
		});
	}

	/**
	 * Parse the current game state from server-side data.
	 *
	 * @param object - Server game state object revealing all info about the game.
	 */
	public parseServerState(object: MSStateServer) {
		if (!shallowObjectEquals(object.config, this.config)) {
			this.setConfig(object.config);
		}

		this.resolution = object.resolution;

		this.setHistory(object.history);

		for (let i = 0; i < object.cells.length; i++) {
			Object.assign(this.cells[i], object.cells[i]);
		}
	}

	/**
	 * Parse the current game state from client-safe data.
	 *
	 * @param object - Client state object.
	 */
	public parseClientState(object: MSStateClient) {
		if (!shallowObjectEquals(object.config, this.config)) {
			this.setConfig(object.config);
		}

		this.setHistory(object.history);

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
			this.cellFromType(cells[i], this.cells[i]);
		}
	}

	/**
	 */
	public cellToType(cell: MSCellState): MSCellType {
		let type = MSCellType.Empty;

		if (cell.covered && cell.flag) {
			type = MSCellType.Flag;
		} else if (cell.covered) {
			type = MSCellType.Covered;
		} else if (cell.adjacent > 0) {
			type = MSCellType[("Adjacent" + cell.adjacent) as keyof typeof MSCellType];
		} else if (cell.mine) {
			type = MSCellType.Mine;
		}

		return type;
	}

	/**
	 */
	public cellFromType(type: MSCellType, target: MSCellState) {
		target.adjacent = 0;
		target.covered = false;
		target.flag = false;
		target.mine = false;

		switch (type) {
			default:
			case MSCellType.Empty:
				break;

			case MSCellType.Covered:
				target.covered = true;
				break;

			case MSCellType.Flag:
				target.covered = true;
				target.flag = true;
				break;

			case MSCellType.Mine:
				target.mine = true;
				break;

			case MSCellType.Adjacent1:
				target.adjacent = 1;
				break;

			case MSCellType.Adjacent2:
				target.adjacent = 2;
				break;

			case MSCellType.Adjacent3:
				target.adjacent = 3;
				break;

			case MSCellType.Adjacent4:
				target.adjacent = 4;
				break;

			case MSCellType.Adjacent5:
				target.adjacent = 5;
				break;

			case MSCellType.Adjacent6:
				target.adjacent = 6;
				break;

			case MSCellType.Adjacent7:
				target.adjacent = 7;
				break;

			case MSCellType.Adjacent8:
				target.adjacent = 8;
				break;
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
		const cell = this.cells[x + y * this.width];

		if (!cell) {
			throw new Error(`Can't find cell at ${x},${y}`);
		}

		return cell;
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
