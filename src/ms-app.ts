import defaults from "lodash/defaults";
import {
	Container,
	Graphics,
	InteractionEvent,
	MIPMAP_MODES,
	SCALE_MODES,
	Sprite,
	Texture,
	TilingSprite
} from "pixi.js-legacy";
import { AppBase } from "./common/app-base";
import { hexToNum } from "./common/color";
import { delay } from "./common/delay";
import { Tween } from "./common/tween";
import { preventContextMenu } from "./common/utils";
import { clamp } from "./maths/clamp";
import { MSCell, REF_HEIGHT, REF_WIDTH } from "./ms-cell";
import type { MSCellState } from "./ms-cell-state";
import { MS_CONFIG_DEFAULT } from "./ms-config";
import type { MSConfig, MSGameConfig } from "./ms-config";
import { MSMenu } from "./ms-menu";
import { MSState } from "./ms-state";
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
	public msCellPool: MSCell[] = [];
	public state: MSState = new MSState();
	public config!: MSConfig;
	public get currentTime() {
		return this.time;
	}

	private time = 0;
	private timeActive = false;
	private gameConfig: MSGameConfig;
	private background: Graphics = new Graphics();
	private board: Sprite = Sprite.from(Texture.WHITE);
	private cellHeight: number = REF_WIDTH;
	private cellWidth: number = REF_HEIGHT;
	private container: Container = new Container();
	private grid: Container = new Container();
	private isFirstClick: boolean = true;
	private touchUi: MSTouchUi = new MSTouchUi(this);
	private menu: MSMenu = new MSMenu(this);
	private ui: MSUi = new MSUi(this);
	private boardBack?: TilingSprite;

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
		this.addSpine("feedback");
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

		this.board.zIndex = 0;
		this.boardBack.zIndex = 10;
		this.grid.zIndex = 20;
		this.menu.zIndex = 30;
		this.container.sortChildren();

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

		let margin = 64;
		let maxWidth = this.width - margin * 2;
		let maxHeight = this.height - margin * 2;
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
		this.grid.removeChildren().forEach((el) => (el as MSCell).reset());

		for (let i = 0; i < this.state.totalCells; i++) {
			let [x, y] = this.state.coordsOf(i);

			let msCell;

			try {
				msCell = this.getCellView(x, y);
			} catch {
				msCell = this.createCellView(x, y);
			}

			this.grid.addChild(msCell);

			msCell.visible = false;
		}

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
			msCell.updateViewState();
			msCell.visible = true;

			if (indexes.length % Math.floor(this.state.totalCells / 16) === 0) {
				await delay(16);
			}
		}

		this.grid.x = -(this.state.width / 2) * this.cellWidth;
		this.grid.y = -(this.state.height / 2) * this.cellHeight;
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
	private animateWin() {
		this.endGame();

		let unplacedFlags = this.state.getUnplacedFlags();

		let tween = Tween.get(this);

		while (unplacedFlags.length > 0) {
			let idx = Math.floor(Math.random() * unplacedFlags.length);
			let el = unplacedFlags.splice(idx, 1)[0];
			tween = tween //
				.call(() => this.getCellView(el.x, el.y).setFlagEnabled(true))
				.wait(50);
		}
	}

	/**
	 * Animate loss.
	 */
	private animateLose(firstMine: MSCellState) {
		this.endGame();

		let result = this.state.getLossData();
		let tween = Tween.get(this);

		result.incorrect.splice(result.incorrect.indexOf(firstMine), 1);
		tween = tween //
			.call(() => this.getCellView(firstMine.x, firstMine.y).animateResult())
			.wait(50);

		while (result.incorrect.length > 0) {
			let idx = Math.floor(Math.random() * result.incorrect.length);
			let el = result.incorrect.splice(idx, 1)[0];
			let msCell = this.getCellView(el.x, el.y);
			tween = tween //
				.call(() => msCell.animateResult())
				.wait(50);
		}

		while (result.correct.length > 0) {
			let idx = Math.floor(Math.random() * result.correct.length);
			let el = result.correct.splice(idx, 1)[0];
			let msCell = this.getCellView(el.x, el.y);
			tween = tween //
				.call(() => msCell.animateResult())
				.wait(50);
		}
	}

	/**
	 *
	 */
	public async animatedUpdateFrom(cell: MSCellState, predicate: (cell: MSCell) => void): Promise<void> {
		this.grid.interactiveChildren = false;

		let tween = Tween.get(this);

		for (let i = 0; i < Math.max(this.state.width, this.state.height); i++) {
			let t = i * 2 + 1;

			tween = tween
				.call(() => {
					for (let c = 0; c < t; c++) {
						let x = cell.x - i + c;
						let y = cell.y - i;
						if (this.state.coordsInBounds(x, y)) {
							predicate(this.getCellView(x, y));
						}
					}
					for (let c = 0; c < t; c++) {
						let x = cell.x + i;
						let y = cell.y - i + c;

						if (this.state.coordsInBounds(x, y)) {
							predicate(this.getCellView(x, y));
						}
					}
					for (let c = 0; c < t; c++) {
						let x = cell.x + i - c;
						let y = cell.y + i;

						if (this.state.coordsInBounds(x, y)) {
							predicate(this.getCellView(x, y));
						}
					}
					for (let c = 0; c < t; c++) {
						let x = cell.x - i;
						let y = cell.y - i + c;

						if (this.state.coordsInBounds(x, y)) {
							predicate(this.getCellView(x, y));
						}
					}
				})
				.wait(33);
		}

		tween.call(() => (this.grid.interactiveChildren = true));

		await new Promise((resolve) => tween.on("complete", resolve));
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
				await this.animatedUpdateFrom(cellState, (cell) => cell.updateViewState());
			}
		} //
		else {
			let result = this.state.select(x, y);

			msCell.updateViewState();

			if (cellState.mine) {
				this.animateLose(cellState);
			} //
			else {
				if (result.length > 1) {
					await this.animatedUpdateFrom(cellState, (cell) => cell.updateViewState());
				}
			}
		}

		this.checkWin();
	}

	/**
	 *
	 * @param x
	 * @param y
	 */
	public getCellView(x: number, y: number): MSCell {
		let idx = this.state.indexOf(x, y);
		let poolCell = this.msCellPool[idx];

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
		this.msCellPool[idx] = msCell;
		this.grid.addChild(msCell);
		msCell.on("pointertap", this.onPointerTap, this);
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
	 * @param cellState
	 */
	public rightClick(cellState: MSCellState) {
		cellState.flag = !cellState.flag;

		let msCell = this.getCellView(cellState.x, cellState.y);

		msCell.updateViewState(cellState);
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
					this.touchUi.x = local.x + this.cellWidth / 2;
					this.touchUi.y = local.y + this.cellHeight / 2;
				}

				break;
		}
	}
}
