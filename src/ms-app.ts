import clamp from "lodash/clamp";
import defaults from "lodash/defaults";
import { Container, Graphics, InteractionEvent, MIPMAP_MODES, SCALE_MODES, Sprite, Texture, TilingSprite } from "pixi.js-legacy"; // prettier-ignore
import { AppBase } from "./common/app-base";
import { hexToNum } from "./common/color";
import { delay } from "./common/delay";
import { Ease } from "./common/ease";
import { Tween } from "./common/tween";
import { preventContextMenu } from "./common/utils";
import { MSCell, REF_HEIGHT, REF_WIDTH } from "./ms-cell";
import { CELL_STATE_DEFAULT } from "./ms-cell-state";
import type { MSCellState } from "./ms-cell-state";
import { MS_CONFIG_DEFAULT } from "./ms-config";
import type { MSConfig, MSGameConfig } from "./ms-config";
import { MSGrid } from "./ms-grid";
import { MSMenu } from "./ms-menu";
import { MAX_GRID_HEIGHT, MAX_GRID_WIDTH, MSState } from "./ms-state";
import { sounds } from "./ms-tone";
import { MSTouchUi } from "./ms-touch-ui";
import { MSUi } from "./ms-ui";

export const INITIAL_GAME_CONFIG: MSGameConfig = {
	startMines: 10,
	gridWidth: 9,
	gridHeight: 9
};

/**
 * Core App class.
 */
export class MSApp extends AppBase {
	public cellPool: MSCell[] = [];
	public state: MSState = new MSState();
	public config!: MSConfig;
	public get currentTime() {
		return this.time;
	}

	private time = 0;
	private timeActive = false;
	private transitionIdx = 0;
	private gameConfig: MSGameConfig;
	private background: Graphics = new Graphics();
	private board: Sprite = Sprite.from(Texture.WHITE);
	private cellWidth: number = REF_WIDTH;
	private cellHeight: number = REF_HEIGHT;
	private container: Container = new Container();
	private grid: MSGrid = new MSGrid();
	private isFirstClick: boolean = true;
	private touchUi: MSTouchUi = new MSTouchUi(this);
	private menu: MSMenu = new MSMenu(this);
	private ui: MSUi = new MSUi(this);
	private boardBack?: TilingSprite;
	private isLoaded: boolean = false;

	/**
	 *
	 */
	constructor() {
		super({});

		// @ts-ignore
		window.ms = this;

		preventContextMenu();

		this.gameConfig = { ...INITIAL_GAME_CONFIG };

		this.root.addChild(this.background);
		this.root.addChild(this.container);
		this.root.addChild(this.ui);
		this.root.addChild(this.touchUi);

		this.events.on("init", this.onInit, this);
		this.events.on("resize", this.onResize, this);
		this.events.on("update", this.onUpdate, this);
	}

	/**
	 * Init callback.
	 */
	private onInit() {
		this.grid.interactiveChildren = false;

		this.addSpine("grid-square");
		this.addSpine("timer");
		this.addAtlas("textures");
		this.addAtlas("tiles");
		this.addJson("config", "config.json");
		this.loader.load();

		this.loader.onComplete.once(this.onLoad, this);
	}

	/**
	 * Load callback.
	 */
	private onLoad() {
		this.isLoaded = true;

		this.config = this.parseConfig(this.getJson("config"));

		this.boardBack = new TilingSprite(this.getFrame("tiles", "back-0"));

		this.board.tint = hexToNum(this.config.colorBoard);

		let tilesAtlas = this.getAtlas("tiles");

		if (tilesAtlas.spritesheet) {
			tilesAtlas.spritesheet.baseTexture.mipmap = MIPMAP_MODES.OFF;
			tilesAtlas.spritesheet.baseTexture.scaleMode = SCALE_MODES.NEAREST;
			tilesAtlas.spritesheet.baseTexture.update();
		}

		this.menu.init();
		this.touchUi.init();

		this.ui.init();
		this.ui.visible = false;

		this.container.addChild(this.board);
		this.container.addChild(this.boardBack);
		this.container.addChild(this.grid);
		this.container.addChild(this.menu);

		this.onResize(this.width, this.height);
	}

	/**
	 * Update callback.
	 *
	 * @param dt
	 */
	private onUpdate(dt: number) {
		if (this.timeActive) {
			this.time += this.ticker.elapsedMS / 1000;
		}

		// Generate cell view instances in the bakground.
		let maxCells = MAX_GRID_WIDTH * MAX_GRID_HEIGHT;
		if (this.isLoaded && this.cellPool.length < maxCells) {
			let length = this.cellPool.length;
			for (let i = 0; i < 5; i++) {
				let idx = length + i;
				if (idx > maxCells - 1) {
					break;
				}

				let [x, y] = this.state.coordsOf(idx);
				this.cellPool[idx] = this.createCellView(x, y);
			}
		}
	}

	/**
	 * Resize callback.
	 *
	 * @param width
	 * @param height
	 */
	private onResize(width: number, height: number) {
		this.background.clear();
		this.background.beginFill(hexToNum(this.config?.colorBackground || "#ffffff"));
		this.background.drawRect(-width / 2, -height / 2, width, height);

		let marginX = 64;
		let marginY = 96;
		let maxWidth = this.width - marginX * 2;
		let maxHeight = this.height - marginY * 2;
		let refBoardWidth = REF_WIDTH * this.state.width;
		let refBoardHeight = REF_HEIGHT * this.state.height;
		let scale = 1;

		if (refBoardHeight > maxHeight) {
			scale = clamp(maxHeight / refBoardHeight, 0.1, 1);
		}
		if (refBoardWidth * scale > maxWidth) {
			scale = clamp(maxWidth / refBoardWidth, 0.1, 1);
		}

		this.cellWidth = REF_WIDTH * scale;
		this.cellHeight = REF_HEIGHT * scale;

		let dimensionsX = this.state.width * this.cellWidth;
		let dimensionsY = this.state.height * this.cellHeight;
		let boardWidth = dimensionsX + this.cellWidth / 2;
		let boardHeight = dimensionsY + this.cellHeight / 2;
		this.board.x = -boardWidth / 2;
		this.board.y = -boardHeight / 2;
		this.board.width = boardWidth;
		this.board.height = boardHeight;
		this.grid.scale.set(this.cellWidth / REF_WIDTH);
		this.grid.x = -(this.state.width / 2) * this.cellWidth;
		this.grid.y = -(this.state.height / 2) * this.cellHeight;

		if (this.boardBack) {
			this.boardBack.tileScale.set(2 * (this.cellWidth / REF_WIDTH));
			this.boardBack.width = this.state.width * this.cellWidth;
			this.boardBack.height = this.state.height * this.cellHeight;
			this.boardBack.x = (-this.state.width * this.cellWidth) / 2;
			this.boardBack.y = (-this.state.height * this.cellHeight) / 2;
		}
	}

	/**
	 *
	 * @param config
	 */
	public parseConfig(config: Partial<MSConfig> = {}): MSConfig {
		return defaults(config, MS_CONFIG_DEFAULT);
	}

	/**
	 *
	 */
	private async initGrid() {
		this.transitionIdx = (this.transitionIdx + 1) % 3;

		this.grid.removeChildren();

		while (this.cellPool.length < this.state.totalCells) {
			await delay(100);
		}

		for (let i = 0; i < this.state.totalCells; i++) {
			let [x, y] = this.state.coordsOf(i);
			let msCell = this.getCellView(x, y);
			this.grid.addChild(msCell);
			this.cellPool[i].init({
				...CELL_STATE_DEFAULT,
				...{ x, y, covered: false }
			});
		}

		await delay(250);

		await this.transitionCells();
	}

	/**
	 *
	 */
	private async transitionCells() {
		switch (this.transitionIdx) {
			default:
			case 0:
				await this.noiseWipe();
				break;
		}
	}

	/**
	 *
	 */
	private async noiseWipe() {
		let indexes: number[] = [];
		for (let i = 0; i < this.state.totalCells; i++) {
			indexes.push(i);
		}

		while (indexes.length > 0) {
			let idx = (Math.random() * indexes.length) | 0;
			let cellIdx = indexes.splice(idx, 1)[0];
			let [x, y] = this.state.coordsOf(cellIdx);
			let cellState = this.state.cellAt(x, y)!;
			let msCell = this.getCellView(x, y);
			msCell.init(cellState);

			if (indexes.length % Math.floor(this.state.totalCells / 8) === 0) {
				sounds.blop.playbackRate = x / this.state.width + y / this.state.height + 1;
				sounds.blop.start();
				await delay(33);
			}
		}
	}

	/**
	 *
	 */
	private async swipeWipe(direction: "up" | "down") {
		let indexes: number[] = [];
		for (let i = 0; i < this.state.totalCells; i++) {
			indexes.push(i);
		}

		while (indexes.length > 0) {
			let cellIdx = direction === "down" ? indexes.shift()! : indexes.pop()!;
			let [x, y] = this.state.coordsOf(cellIdx);
			let cellState = this.state.cellAt(x, y)!;
			let msCell = this.getCellView(x, y);
			msCell.init(cellState);
			let width = this.state.width;
			if (indexes.length % (this.state.width * Math.round(this.state.height / 10)) === 0) {
				sounds.blop.playbackRate = x / this.state.width + y / this.state.height + 1;
				sounds.blop.start();
				await delay(33);
			}
		}
	}

	/**
	 *
	 */
	public updateCellStates() {
		this.state.forEach((el) => this.getCellView(el.x, el.y).updateViewState());
	}

	/**
	 * Start a new game with given config.
	 *
	 * @param config
	 */
	public async newGame(config: MSGameConfig = this.gameConfig) {
		Tween.removeAllTweens();

		this.time = 0;
		this.state.init(config);
		this.grid.interactiveChildren = false;
		this.gameConfig = { ...config };
		this.isFirstClick = true;
		this.ui.visible = true;
		this.touchUi.hide();
		this.onResize(this.width, this.height);

		await this.initGrid();
		this.timeActive = true;
		this.grid.interactiveChildren = true;
	}

	/**
	 *
	 */
	public showGame() {
		Tween.get(this.container.position).to({ y: 32 }, 300, Ease.sineInOut);
		this.menu.visible = false;
		this.grid.visible = true;
		this.ui.visible = true;
	}

	/**
	 *
	 */
	public showMenu() {
		Tween.get(this.container.position).to({ y: 0 }, 300, Ease.sineInOut);
		this.menu.visible = true;
		this.grid.visible = false;
		this.ui.visible = false;
	}

	/**
	 * Start a new game with given config.
	 *
	 * @param config
	 */
	public previewGame(config: MSGameConfig = this.gameConfig) {
		this.state.init(config);
		this.onResize(this.width, this.height);
		if (this.boardBack) {
			this.boardBack.visible = true;
		}
	}

	/**
	 * End current game.
	 */
	private endGame() {
		this.timeActive = false;
		this.grid.interactiveChildren = false;
	}

	/**
	 * Animate win.
	 */
	private async animateWin() {
		this.endGame();

		let unplacedFlags = this.state.getUnplacedFlags();

		while (unplacedFlags.length > 0) {
			let idx = Math.floor(Math.random() * unplacedFlags.length);
			let el = unplacedFlags.splice(idx, 1)[0];
			let msCell = this.getCellView(el.x, el.y);
			msCell.setFlagEnabled(true);
			msCell.animateCorrect();
			sounds.chime.playbackRate = 1;
			sounds.chime.start();

			await delay(66);
		}
	}

	/**
	 * Animate loss.
	 */
	private async animateLose(firstMine: MSCellState) {
		this.endGame();

		let result = this.state.getLossData();

		result.incorrect.splice(result.incorrect.indexOf(firstMine), 1);
		this.getCellView(firstMine.x, firstMine.y).animateResult();

		await delay(500);

		while (result.incorrect.length > 0) {
			let idx = Math.floor(Math.random() * result.incorrect.length);
			let el = result.incorrect.splice(idx, 1)[0];
			let msCell = this.getCellView(el.x, el.y);

			msCell.animateResult();

			sounds.click.playbackRate = 0.9 + Math.random() * 0.2;
			sounds.click.start();

			if (!msCell.state.flag) {
				msCell.animateDigEnd();
			}

			await delay(50);
		}

		while (result.correct.length > 0) {
			let idx = Math.floor(Math.random() * result.correct.length);
			let el = result.correct.splice(idx, 1)[0];
			let msCell = this.getCellView(el.x, el.y);
			msCell.animateResult();

			sounds.chime.playbackRate = 1;
			sounds.chime.start();

			await delay(100);
		}
	}

	/**
	 * Animate cell updates outwards from a target position.
	 *
	 * @param cell - Cell to animate outwards from.
	 * @param cb - Runs once for each cell. One cell per round updated must return true to continue the animation.
	 */
	public async animatedUpdateFrom(cell: MSCellState, cb = this.cellUpdateCb): Promise<void> {
		this.grid.interactiveChildren = false;

		let max = Math.max(this.state.width, this.state.height);
		for (let i = 0; i < max; i++) {
			let t = i * 2 + 1;

			let _break = true;

			for (let c = 0; c < t; c++) {
				let x = cell.x - i + c;
				let y = cell.y - i;
				if (this.state.coordsInBounds(x, y)) {
					cb(this.getCellView(x, y)) && _break && (_break = false);
				}
			}
			for (let c = 0; c < t; c++) {
				let x = cell.x + i;
				let y = cell.y - i + c;

				if (this.state.coordsInBounds(x, y)) {
					cb(this.getCellView(x, y)) && _break && (_break = false);
				}
			}
			for (let c = 0; c < t; c++) {
				let x = cell.x + i - c;
				let y = cell.y + i;

				if (this.state.coordsInBounds(x, y)) {
					cb(this.getCellView(x, y)) && _break && (_break = false);
				}
			}
			for (let c = 0; c < t; c++) {
				let x = cell.x - i;
				let y = cell.y - i + c;

				if (this.state.coordsInBounds(x, y)) {
					cb(this.getCellView(x, y)) && _break && (_break = false);
				}
			}

			if (_break) {
				break;
			}

			sounds.blop.playbackRate = (i / max) * 3 + 1;
			sounds.blop.start();

			await delay(66);
		}

		this.grid.interactiveChildren = true;
	}

	/**
	 * Default callback for `this.animatedUpdateFrom`.
	 *
	 * @param cell - Current MSCell instance.
	 */
	private cellUpdateCb(cell: MSCell): boolean {
		let needsUpdate = cell.needsUpdate;
		if (needsUpdate) {
			cell.updateViewState();
		}
		return needsUpdate;
	}

	/**
	 *
	 * @param x
	 * @param y
	 */
	public getCellView(x: number, y: number): MSCell {
		let idx = this.state.indexOf(x, y);
		let poolCell = this.cellPool[idx];

		if (!poolCell) {
			throw new Error(`Can't find view cell at ${x},${y}`);
		}

		if (!poolCell.parent) {
			poolCell.setParent(this.grid);
		}

		return poolCell;
	}

	/**
	 *
	 * @param x
	 * @param y
	 */
	public createCellView(x: number, y: number): MSCell {
		let idx = this.state.indexOf(x, y);
		let msCell = new MSCell(this);
		this.cellPool[idx] = msCell;
		msCell.on("pointertap", this.onPointerTap, this);
		msCell.on("pointerdown", this.onPointerDown, this);
		msCell.on("pointerout", this.onPointerOut, this);
		return msCell;
	}

	/**
	 *
	 */
	public checkWin() {
		if (this.state.isWin()) {
			this.animateWin();
		}
	}

	/**
	 *
	 */
	public async leftClick(cellState: MSCellState) {
		let msCell = this.getCellView(cellState.x, cellState.y);
		let x = msCell.ix;
		let y = msCell.iy;

		if (this.isFirstClick) {
			this.isFirstClick = false;
			let result = this.state.selectFirst(x, y);
			if (result.length > 1) {
				await this.animatedUpdateFrom(cellState);
			} else {
				msCell.updateViewState();
			}
		} //
		else {
			let result = this.state.select(x, y);

			if (cellState.covered) {
				sounds.blop.playbackRate = 2;
				sounds.blop.start();
			} //
			else {
				sounds.blop.playbackRate = 3;
				sounds.blop.start();
			}

			if (cellState.mine) {
				if (cellState.flag) {
					this.state.clearFlag(x, y);
				}
				msCell.updateViewState();
				this.animateLose(cellState);
			} //
			else {
				if (result.length > 1) {
					await this.animatedUpdateFrom(cellState);
				} else {
					msCell.updateViewState();
				}
			}
		}

		this.checkWin();
	}

	/**
	 *
	 * @param cellState
	 */
	public rightClick(cellState: MSCellState) {
		cellState.flag = !cellState.flag;

		if (cellState.flag) {
			sounds.blop.playbackRate = 2;
			sounds.blop.start();
		} //
		else {
			sounds.blop.playbackRate = 3;
			sounds.blop.start();
		}

		let msCell = this.getCellView(cellState.x, cellState.y);

		msCell.updateViewState();
	}

	/**
	 *
	 * @param e
	 */
	private onPointerTap(e: InteractionEvent) {
		let msCell = e.currentTarget as MSCell;

		let cellState = this.state.cellAt(msCell.ix, msCell.iy);

		if (!cellState) {
			throw new Error(`Can't find cell at ${msCell.ix},${msCell.iy}`);
		}

		switch (e.data.pointerType) {
			case "mouse":
				let isRightClick = e.data.button === 2;

				if (!isRightClick) {
					this.leftClick(cellState);
				} //
				else if (isRightClick) {
					this.rightClick(cellState);
				}
				break;

			case "touch":
				if (this.isFirstClick) {
					this.leftClick(cellState);
				} //
				else if (cellState === this.touchUi.targetCell) {
					this.touchUi.hide();
				} //
				else {
					this.touchUi.show();
					this.touchUi.setTargetCell(cellState);
					let local = this.root.toLocal(msCell.getGlobalPosition());
					this.touchUi.x = local.x;
					this.touchUi.y = local.y;
				}

				break;
		}
	}

	/**
	 *
	 * @param e
	 */
	private onPointerDown(e: InteractionEvent) {
		let msCell = e.currentTarget as MSCell;

		let cellState = this.state.cellAt(msCell.ix, msCell.iy);

		if (!cellState) {
			throw new Error(`Can't find cell at ${msCell.ix},${msCell.iy}`);
		}

		switch (e.data.pointerType) {
			case "mouse":
				let isRightClick = e.data.button === 2;

				sounds.blop.playbackRate = 1;
				sounds.blop.start();

				if (isRightClick) {
					msCell.animatePlaceFlagStart();
				} //
				else {
					msCell.animateDigStart();
				}

				break;
		}
	}

	/**
	 *
	 * @param e
	 */
	private onPointerOut(e: InteractionEvent) {
		let msCell = e.currentTarget as MSCell;

		let cellState = this.state.cellAt(msCell.ix, msCell.iy);

		if (!cellState) {
			throw new Error(`Can't find cell at ${msCell.ix},${msCell.iy}`);
		}

		switch (e.data.pointerType) {
			case "mouse":
				msCell.animatePlaceFlagCancel();
				msCell.animateDigCancel();

				break;
		}
	}
}
