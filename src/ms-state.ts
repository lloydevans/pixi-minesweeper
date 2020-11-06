import type { MSCellState } from "./ms-cell-state";
import type { MSGameConfig } from "./ms-config";

const MIN_GRID_WIDTH = 4;
const MIN_GRID_HEIGHT = 4;
const MAX_GRID_WIDTH = 64;
const MAX_GRID_HEIGHT = 64;

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
export class MSState {
	public width: number = 0;
	public height: number = 0;
	public config: MSGameConfig = {
		startMines: 1,
		gridWidth: 4,
		gridHeight: 4
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

	private cells: MSCellState[] = [];

	/**
	 *
	 * @param config
	 */
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
			throw new Error(`Must have at least 1 mine`);
		}
		if (config.startMines > config.gridWidth * config.gridHeight - 1) {
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

	/**
	 *
	 */
	public reset() {
		for (let x = 0; x < this.width; x++) {
			for (let y = 0; y < this.height; y++) {
				let cell = this.cells[this.indexOf(x, y)];
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

	/**
	 * Initialize all cells.
	 */
	private initCells() {
		this.cells = [];
		for (let x = 0; x < this.width; x++) {
			for (let y = 0; y < this.height; y++) {
				this.cells[this.indexOf(x, y)] = {
					x,
					y,
					adjacent: 0,
					covered: true,
					mine: false,
					flag: false
				};
			}
		}

		if (this.totalMines > this.width * this.height - 1) {
			throw new Error("Must be at least one free cell.");
		}
	}

	/**
	 * Get cell at coords.
	 *
	 * @param x
	 * @param y
	 */
	public cellAt(x: number, y: number): MSCellState {
		if (!this.coordsInBounds(x, y)) {
			throw new Error("cellAt: Coords out of bounds");
		}

		return this.cells[x + y * this.width];
	}

	/**
	 * Find a cell that satisfies predicate.
	 *
	 * @param x
	 * @param y
	 */
	public find(predicate: (value: MSCellState, index: number) => boolean): MSCellState | undefined {
		return this.cells.find(predicate);
	}

	/**
	 * Place a flag at given coords.
	 *
	 * @param x
	 * @param y
	 */
	public placeFlag(x: number, y: number) {
		if (!this.coordsInBounds(x, y)) {
			throw new Error("placeFlag: Coords out of bounds");
		}

		let cell = this.cellAt(x, y);
		cell.flag = true;
	}

	/**
	 * Clear flag at given coords.
	 *
	 * @param x
	 * @param y
	 */
	public clearFlag(x: number, y: number) {
		if (!this.coordsInBounds(x, y)) {
			throw new Error("clearFlag: Coords out of bounds");
		}

		let cell = this.cellAt(x, y);
		cell.flag = false;
	}

	/**
	 * Place a mine at given coords.
	 *
	 * @param index
	 */
	public placeMine(x: number, y: number) {
		if (!this.coordsInBounds(x, y)) {
			throw new Error("placeMine: Coords out of bounds");
		}

		let cell = this.cellAt(x, y);
		cell.mine = true;
	}

	/**
	 * Clear a mine at given coords.
	 *
	 * @param x
	 * @param y
	 */
	public clearMine(x: number, y: number) {
		if (!this.coordsInBounds(x, y)) {
			throw new Error("clearMine: Coords out of bounds");
		}

		let cell = this.cellAt(x, y);
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
	public getLossData() {
		let lossData: LossData = {
			correct: [],
			incorrect: []
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
		let result = [];

		for (let i = 0; i < this.cells.length; i++) {
			const cell = this.cells[i];

			if (cell.mine && !cell.flag) {
				result.push(cell);
			}
		}

		return result;
	}

	/**
	 * Check if the current game is in win state.
	 *
	 */
	public isWin() {
		return !this.cells
			// get covered cells.
			.filter((el) => el.covered)
			// Can we find one without a mine?
			.find((el) => !el.mine);
	}

	/**
	 * Get array index of some coords.
	 *
	 * @param x
	 * @param y
	 */
	public indexOf(x: number, y: number): number {
		return (x % this.width) + y * this.width;
	}

	/**
	 * Check array index in bounds.
	 *
	 * @param x
	 * @param y
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
	 * @param x
	 * @param y
	 */
	public coordsInBounds(x: number, y: number) {
		return x > -1 && x < this.width && y > -1 && y < this.height;
	}

	/**
	 * User action on a cell. Uncovered cells are returned in an array.
	 *
	 * @param x
	 * @param y
	 */
	public select(x: number, y: number): MSCellState[] {
		let cell = this.cellAt(x, y);

		let result: MSCellState[] = [];

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

		return result;
	}

	/**
	 * Special logic for ensuring no mine is hit on first click.
	 *
	 * @param x
	 * @param y
	 */
	public selectFirst(x: number, y: number): MSCellState[] {
		let cell = this.cellAt(x, y);
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

		return this.select(x, y);
	}

	/**
	 * Uncover a given cell.
	 *
	 * @param cell
	 */
	public uncover(x: number, y: number) {
		let cell = this.cellAt(x, y);
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
		let cell = this.cellAt(x, y);

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
		let width = this.width;
		let height = this.height;

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
	 *
	 * @param total
	 */
	public shuffleMines(total: number) {
		this.clearAllMines();

		let sequence: number[] = [];

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
