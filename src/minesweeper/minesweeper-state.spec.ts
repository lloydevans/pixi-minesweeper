import {
	MinesweeperState,
	MIN_GRID_WIDTH,
	MIN_GRID_HEIGHT,
	MAX_GRID_WIDTH,
	MAX_GRID_HEIGHT,
	MIN_EMPTY_CELLS,
} from "./minesweeper-state";
import type { MinesweeperGridConfig } from "./minesweeper-config";

const MOCK_CONFIG: MinesweeperGridConfig = {
	startMines: 10,
	gridWidth: 10,
	gridHeight: 10,
};

function getState(config: MinesweeperGridConfig = MOCK_CONFIG) {
	const state = new MinesweeperState();
	state.init(config);
	return state;
}

/** Create a state and manually set up mines in known positions for deterministic tests. */
function getDeterministicState() {
	const state = new MinesweeperState();
	state.init({ startMines: 2, gridWidth: 5, gridHeight: 5 });
	state.clearAllMines();
	// Place mines at known positions:
	//   0 1 2 3 4
	// 0 . . . . .
	// 1 . M . . .
	// 2 . . M . .
	// 3 . . . . .
	// 4 . . . . .
	state.placeMine(1, 1);
	state.placeMine(2, 2);
	state.calculateAdjacent();
	return state;
}

/** Helper to get a cell and assert it exists. */
function assertCellAt(state: MinesweeperState, x: number, y: number) {
	const cell = state.cellAt(x, y);
	expect(cell).toBeDefined();
	return cell as NonNullable<typeof cell>;
}

describe("MinesweeperState", () => {
	describe("init", () => {
		it("should parse config dimensions", () => {
			const state = getState();
			expect(state.width).toBe(MOCK_CONFIG.gridWidth);
			expect(state.height).toBe(MOCK_CONFIG.gridHeight);
		});

		it("should store a copy of the config", () => {
			const config = { ...MOCK_CONFIG };
			const state = getState(config);
			config.gridWidth = 999;
			expect(state.config.gridWidth).toBe(MOCK_CONFIG.gridWidth);
		});

		it("should create the correct number of cells", () => {
			const state = getState();
			expect(state.totalCells).toBe(MOCK_CONFIG.gridWidth * MOCK_CONFIG.gridHeight);
		});

		it("should place the correct number of mines", () => {
			const state = getState();
			expect(state.totalMines).toBe(MOCK_CONFIG.startMines);
		});

		it("should throw if grid width is below minimum", () => {
			expect(() => getState({ startMines: 1, gridWidth: MIN_GRID_WIDTH - 1, gridHeight: 5 })).toThrow(
				"Grid width below " + MIN_GRID_WIDTH,
			);
		});

		it("should throw if grid height is below minimum", () => {
			expect(() => getState({ startMines: 1, gridWidth: 5, gridHeight: MIN_GRID_HEIGHT - 1 })).toThrow(
				"Grid height below " + MIN_GRID_HEIGHT,
			);
		});

		it("should throw if grid width exceeds maximum", () => {
			expect(() => getState({ startMines: 1, gridWidth: MAX_GRID_WIDTH + 1, gridHeight: 5 })).toThrow(
				"Grid width bigger than " + MAX_GRID_WIDTH,
			);
		});

		it("should throw if grid height exceeds maximum", () => {
			expect(() => getState({ startMines: 1, gridWidth: 5, gridHeight: MAX_GRID_HEIGHT + 1 })).toThrow(
				"Grid height bigger than " + MAX_GRID_HEIGHT,
			);
		});

		it("should throw if mines < 1", () => {
			expect(() => getState({ startMines: 0, gridWidth: 5, gridHeight: 5 })).toThrow("Must have at least 1 mine");
		});

		it("should throw if too many mines for the grid size", () => {
			// 5x5 = 25 cells, max mines = 25 - MIN_EMPTY_CELLS; use maxMines + 1 to exceed the limit
			const maxMines = 5 * 5 - MIN_EMPTY_CELLS;
			expect(() => getState({ startMines: maxMines + 1, gridWidth: 5, gridHeight: 5 })).toThrow("Too many mines");
		});

		it("should accept the maximum valid mine count", () => {
			const maxMines = 5 * 5 - MIN_EMPTY_CELLS;
			const state = getState({ startMines: maxMines, gridWidth: 5, gridHeight: 5 });
			expect(state.totalMines).toBe(maxMines);
		});

		it("should accept minimum grid dimensions", () => {
			const state = getState({ startMines: 1, gridWidth: MIN_GRID_WIDTH, gridHeight: MIN_GRID_HEIGHT });
			expect(state.width).toBe(MIN_GRID_WIDTH);
			expect(state.height).toBe(MIN_GRID_HEIGHT);
		});

		it("should accept maximum grid dimensions", () => {
			const state = getState({ startMines: 1, gridWidth: MAX_GRID_WIDTH, gridHeight: MAX_GRID_HEIGHT });
			expect(state.width).toBe(MAX_GRID_WIDTH);
			expect(state.height).toBe(MAX_GRID_HEIGHT);
		});

		it("should start all cells as covered", () => {
			const state = getState();
			let allCovered = true;
			state.forEach((cell) => {
				if (!cell.covered) allCovered = false;
			});
			expect(allCovered).toBe(true);
		});

		it("should start all cells without flags", () => {
			const state = getState();
			expect(state.totalFlags).toBe(0);
		});
	});

	describe("reset", () => {
		it("should re-cover all cells after reset", () => {
			const state = getState();
			state.uncover(0, 0);
			state.uncover(1, 1);
			state.reset();
			let allCovered = true;
			state.forEach((cell) => {
				if (!cell.covered) allCovered = false;
			});
			expect(allCovered).toBe(true);
		});

		it("should clear all flags after reset", () => {
			const state = getState();
			state.placeFlag(0, 0);
			state.placeFlag(1, 1);
			state.reset();
			expect(state.totalFlags).toBe(0);
		});

		it("should re-place the correct number of mines after reset", () => {
			const state = getState();
			state.reset();
			expect(state.totalMines).toBe(MOCK_CONFIG.startMines);
		});

		it("should maintain grid dimensions after reset", () => {
			const state = getState();
			state.reset();
			expect(state.width).toBe(MOCK_CONFIG.gridWidth);
			expect(state.height).toBe(MOCK_CONFIG.gridHeight);
			expect(state.totalCells).toBe(MOCK_CONFIG.gridWidth * MOCK_CONFIG.gridHeight);
		});
	});

	describe("indexOf / coordsOf", () => {
		it("should calculate index (0,0) = 0", () => {
			const state = getState();
			expect(state.indexOf(0, 0)).toBe(0);
		});

		it("should calculate index (1,0) = 1", () => {
			const state = getState();
			expect(state.indexOf(1, 0)).toBe(1);
		});

		it("should calculate index (0,1) = width", () => {
			const state = getState();
			expect(state.indexOf(0, 1)).toBe(state.width);
		});

		it("should calculate index (1,1) = width + 1", () => {
			const state = getState();
			expect(state.indexOf(1, 1)).toBe(state.width + 1);
		});

		it("should calculate index for last cell", () => {
			const state = getState();
			expect(state.indexOf(state.width - 1, state.height - 1)).toBe(state.totalCells - 1);
		});

		it("should convert index back to coords (round trip)", () => {
			const state = getState();
			for (let x = 0; x < state.width; x++) {
				for (let y = 0; y < state.height; y++) {
					const idx = state.indexOf(x, y);
					const [cx, cy] = state.coordsOf(idx);
					expect(cx).toBe(x);
					expect(cy).toBe(y);
				}
			}
		});

		it("coordsOf should return [0,0] for index 0", () => {
			const state = getState();
			expect(state.coordsOf(0)).toEqual([0, 0]);
		});

		it("coordsOf should return correct coords for last cell", () => {
			const state = getState();
			expect(state.coordsOf(state.totalCells - 1)).toEqual([state.width - 1, state.height - 1]);
		});
	});

	describe("bounds checking", () => {
		it("should report (0,0) as in bounds", () => {
			const state = getState();
			expect(state.coordsInBounds(0, 0)).toBe(true);
		});

		it("should report negative coords as out of bounds", () => {
			const state = getState();
			expect(state.coordsInBounds(-1, 0)).toBe(false);
			expect(state.coordsInBounds(0, -1)).toBe(false);
			expect(state.coordsInBounds(-1, -1)).toBe(false);
		});

		it("should report coords at grid edge as in bounds", () => {
			const state = getState();
			expect(state.coordsInBounds(state.width - 1, state.height - 1)).toBe(true);
		});

		it("should report coords beyond grid edge as out of bounds", () => {
			const state = getState();
			expect(state.coordsInBounds(state.width, 0)).toBe(false);
			expect(state.coordsInBounds(0, state.height)).toBe(false);
		});

		it("should check index bounds correctly", () => {
			const state = getState();
			expect(state.indexInBounds(0)).toBe(true);
			expect(state.indexInBounds(state.totalCells - 1)).toBe(true);
			expect(state.indexInBounds(-1)).toBe(false);
			expect(state.indexInBounds(state.totalCells)).toBe(false);
		});
	});

	describe("cellAt", () => {
		it("should return a cell at valid coords", () => {
			const state = getState();
			const cell = assertCellAt(state, 0, 0);
			expect(cell.x).toBe(0);
			expect(cell.y).toBe(0);
		});

		it("should return undefined for out-of-bounds coords", () => {
			const state = getState();
			expect(state.cellAt(-1, 0)).toBeUndefined();
			expect(state.cellAt(0, state.height)).toBeUndefined();
		});

		it("should return cells with correct x,y coordinates", () => {
			const state = getState();
			for (let x = 0; x < state.width; x++) {
				for (let y = 0; y < state.height; y++) {
					const cell = assertCellAt(state, x, y);
					expect(cell.x).toBe(x);
					expect(cell.y).toBe(y);
				}
			}
		});
	});

	describe("flags", () => {
		it("should place and count a flag", () => {
			const state = getState();
			expect(state.totalFlags).toBe(0);
			state.placeFlag(0, 0);
			expect(state.totalFlags).toBe(1);
		});

		it("should clear a flag", () => {
			const state = getState();
			state.placeFlag(0, 0);
			state.clearFlag(0, 0);
			expect(state.totalFlags).toBe(0);
		});

		it("should track flag count (mines - flags)", () => {
			const state = getState();
			expect(state.flagCount).toBe(MOCK_CONFIG.startMines);
			state.placeFlag(0, 0);
			expect(state.flagCount).toBe(MOCK_CONFIG.startMines - 1);
		});

		it("should place multiple flags", () => {
			const state = getState();
			state.placeFlag(0, 0);
			state.placeFlag(1, 0);
			state.placeFlag(2, 0);
			expect(state.totalFlags).toBe(3);
		});

		it("should throw when placing flag out of bounds", () => {
			const state = getState();
			expect(() => state.placeFlag(-1, 0)).toThrow();
		});

		it("should throw when clearing flag out of bounds", () => {
			const state = getState();
			expect(() => state.clearFlag(-1, 0)).toThrow();
		});
	});

	describe("mines", () => {
		it("should place a mine", () => {
			const state = getState();
			state.clearAllMines();
			state.placeMine(0, 0);
			const cell = assertCellAt(state, 0, 0);
			expect(cell.mine).toBe(true);
		});

		it("should clear a mine", () => {
			const state = getState();
			state.placeMine(0, 0);
			state.clearMine(0, 0);
			const cell = assertCellAt(state, 0, 0);
			expect(cell.mine).toBe(false);
		});

		it("should clear all mines", () => {
			const state = getState();
			expect(state.totalMines).toBe(MOCK_CONFIG.startMines);
			state.clearAllMines();
			expect(state.totalMines).toBe(0);
		});

		it("should throw when placing mine out of bounds", () => {
			const state = getState();
			expect(() => state.placeMine(-1, 0)).toThrow();
		});

		it("should throw when clearing mine out of bounds", () => {
			const state = getState();
			expect(() => state.clearMine(-1, 0)).toThrow();
		});

		it("clearMine on a non-mine cell should be a no-op", () => {
			const state = getState();
			state.clearAllMines();
			const cell = assertCellAt(state, 0, 0);
			expect(cell.mine).toBe(false);
			state.clearMine(0, 0);
			expect(cell.mine).toBe(false);
		});
	});

	describe("uncover", () => {
		it("should uncover a cell", () => {
			const state = getState();
			state.uncover(0, 0);
			const cell = assertCellAt(state, 0, 0);
			expect(cell.covered).toBe(false);
		});

		it("should remove flag when uncovering a flagged cell", () => {
			const state = getState();
			state.placeFlag(0, 0);
			const cell = assertCellAt(state, 0, 0);
			expect(cell.flag).toBe(true);
			state.uncover(0, 0);
			expect(cell.flag).toBe(false);
			expect(cell.covered).toBe(false);
		});

		it("should throw when uncovering out of bounds", () => {
			const state = getState();
			expect(() => state.uncover(-1, 0)).toThrow();
		});
	});

	describe("calculateAdjacent", () => {
		it("should calculate adjacent mine counts correctly", () => {
			const state = getDeterministicState();

			// Cell (0,0) is adjacent to mine at (1,1) => 1
			expect(assertCellAt(state, 0, 0).adjacent).toBe(1);

			// Cell (1,1) is a mine, adjacent to mine at (2,2) => 1
			expect(assertCellAt(state, 1, 1).adjacent).toBe(1);

			// Cell (2,2) is a mine, adjacent to mine at (1,1) => 1
			expect(assertCellAt(state, 2, 2).adjacent).toBe(1);

			// Cell (1,2) is between both mines => 2
			expect(assertCellAt(state, 1, 2).adjacent).toBe(2);

			// Cell (2,1) is between both mines => 2
			expect(assertCellAt(state, 2, 1).adjacent).toBe(2);

			// Cell (4,4) is far from all mines => 0
			expect(assertCellAt(state, 4, 4).adjacent).toBe(0);

			// Cell (0,2) neighbors: (1,1), (1,2), (0,1), (0,3), (1,3)
			// mines at (1,1) => 1
			expect(assertCellAt(state, 0, 2).adjacent).toBe(1);
		});

		it("should set zero for cells far from mines", () => {
			const state = getDeterministicState();
			expect(assertCellAt(state, 4, 4).adjacent).toBe(0);
			expect(assertCellAt(state, 4, 0).adjacent).toBe(0);
			expect(assertCellAt(state, 0, 4).adjacent).toBe(0);
		});

		it("should handle corner cells (fewer neighbors)", () => {
			const state = new MinesweeperState();
			state.init({ startMines: 1, gridWidth: 4, gridHeight: 4 });
			state.clearAllMines();

			// Place mine at (0,0) — top-left corner
			state.placeMine(0, 0);
			state.calculateAdjacent();

			// Only (1,0), (0,1), (1,1) should be affected
			expect(assertCellAt(state, 1, 0).adjacent).toBe(1);
			expect(assertCellAt(state, 0, 1).adjacent).toBe(1);
			expect(assertCellAt(state, 1, 1).adjacent).toBe(1);

			// Non-adjacent cells should be 0
			expect(assertCellAt(state, 2, 0).adjacent).toBe(0);
			expect(assertCellAt(state, 0, 2).adjacent).toBe(0);
			expect(assertCellAt(state, 3, 3).adjacent).toBe(0);
		});

		it("should count up to 8 adjacent mines", () => {
			const state = new MinesweeperState();
			state.init({ startMines: 1, gridWidth: 5, gridHeight: 5 });
			state.clearAllMines();

			// Surround (2,2) with 8 mines
			state.placeMine(1, 1);
			state.placeMine(2, 1);
			state.placeMine(3, 1);
			state.placeMine(1, 2);
			state.placeMine(3, 2);
			state.placeMine(1, 3);
			state.placeMine(2, 3);
			state.placeMine(3, 3);
			state.calculateAdjacent();

			expect(assertCellAt(state, 2, 2).adjacent).toBe(8);
		});
	});

	describe("select", () => {
		it("should uncover a mine cell and return it", () => {
			const state = getDeterministicState();
			const result = state.select(1, 1); // mine cell
			expect(result.length).toBe(1);
			expect(result[0].mine).toBe(true);
			expect(assertCellAt(state, 1, 1).covered).toBe(false);
		});

		it("should uncover a numbered cell and return it", () => {
			const state = getDeterministicState();
			// (0,0) has adjacent=1
			const result = state.select(0, 0);
			expect(result.length).toBe(1);
			expect(result[0].adjacent).toBe(1);
			expect(assertCellAt(state, 0, 0).covered).toBe(false);
		});

		it("should flood-fill when selecting an empty cell", () => {
			const state = getDeterministicState();
			// (4,4) has adjacent=0, should flood-fill
			const result = state.select(4, 4);
			expect(result.length).toBeGreaterThan(1);

			// All returned cells should be uncovered
			for (const cell of result) {
				expect(cell.covered).toBe(false);
			}
		});

		it("should not include mine cells in flood-fill", () => {
			const state = getDeterministicState();
			const result = state.select(4, 4);
			for (const cell of result) {
				expect(cell.mine).toBe(false);
			}
		});

		it("should stop flood-fill at numbered cells", () => {
			const state = getDeterministicState();
			const result = state.select(4, 4);

			// The result should include border cells with adjacent > 0
			const numbered = result.filter((c) => c.adjacent > 0);
			expect(numbered.length).toBeGreaterThan(0);

			// Those numbered cells should be uncovered
			for (const cell of numbered) {
				expect(cell.covered).toBe(false);
			}
		});

		it("should throw when selecting out of bounds", () => {
			const state = getState();
			expect(() => state.select(-1, 0)).toThrow();
		});
	});

	describe("selectFirst", () => {
		it("should never hit a mine on first click", () => {
			// Run multiple times as selectFirst uses randomness
			for (let i = 0; i < 20; i++) {
				const state = getState();
				const mine = state.find((el) => el.mine);
				expect(mine).toBeTruthy();

				if (mine) {
					const result = state.selectFirst(mine.x, mine.y);
					const cell = assertCellAt(state, mine.x, mine.y);
					expect(cell.mine).toBe(false);
					expect(cell.covered).toBe(false);
					expect(result.length).toBeGreaterThan(0);
				}
			}
		});

		it("should return uncovered cells", () => {
			const state = getState();
			const found = state.find((el) => !el.mine);
			expect(found).toBeDefined();
			const result = state.selectFirst(found?.x ?? 0, found?.y ?? 0);
			expect(result.length).toBeGreaterThan(0);
			for (const c of result) {
				expect(c.covered).toBe(false);
			}
		});

		it("should throw when selecting out of bounds", () => {
			const state = getState();
			expect(() => state.selectFirst(-1, 0)).toThrow();
		});
	});

	describe("isWin", () => {
		it("should not be a win at game start", () => {
			const state = getState();
			expect(state.isWin()).toBe(false);
		});

		it("should be a win when all non-mine cells are uncovered", () => {
			const state = getDeterministicState();
			state.forEach((cell) => {
				if (!cell.mine) {
					state.uncover(cell.x, cell.y);
				}
			});
			expect(state.isWin()).toBe(true);
		});

		it("should not be a win if any non-mine cell is still covered", () => {
			const state = getDeterministicState();
			// Uncover all but one non-mine cell
			let skipped = false;
			state.forEach((cell) => {
				if (!cell.mine) {
					if (!skipped) {
						skipped = true;
						return;
					}
					state.uncover(cell.x, cell.y);
				}
			});
			expect(state.isWin()).toBe(false);
		});

		it("should be a win even if mine cells remain covered", () => {
			const state = getDeterministicState();
			// Uncover only non-mine cells; mines stay covered
			state.forEach((cell) => {
				if (!cell.mine) {
					state.uncover(cell.x, cell.y);
				}
			});
			expect(assertCellAt(state, 1, 1).covered).toBe(true); // mine still covered
			expect(state.isWin()).toBe(true);
		});
	});

	describe("getLossData", () => {
		it("should categorize correctly flagged mines as correct", () => {
			const state = getDeterministicState();
			state.placeFlag(1, 1); // correct: mine with flag
			const data = state.getLossData();
			expect(data.correct.length).toBe(1);
			expect(data.correct[0].x).toBe(1);
			expect(data.correct[0].y).toBe(1);
		});

		it("should categorize unflagged mines as incorrect", () => {
			const state = getDeterministicState();
			// Don't flag any mines
			const data = state.getLossData();
			expect(data.incorrect.length).toBe(2); // both mines unflagged
		});

		it("should categorize flags on non-mine cells as incorrect", () => {
			const state = getDeterministicState();
			state.placeFlag(0, 0); // not a mine
			const data = state.getLossData();
			const wrongFlag = data.incorrect.find((c) => c.x === 0 && c.y === 0);
			expect(wrongFlag).toBeDefined();
		});

		it("should return empty arrays when no mines or flags", () => {
			const state = getDeterministicState();
			state.clearAllMines();
			const data = state.getLossData();
			expect(data.correct.length).toBe(0);
			expect(data.incorrect.length).toBe(0);
		});
	});

	describe("getUnplacedFlags / getCorrectFlags", () => {
		it("should return all mines as unplaced when no flags set", () => {
			const state = getDeterministicState();
			const unplaced = state.getUnplacedFlags();
			expect(unplaced.length).toBe(2);
		});

		it("should reduce unplaced count when flag is placed on a mine", () => {
			const state = getDeterministicState();
			state.placeFlag(1, 1);
			expect(state.getUnplacedFlags().length).toBe(1);
		});

		it("should return correct flags (flagged covered mines)", () => {
			const state = getDeterministicState();
			state.placeFlag(1, 1);
			state.placeFlag(2, 2);
			const correct = state.getCorrectFlags();
			expect(correct.length).toBe(2);
		});

		it("should not count uncovered flagged mines as correct", () => {
			const state = getDeterministicState();
			state.placeFlag(1, 1);
			state.uncover(1, 1); // uncover removes flag
			const correct = state.getCorrectFlags();
			expect(correct.length).toBe(0);
		});
	});

	describe("forEach / find", () => {
		it("should iterate all cells", () => {
			const state = getState();
			let count = 0;
			state.forEach(() => count++);
			expect(count).toBe(state.totalCells);
		});

		it("should find a mine cell", () => {
			const state = getState();
			const mine = state.find((el) => el.mine);
			expect(mine).toBeDefined();
			expect(mine?.mine).toBe(true);
		});

		it("should return undefined when find has no match", () => {
			const state = getState();
			state.clearAllMines();
			const mine = state.find((el) => el.mine);
			expect(mine).toBeUndefined();
		});
	});

	describe("shuffleMines", () => {
		it("should place the correct number of mines", () => {
			const state = getState();
			state.shuffleMines(5);
			expect(state.totalMines).toBe(5);
		});

		it("should clear previous mines before placing new ones", () => {
			const state = getState();
			state.shuffleMines(3);
			expect(state.totalMines).toBe(3);
			state.shuffleMines(7);
			expect(state.totalMines).toBe(7);
		});

		it("should recalculate adjacent counts", () => {
			const state = getState();
			state.shuffleMines(5);
			// After shuffle, adjacent counts should be recalculated
			// We just verify that no cell has adjacent > 8
			let valid = true;
			state.forEach((cell) => {
				if (cell.adjacent < 0 || cell.adjacent > 8) valid = false;
			});
			expect(valid).toBe(true);
		});

		it("should place mines at unique positions", () => {
			const state = getState();
			state.shuffleMines(10);
			let mineCount = 0;
			state.forEach((cell) => {
				if (cell.mine) mineCount++;
			});
			expect(mineCount).toBe(10);
		});
	});

	describe("flood-fill edge cases", () => {
		it("should not fill already uncovered cells", () => {
			const state = getDeterministicState();
			// First select to fill
			state.select(4, 4);
			// Select same area again — already-uncovered cells won't be returned
			const result2 = state.select(4, 4);
			expect(result2.length).toBe(0);
		});

		it("should handle fill on a small grid", () => {
			const state = new MinesweeperState();
			state.init({ startMines: 1, gridWidth: 4, gridHeight: 4 });
			state.clearAllMines();
			state.placeMine(0, 0);
			state.calculateAdjacent();

			// Select a cell far from the mine
			const result = state.select(3, 3);
			expect(result.length).toBeGreaterThan(0);
		});

		it("should fill entire grid when no mines", () => {
			const state = new MinesweeperState();
			state.init({ startMines: 1, gridWidth: 4, gridHeight: 4 });
			state.clearAllMines();
			state.calculateAdjacent();

			const result = state.select(0, 0);
			expect(result.length).toBe(16); // all cells filled
		});
	});

	describe("non-square grids", () => {
		it("should work with wide grids", () => {
			const state = getState({ startMines: 5, gridWidth: 20, gridHeight: 4 });
			expect(state.width).toBe(20);
			expect(state.height).toBe(4);
			expect(state.totalCells).toBe(80);
			expect(state.totalMines).toBe(5);
		});

		it("should work with tall grids", () => {
			const state = getState({ startMines: 5, gridWidth: 4, gridHeight: 20 });
			expect(state.width).toBe(4);
			expect(state.height).toBe(20);
			expect(state.totalCells).toBe(80);
			expect(state.totalMines).toBe(5);
		});
	});
});
