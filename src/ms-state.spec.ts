import { MSState } from "./ms-state";
import { MSCellState } from "./ms-cell-state";

const MOCK_CONFIG = {
	startMines: 10,
	gridWidth: 10,
	gridHeight: 10,
	cells: []
};

function getState() {
	let state = new MSState();
	state.init(MOCK_CONFIG);
	return state;
}

function getRandomCoords(): [number, number] {
	return [Math.floor(Math.random() * MOCK_CONFIG.gridWidth), Math.floor(Math.random() * MOCK_CONFIG.gridHeight)];
}

describe("MSState tests", () => {
	it("should parse config", () => {
		let state = getState();
		expect(state.width).toBe(MOCK_CONFIG.gridWidth);
		expect(state.height).toBe(MOCK_CONFIG.gridHeight);
	});

	it("should calculate indexes correctly", () => {
		let state = getState();
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
		let state = getState();
		expect(state.coordsInBounds(0, 0)).toBe(true);
		expect(state.coordsInBounds(1, 0)).toBe(true);
		expect(state.coordsInBounds(-1, 0)).toBe(false);
		expect(state.coordsInBounds(0, MOCK_CONFIG.gridHeight + 1)).toBe(false);
	});

	it("should check index bounds correctly", () => {
		let state = getState();
		expect(state.indexInBounds(0)).toBe(true);
		expect(state.indexInBounds(state.totalCells - 1)).toBe(true);

		expect(state.indexInBounds(-1)).toBe(false);
		expect(state.indexInBounds(state.totalCells)).toBe(false);
	});

	it("should claculate correct total flags", () => {
		let state = getState();
		expect(state.totalFlags).toBe(0);

		let coords = getRandomCoords();

		state.placeFlag(...coords);

		expect(state.totalFlags).toBe(1);

		state.clearFlag(...coords);

		expect(state.totalFlags).toBe(0);
	});

	it("should have " + MOCK_CONFIG.startMines + " mines", () => {
		let state = getState();
		expect(state.totalMines).toBe(MOCK_CONFIG.startMines);
	});

	it("should error finding cell at -1,0", () => {
		let state = getState();
		expect(() => state.cellAt(-1, 0)).toThrowError();
	});

	it("should error placing flag at -1,0", () => {
		let state = getState();
		expect(() => state.placeFlag(-1, 0)).toThrowError();
	});

	it("should error clearing flag at -1,0", () => {
		let state = getState();
		expect(() => state.clearFlag(-1, 0)).toThrowError();
	});

	it("should remove all mines", () => {
		let state = getState();
		expect(state.totalMines).toBe(MOCK_CONFIG.startMines);
		state.clearAllMines();

		expect(state.totalMines).toBe(0);
	});

	it("should place mine at 0,0", () => {
		let state = getState();
		let coords: [number, number] = [0, 0];
		state.placeMine(...coords);

		let oob: [number, number] = [-1, 0];
		expect(() => state.placeMine(...oob)).toThrowError();

		let cell = state.cellAt(...coords);
		expect(cell.mine).toBe(true);
	});

	it("should clear mine at 0,0", () => {
		let state = getState();
		let coords: [number, number] = [0, 0];
		state.clearMine(...coords);

		let oob: [number, number] = [-1, 0];
		expect(() => state.clearMine(...oob)).toThrowError();

		let cell = state.cellAt(...coords);
		expect(cell.mine).toBe(false);
	});

	it("should place flag at 0,0", () => {
		let state = getState();
		let coords: [number, number] = [0, 0];
		state.placeFlag(...coords);

		let cell = state.cellAt(...coords);
		expect(cell.flag).toBe(true);
	});

	it("should clear flag at 0,0", () => {
		let state = getState();
		let coords: [number, number] = [0, 0];
		state.clearFlag(...coords);

		let cell = state.cellAt(...coords);
		expect(cell.flag).toBe(false);
	});

	it("should uncover cell at 0,0", () => {
		let state = getState();
		let coords: [number, number] = [0, 0];
		let cell = state.cellAt(...coords);

		state.uncover(...coords);
		expect(cell.covered).toBe(false);
	});

	it("should find by predicate", () => {
		let state = getState();
		let cell = state.find((el) => el.mine);
		expect(cell).toBeTruthy();

		if (cell) {
			expect(cell.mine).toBe(true);
		}
	});

	it("should uncover cell and remove flag if needed at 0,0", () => {
		let state = getState();
		let coords: [number, number] = [0, 0];
		let cell = state.cellAt(...coords);

		state.placeFlag(...coords);
		expect(cell.flag).toBe(true);

		state.uncover(...coords);
		expect(cell.flag).toBe(false);
	});

	it("should reveal first move", () => {
		let state = getState();
		let mine = state.find((el) => el.mine);

		expect(mine).toBeTruthy();

		if (mine) {
			state.selectFirst(mine.x, mine.y);
			let cell = state.cellAt(mine.x, mine.y);
			expect(cell.mine).toBe(false);
			expect(cell.flag).toBe(false);
			expect(cell.covered).toBe(false);
		}
	});

	it("should reveal second move", () => {
		let state = getState();

		let nextCell = state.find((el: MSCellState) => !el.mine && !el.flag && el.adjacent === 0 && el.covered);

		if (!nextCell) {
			throw new Error();
		}

		let cell = state.cellAt(nextCell.x, nextCell.y);
		expect(cell.mine).toBe(false);
		expect(cell.flag).toBe(false);
		expect(cell.covered).toBe(true);

		state.select(nextCell.x, nextCell.y);
		expect(cell.mine).toBe(false);
		expect(cell.flag).toBe(false);
		expect(cell.covered).toBe(false);
	});
});
