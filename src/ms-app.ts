import clamp from "lodash-es/clamp";
import defaults from "lodash-es/defaults";
import * as PIXI from "pixi.js-legacy";
import { AppBase } from "./common/app-base";
import { hexToNum } from "./common/color";
import { Ease } from "./common/ease";
import { preventContextMenu } from "./common/utils";
import { MSBg } from "./ms-bg";
import { MSCell, REF_HEIGHT, REF_WIDTH } from "./ms-cell";
import { CELL_STATE_DEFAULT } from "./ms-cell-state";
import type { MSCellState } from "./ms-cell-state";
import { MS_CONFIG_DEFAULT } from "./ms-config";
import type { MSConfig, MSGameConfig } from "./ms-config";
import { MSGrid } from "./ms-grid";
import { MSMenu } from "./ms-menu";
import { MAX_GRID_HEIGHT, MAX_GRID_WIDTH, MSState } from "./ms-state";
import { MSTouchUi } from "./ms-touch-ui";
import { MSUi } from "./ms-ui";
import { analytics } from "./firebase";

export const INITIAL_GAME_CONFIG: MSGameConfig = {
	startMines: 5,
	gridWidth: 9,
	gridHeight: 7,
};

/**
 * Core App class.
 */
export class MSApp extends AppBase {
	public state: MSState = new MSState();
	public config: MSConfig;
	public get currentTime() {
		return this.time;
	}

	private time = 0;
	private timeActive = false;
	private transitionIdx = 0;
	private cellPool: MSCell[] = [];
	private gameConfig: MSGameConfig;
	private board = PIXI.Sprite.from(PIXI.Texture.WHITE);
	private cellWidth = REF_WIDTH;
	private cellHeight = REF_HEIGHT;
	private container = new PIXI.Container();
	private grid = new MSGrid();
	private isFirstClick = true;
	private touchUi = new MSTouchUi(this);
	private menu = new MSMenu(this);
	private gridBack?: PIXI.TilingSprite;
	private ui = new MSUi(this);
	private bg = new MSBg(this);
	private isLoaded = false;

	/**
	 *
	 */
	constructor() {
		super({});

		//@ts-ignore
		window.ms = this;

		preventContextMenu();

		this.config = { ...MS_CONFIG_DEFAULT };
		this.gameConfig = { ...INITIAL_GAME_CONFIG };

		this.root.addChild(this.bg);
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
		this.addAtlas("bg", 1);
		this.addBitmapFont("bmfont");
		this.addJson("config", "config.json");
		this.addJson("audio", "audio.json");
		this.loader.load();

		this.loader.onComplete.once(this.onLoad, this);
	}

	/**
	 * Load callback.
	 */
	private onLoad() {
		this.isLoaded = true;

		this.audio.init(this.getJson("audio"));

		this.config = this.parseConfig(this.getJson("config"));

		this.gridBack = new PIXI.TilingSprite(this.getFrame("tiles", "back-0"));

		this.board.tint = hexToNum(this.config.colorBoard);

		let tilesAtlas = this.getAtlas("tiles");
		if (tilesAtlas.spritesheet) {
			tilesAtlas.spritesheet.baseTexture.mipmap = PIXI.MIPMAP_MODES.OFF;
			tilesAtlas.spritesheet.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
			tilesAtlas.spritesheet.baseTexture.update();
		}

		let bgAtlas = this.getAtlas("bg");
		if (bgAtlas.spritesheet) {
			bgAtlas.spritesheet.baseTexture.mipmap = PIXI.MIPMAP_MODES.OFF;
			bgAtlas.spritesheet.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
			bgAtlas.spritesheet.baseTexture.update();
		}

		this.ui.visible = false;

		this.container.addChild(this.board);
		this.container.addChild(this.gridBack);
		this.container.addChild(this.grid);
		this.root.addChild(this.menu);

		this.onResize(this.width, this.height);

		this.setReady();
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
		let length = this.cellPool.length;
		if (this.isLoaded && length < maxCells) {
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
		let marginX = 64;
		let marginY = 96;
		let maxWidth = width - marginX * 2;
		let maxHeight = height - marginY * 2;
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

		if (this.gridBack) {
			this.gridBack.tileScale.set(2 * (this.cellWidth / REF_WIDTH));
			this.gridBack.width = this.state.width * this.cellWidth;
			this.gridBack.height = this.state.height * this.cellHeight;
			this.gridBack.x = (-this.state.width * this.cellWidth) / 2;
			this.gridBack.y = (-this.state.height * this.cellHeight) / 2;
		}
	}

	/**
	 * Start a new game with given config.
	 *
	 * @param config
	 */
	public async newGame(config: MSGameConfig = this.gameConfig) {
		this.tweenGroup.reset();

		this.time = 0;
		this.state.init(config);
		this.grid.interactiveChildren = false;
		this.gameConfig = { ...config };
		this.isFirstClick = true;
		this.touchUi.hide();

		analytics.logEvent("new_game", this.state.config);

		await this.initGrid();

		this.timeActive = true;
		this.grid.interactiveChildren = true;
	}

	/**
	 *
	 */
	public screenShake(amp = 8, duration = 0.75, hz = 16) {
		duration = clamp(duration, 0.1, 8);
		amp = clamp(amp, 0, 16) * 0.75;
		hz = clamp(hz, 2, 16);

		let period = 1 / hz;
		let periodMs = period * 1000;
		let cycles = Math.floor(duration / period);
		let tween = this.tween(this.container.pivot);
		let angle = Math.PI / 2;
		let count = cycles * 2;

		for (let i = 0; i < count; i++) {
			let s = i / count;
			let pOffset = periodMs * s;
			let decay = -s + 1;
			let coords = {
				x: Math.sin(angle) * amp * decay,
				y: Math.cos(angle) * amp * decay,
			};
			angle += Math.PI + (Math.random() - 0.5);
			tween = tween.to(coords, periodMs / 2, Ease.sineInOut);
		}

		tween = tween.to({ x: 0, y: 0 }, periodMs / 2, Ease.sineInOut);

		tween.on("change", () => {
			this.bg.offset.x = this.container.pivot.x;
			this.bg.offset.y = this.container.pivot.y * 0.5;
		});
	}

	/**
	 *
	 */
	public showGame() {
		this.audio.playMidi("minesweeper.mid");

		this.tween(this.container.position).to({ y: 32 }, 300, Ease.sineInOut);
		this.menu.visible = false;
		this.grid.visible = true;
		this.ui.visible = true;
	}

	/**
	 *
	 */
	public showMenu() {
		this.tween(this.container.position).to({ y: 0 }, 300, Ease.sineInOut);
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
		if (this.gridBack) {
			this.gridBack.visible = true;
		}
	}

	/**
	 *
	 * @param x
	 * @param y
	 */
	public getCellView(x: number, y: number): MSCell {
		let idx = this.state.indexOf(x, y);
		let cell = this.cellPool[idx];

		if (!cell) {
			throw new Error(`Can't find cell view at ${x},${y}`);
		}

		return cell;
	}

	/**
	 *
	 * @param cellState
	 */
	public rightClick(cellState: MSCellState) {
		cellState.flag = !cellState.flag;

		if (cellState.flag) {
			this.audio.play("blop", { transpose: 12 });
		} //
		else {
			this.audio.play("blop", { transpose: 24 });
		}

		let msCell = this.getCellView(cellState.x, cellState.y);

		msCell.updateViewState();
	}

	/**
	 *
	 */
	public async leftClick(cellState: MSCellState) {
		let msCell = this.getCellView(cellState.x, cellState.y);
		let x = msCell.ix;
		let y = msCell.iy;

		let result;

		if (this.isFirstClick) {
			this.isFirstClick = false;
			result = this.state.selectFirst(x, y);
		} //
		else {
			result = this.state.select(x, y);
		}

		if (cellState.mine) {
			if (cellState.flag) {
				this.state.clearFlag(x, y);
			}

			this.audio.play("click", { delay: 0.05 });
			this.audio.play("dirt-thud-2", { delay: 0.005, transpose: 12 });

			msCell.updateViewState();
			this.animateLose(cellState);
		} //
		else {
			this.audio.play("blop", { transpose: 12 });
			this.audio.play("dirt-thud-2", { delay: 0.005, transpose: 12 });

			if (result.length > 1) {
				let s = result.length / this.state.totalCells;

				this.screenShake(s * 8);

				// Start sounds
				this.audio.play("rumble", { type: "attack", volume: s });
				this.audio.play("dirt-thud-0", { delay: 0.005, volume: s });

				await this.animateUpdateFrom(cellState);

				this.audio.play("rumble", { type: "release" });
			} else {
				this.audio.play("dirt-thud-2", { delay: 0.005, transpose: 6, volume: 0.5 });
				msCell.updateViewState();
			}
		}

		this.checkWin();
	}

	/**
	 *
	 * @param config
	 */
	private parseConfig(config: Partial<MSConfig> = {}): MSConfig {
		return defaults(config, MS_CONFIG_DEFAULT);
	}

	/**
	 *
	 */
	private async initGrid() {
		this.transitionIdx = (this.transitionIdx + 1) % 3;

		this.grid.removeChildren();

		while (this.cellPool.length < this.state.totalCells) {
			await this.delay(100);
		}

		for (let i = 0; i < this.state.totalCells; i++) {
			let [x, y] = this.state.coordsOf(i);
			let msCell = this.getCellView(x, y);
			this.grid.addChild(msCell);
			this.cellPool[i].setState({
				...CELL_STATE_DEFAULT,
				...{ x, y, covered: false },
			});
		}

		await this.delay(250);

		await this.transitionCells();
	}

	/**
	 *
	 */
	private transitionCells() {
		switch (this.transitionIdx) {
			default:
			case 0:
				return this.noiseWipe();
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
			msCell.setState(cellState);

			if (indexes.length % Math.floor(this.state.totalCells / 6) === 0) {
				let t = x / this.state.width + y / this.state.height;
				this.audio.play("blop", { transpose: t, volume: 0.5 });
				this.audio.play("blop", { transpose: t + 12, delay: 0.01, volume: 0.5 });
				await this.delay(66);
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
			msCell.setState(cellState);

			if (indexes.length % (this.state.width * Math.round(this.state.height / 10)) === 0) {
				this.audio.play("blop", { transpose: x / this.state.width + y / this.state.height });
				await this.delay(33);
			}
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
		analytics.logEvent("win_game", this.state.config);

		this.endGame();

		this.audio.play("chime-rattle-a");
		this.audio.play("chord", { transpose: 14, volume: 0.5 });

		let unplacedFlags = this.state.getUnplacedFlags();

		while (unplacedFlags.length > 0) {
			let idx = Math.floor(Math.random() * unplacedFlags.length);
			let el = unplacedFlags.splice(idx, 1)[0];
			let msCell = this.getCellView(el.x, el.y);
			msCell.setFlagEnabled(true);
			msCell.animateCorrect();

			this.audio.play("chime");

			await this.delay(66);
		}

		let correctFlags = this.state.getCorrectFlags();

		while (correctFlags.length > 0) {
			let idx = Math.floor(Math.random() * correctFlags.length);
			let el = correctFlags.splice(idx, 1)[0];
			let msCell = this.getCellView(el.x, el.y);
			msCell.animateCorrect();

			this.audio.play("chime");

			await this.delay(66);
		}
	}

	/**
	 * Animate loss.
	 */
	private async animateLose(firstMine: MSCellState) {
		analytics.logEvent("lose_game", this.state.config);

		this.endGame();

		let result = this.state.getLossData();

		result.incorrect.splice(result.incorrect.indexOf(firstMine), 1);
		this.getCellView(firstMine.x, firstMine.y).animateResult();

		await this.delay(500);

		while (result.incorrect.length > 0) {
			let idx = Math.floor(Math.random() * result.incorrect.length);
			let el = result.incorrect.splice(idx, 1)[0];
			let msCell = this.getCellView(el.x, el.y);
			let cellState = this.state.cellAt(el.x, el.y)!;

			msCell.animateResult();

			this.audio.play("click", { transpose: (Math.random() - 0.5) * 6 });

			if (!cellState.flag) {
				msCell.animateDigEnd();
			}

			await this.delay(50);
		}

		while (result.correct.length > 0) {
			let idx = Math.floor(Math.random() * result.correct.length);
			let el = result.correct.splice(idx, 1)[0];
			let msCell = this.getCellView(el.x, el.y);
			msCell.animateResult();

			this.audio.play("chime");

			await this.delay(100);
		}
	}

	/**
	 * Animate cell updates outwards from a target position.
	 *
	 * @param cell - Cell to animate outwards from.
	 * @param cb - Runs once for each cell. One cell per round updated must return true to continue the animation.
	 */
	private async animateUpdateFrom(cell: MSCellState, delay = 80, cb = this.cellUpdateCb): Promise<void> {
		this.grid.interactiveChildren = false;

		let maxSide = Math.max(this.state.width, this.state.height);

		for (let i = 0; i < maxSide; i++) {
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

			this.audio.play("blop", { transpose: 12, volume: 0.5 });
			this.audio.play("blop", { transpose: 24, delay: 0.05, volume: 0.25 });
			this.audio.play("blop", { transpose: 36, delay: 0.1, volume: 0.125 });

			await this.delay(delay);
		}

		this.grid.interactiveChildren = true;
	}

	/**
	 * Default callback for `this.animatedUpdateFrom`.
	 *
	 * @param cell - Current MSCell instance.
	 */
	private cellUpdateCb(cell: MSCell): boolean {
		let needsUpdate = cell.needsUpdate();
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
	private createCellView(x: number, y: number): MSCell {
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
	private checkWin() {
		if (this.state.isWin()) {
			this.animateWin();
		}
	}

	/**
	 *
	 * @param e
	 */
	private onPointerTap(e: PIXI.InteractionEvent) {
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
	private onPointerDown(e: PIXI.InteractionEvent) {
		let msCell = e.currentTarget as MSCell;

		let cellState = this.state.cellAt(msCell.ix, msCell.iy);

		if (!cellState) {
			throw new Error(`Can't find cell at ${msCell.ix},${msCell.iy}`);
		}

		switch (e.data.pointerType) {
			case "mouse":
				let isRightClick = e.data.button === 2;

				this.audio.play("blop");

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
	private onPointerOut(e: PIXI.InteractionEvent) {
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
