import { MSState } from "./ms-state";

const MOCK_CONFIG = {
	startMines: 10,
	gridWidth: 10,
	gridHeight: 10,
	cells: [],
};

function getState(config = MOCK_CONFIG) {
	return new MSState(config);
}

function getRandomCoords(): [number, number] {
	return [Math.floor(Math.random() * MOCK_CONFIG.gridWidth), Math.floor(Math.random() * MOCK_CONFIG.gridHeight)];
}

describe("MSState tests", () => {
	it("should parse config", () => {
    const state = getState(MOCK_CONFIG);
		expect(state.width).toBe(MOCK_CONFIG.gridWidth);
		expect(state.height).toBe(MOCK_CONFIG.gridHeight);
	});

	it("should calculate indexes correctly", () => {
		const state = getState(MOCK_CONFIG);
		let index = state.indexOf(0, 0);
		expect(index).toBe(0);

		index = state.indexOf(1, 0);
		expect(index).toBe(1);

		index = state.indexOf(0, 1);
		expect(index).toBe(state.width);

		index = state.indexOf(1, 1);
		expect(index).toBe(1 + state.height);
	});

	it("should check coord bounds correctly", () => {
		const state = getState(MOCK_CONFIG);
		expect(state.coordsInBounds(0, 0)).toBe(true);
		expect(state.coordsInBounds(1, 0)).toBe(true);
		expect(state.coordsInBounds(-1, 0)).toBe(false);
		expect(state.coordsInBounds(0, MOCK_CONFIG.gridHeight + 1)).toBe(false);
	});

	it("should check index bounds correctly", () => {
		const state = getState(MOCK_CONFIG);
		expect(state.indexInBounds(0)).toBe(true);
		expect(state.indexInBounds(state.totalCells - 1)).toBe(true);

		expect(state.indexInBounds(-1)).toBe(false);
		expect(state.indexInBounds(state.totalCells)).toBe(false);
	});

	it("should claculate correct total flags", () => {
		const state = getState(MOCK_CONFIG);
		expect(state.totalFlags).toBe(0);

		const coords = getRandomCoords();

		state.placeFlag(...coords);

		expect(state.totalFlags).toBe(1);

		state.clearFlag(...coords);

		expect(state.totalFlags).toBe(0);
	});

	it("should have " + MOCK_CONFIG.startMines + " mines", () => {
		const state = getState(MOCK_CONFIG);
		state.select(0, 0);
		expect(state.config.startMines).toBe(MOCK_CONFIG.startMines);
	});

	it("should error finding cell at -1,0", () => {
		const state = getState(MOCK_CONFIG);
		expect(() => state.cellAt(-1, 0)).toThrowError();
	});

	it("should error placing flag at -1,0", () => {
		const state = getState(MOCK_CONFIG);
		expect(() => state.placeFlag(-1, 0)).toThrowError();
	});

	it("should error clearing flag at -1,0", () => {
		const state = getState(MOCK_CONFIG);
		expect(() => state.clearFlag(-1, 0)).toThrowError();
	});

	it("should place mine at 0,0", () => {
		const state = getState(MOCK_CONFIG);
		const coords: [number, number] = [0, 0];
		const oob: [number, number] = [-1, 0];

		state.placeMine(...coords);
		expect(() => state.placeMine(...oob)).toThrowError();

		const cell = state.cellAt(...coords);
		expect(cell?.mine).toBe(true);
	});

	it("should clear mine at 0,0", () => {
		const state = getState(MOCK_CONFIG);
		const coords: [number, number] = [0, 0];
		state.clearMine(...coords);

		const oob: [number, number] = [-1, 0];
		expect(() => state.clearMine(...oob)).toThrowError();

		const cell = state.cellAt(...coords);
		expect(cell?.mine).toBe(false);
	});

	it("should place flag at 0,0", () => {
		const state = getState(MOCK_CONFIG);
		const coords: [number, number] = [0, 0];
		state.placeFlag(...coords);

		const cell = state.cellAt(...coords);
		expect(cell?.flag).toBe(true);
	});

	it("should clear flag at 0,0", () => {
		const state = getState(MOCK_CONFIG);
		const coords: [number, number] = [0, 0];
		state.clearFlag(...coords);

		const cell = state.cellAt(...coords);
		expect(cell?.flag).toBe(false);
	});

	it("should uncover cell at 0,0", () => {
		const state = getState(MOCK_CONFIG);
		const coords: [number, number] = [0, 0];
		const cell = state.cellAt(...coords);

		state.uncover(...coords);
		expect(cell?.covered).toBe(false);
	});

	it("should find by predicate", () => {
		const state = getState(MOCK_CONFIG);
		state.shuffleMines(MOCK_CONFIG.startMines);
		const cell = state.find((el) => el.mine);
		expect(cell).toBeTruthy();

		if (cell) {
			expect(cell.mine).toBe(true);
		}
	});

	it("should uncover cell and remove flag if needed at 0,0", () => {
		const state = getState(MOCK_CONFIG);
		const coords: [number, number] = [0, 0];
		const cell = state.cellAt(...coords);

		if (!cell) {
			throw new Error("Cell not found");
		}

		state.placeFlag(...coords);
		expect(cell.flag).toBe(true);

		state.uncover(...coords);
		expect(cell.flag).toBe(false);
	});

	it("should reveal first move", () => {
		const state = getState(MOCK_CONFIG);

		state.select(0, 0);
		const cell = state.cellAt(0, 0);

		if (!cell) {
			throw new Error();
		}

		expect(cell.mine).toBe(false);
		expect(cell.flag).toBe(false);
		expect(cell.covered).toBe(false);
	});

	it("should reveal second move", () => {
		const state = getState(MOCK_CONFIG);

		const nextCell = state.find((el) => !el.mine && !el.flag && el.adjacent === 0 && el.covered);

		if (!nextCell) {
			throw new Error();
		}

		const cell = state.cellAt(nextCell.x, nextCell.y);

		if (!cell) {
			throw new Error();
		}

		expect(cell.mine).toBe(false);
		expect(cell.flag).toBe(false);
		expect(cell.covered).toBe(true);

		state.select(nextCell.x, nextCell.y);
		expect(cell.mine).toBe(false);
		expect(cell.flag).toBe(false);
		expect(cell.covered).toBe(false);
	});
});
