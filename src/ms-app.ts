import defaults from "lodash/defaults";
import {
	Container,
	Graphics,
	InteractionEvent,
	MIPMAP_MODES,
	SCALE_MODES,
	Sprite,
	Texture,
	utils
} from "pixi.js-legacy";
import { AppBase } from "./common/app-base";
import { hexToNum } from "./common/color";
import { Tween } from "./common/tween";
import { preventContextMenu } from "./common/utils";
import { clamp } from "./maths/clamp";
import { MSCell, REF_HEIGHT, REF_WIDTH } from "./ms-cell";
import type { MSCellState } from "./ms-cell-state";
import type { MSConfig, MSGameConfig } from "./ms-config";
import { MS_CONFIG_DEFAULT } from "./ms-config";
import { MSState } from "./ms-state";
import { MSTouchUi } from "./ms-touch-ui";
import { MSUi } from "./ms-ui";

const DEFAULT_GAME_CONFIG_DESKTOP: MSGameConfig = {
	startMines: 10,
	gridWidth: 9,
	gridHeight: 9
};

const DEFAULT_GAME_CONFIG_MOBILE: MSGameConfig = {
	startMines: 10,
	gridWidth: 8,
	gridHeight: 16
};

/**
 * Core App class.
 */
export class MSApp extends AppBase {
	public state: MSState = new MSState();
	public timeActive = false;
	public time = 0;
	public config!: MSConfig;

	private gameConfig: MSGameConfig;
	private background: Graphics = new Graphics();
	private board: Sprite = Sprite.from(Texture.WHITE);
	private cellHeight: number = REF_WIDTH;
	private cellWidth: number = REF_HEIGHT;
	private container: Container = new Container();
	private grid: Container = new Container();
	private isFirstClick: boolean = true;
	private touchUi: MSTouchUi = new MSTouchUi(this);
	private ui: MSUi;

	/**
	 *
	 */
	constructor() {
		super({});

		preventContextMenu();

		// Temporary until game dififculty selection screen is in.
		this.gameConfig = utils.isMobile.phone ? DEFAULT_GAME_CONFIG_MOBILE : DEFAULT_GAME_CONFIG_DESKTOP;

		this.ui = new MSUi(this);
		this.container.y = 32;

		this.root.addChild(this.background);
		this.root.addChild(this.container);
		this.root.addChild(this.ui);
		this.root.addChild(this.touchUi);
		this.container.addChild(this.board);
		this.container.addChild(this.grid);

		this.events.on("init", this.onInit, this);
		this.events.on("resize", this.onResize, this);
		this.events.on("update", this.onUpdate, this);
	}

	/**
	 * Init callback.
	 */
	private onInit() {
		this.addSpine("mine");
		this.addSpine("flag");
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
		this.board.tint = hexToNum(this.config.colorBoard);
		let tilesAtlas = this.getAtlas("tiles");
		if (tilesAtlas?.spritesheet) {
			tilesAtlas.spritesheet.baseTexture.mipmap = MIPMAP_MODES.OFF;
			tilesAtlas.spritesheet.baseTexture.scaleMode = SCALE_MODES.NEAREST;
			tilesAtlas.spritesheet.baseTexture.update();
		}

		this.ui.init();
		this.touchUi.init();
		this.newGame();
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

		let maxWidth = this.width - 128;
		let maxHeight = this.height - 128;
		let refBoardWidth = REF_WIDTH * this.state.width;
		let refBoardHeight = REF_HEIGHT * this.state.height;

		if (refBoardWidth > maxWidth || refBoardHeight > maxHeight) {
			if (refBoardWidth - maxWidth > refBoardHeight - maxHeight) {
				this.cellWidth = Math.floor(clamp(REF_WIDTH * (maxWidth / refBoardWidth), 16, REF_WIDTH));
				this.cellHeight = Math.floor(clamp(REF_HEIGHT * (maxWidth / refBoardWidth), 16, REF_HEIGHT));
			} //
			else {
				this.cellWidth = Math.floor(clamp(REF_WIDTH * (maxHeight / refBoardHeight), 16, REF_WIDTH));
				this.cellHeight = Math.floor(clamp(REF_HEIGHT * (maxHeight / refBoardHeight), 16, REF_HEIGHT));
			}
		}

		let dimensionsX = this.state.width * this.cellWidth;
		let dimensionsY = this.state.height * this.cellHeight;
		let boardWidth = dimensionsX + this.cellWidth / 2;
		let boardHeight = dimensionsY + this.cellHeight / 2;
		this.board.x = -boardWidth / 2;
		this.board.y = -boardHeight / 2;
		this.board.width = boardWidth;
		this.board.height = boardHeight;
		this.updateCellSize(this.cellWidth, this.cellHeight);
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
	private initGrid() {
		this.grid.removeChildren().forEach((el) => el.destroy());
		for (let x = 0; x < this.state.width; x++) {
			for (let y = 0; y < this.state.height; y++) {
				let cellState = this.state.cellAt(x, y);
				let msCell = new MSCell(this, this.cellWidth, this.cellHeight);
				cellState.view = msCell;
				this.grid.addChild(msCell);
			}
		}

		this.grid.x = -(this.state.width / 2) * this.cellWidth;
		this.grid.y = -(this.state.height / 2) * this.cellHeight;
		this.grid.children.forEach((cell) => {
			cell.on("pointertap", this.onPointerTap, this);
		});
	}

	/**
	 *
	 * @param cellWidth
	 * @param cellHeight
	 */
	private updateCellSize(cellWidth: number, cellHeight: number) {
		this.cellWidth = cellWidth;
		this.cellHeight = cellHeight;
		for (let x = 0; x < this.state.width; x++) {
			for (let y = 0; y < this.state.height; y++) {
				this.state.cellAt(x, y).view?.updateCellSize(this.cellWidth, this.cellHeight);
			}
		}
		this.grid.x = -(this.state.width / 2) * this.cellWidth;
		this.grid.y = -(this.state.height / 2) * this.cellHeight;
	}

	/**
	 * Update all cell state. TODO: more efficient update.
	 *
	 */
	public updateCellStates() {
		for (let x = 0; x < this.state.width; x++) {
			for (let y = 0; y < this.state.height; y++) {
				const state = this.state.cellAt(x, y);
				if (state.view) {
					state.view.updateState(state);
				}
			}
		}
	}

	/**
	 * Start a new game with given config.
	 *
	 * @param config
	 */
	public newGame(config: MSGameConfig = this.gameConfig) {
		Tween.removeAllTweens();

		this.state.init(config);

		this.time = 0;
		this.timeActive = true;
		this.isFirstClick = true;
		this.touchUi.hide();
		this.grid.interactiveChildren = true;

		this.initGrid();
		this.updateCellStates();
		this.onResize(this.width, this.height);
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

		let unplacedFlags = this.state.getUnplacedFlag();

		let tween = Tween.get(this);

		while (unplacedFlags.length > 0) {
			let el = unplacedFlags.splice(Math.floor(Math.random() * unplacedFlags.length), 1)[0];
			tween = tween
				.call(() => {
					this.state.placeFlag(el.x, el.y);
					this.updateCellStates();
				})
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

		tween = tween
			.call(() => {
				firstMine.view?.showResult();
				this.updateCellStates();
			})
			.wait(50);

		while (result.incorrect.length > 0) {
			let idx = Math.floor(Math.random() * result.incorrect.length);
			let el = result.incorrect.splice(idx, 1)[0];
			tween = tween
				.call(() => {
					el.view?.showResult();
					this.updateCellStates();
				})
				.wait(50);
		}

		while (result.correct.length > 0) {
			let idx = Math.floor(Math.random() * result.correct.length);
			let el = result.correct.splice(idx, 1)[0];
			tween = tween
				.call(() => {
					el.view?.showResult();
					this.updateCellStates();
				})
				.wait(50);
		}
	}

	/**
	 *
	 */
	public leftClick(cellState: MSCellState) {
		let msCell = cellState.view;

		if (msCell) {
			if (this.isFirstClick) {
				this.isFirstClick = false;
				this.state.selectFirst(msCell.ix, msCell.iy);
			} //
			else {
				this.state.select(msCell.ix, msCell.iy);

				if (cellState.mine) {
					this.animateLose(cellState);
				}
			}
		}

		this.updateCellStates();

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
		cellState.view?.updateState(cellState);
	}

	/**
	 *
	 * @param e
	 */
	private onPointerTap(e: InteractionEvent) {
		let msCell = e.currentTarget as MSCell;

		let cellState = this.state.cellAt(msCell.ix, msCell.iy);

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
				if (cellState.view) {
					if (cellState === this.touchUi.targetCell) {
						this.touchUi.hide();
					} //
					else {
						this.touchUi.show();
						this.touchUi.setTargetCell(cellState);
						let local = this.root.toLocal(cellState.view?.getGlobalPosition());
						this.touchUi.x = local.x + this.cellWidth / 2;
						this.touchUi.y = local.y + this.cellHeight / 2;
					}
				}
				break;
		}
	}
}
