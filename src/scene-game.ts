import clamp from "lodash-es/clamp";
import * as PIXI from "pixi.js-legacy";
import { hexToNum } from "./common/color";
import { Ease } from "./common/ease";
import { Scene } from "./common/scene";
import { analytics } from "./firebase";
import { MSApp } from "./ms-app";
import { MSBg } from "./ms-bg";
import { REF_HEIGHT, REF_WIDTH, MSCell } from "./ms-cell";
import { CELL_STATE_DEFAULT, MSCellState } from "./ms-cell-state";
import type { MSGameConfig } from "./ms-config";
import { MSGrid } from "./ms-grid";
import { PanelGameOptions } from "./ui/panel-game-options";
import { MSTouchUi } from "./ms-touch-ui";
import { MSUi } from "./ms-ui";

export class SceneGame extends Scene<MSApp> {
	public get currentTime() {
		return this.time;
	}

	private time = 0;
	private timeActive = false;
	private transitionIdx = 0;
	private gameConfig!: MSGameConfig;
	private board = PIXI.Sprite.from(PIXI.Texture.WHITE);
	private cellWidth = REF_WIDTH;
	private cellHeight = REF_HEIGHT;
	private container = new PIXI.Container();
	private isFirstClick = true;
	private gridBack?: PIXI.TilingSprite;
	private grid = new MSGrid(this.app);
	private touchUi = new MSTouchUi(this.app);
	private menu = new PanelGameOptions(this.app);
	private ui = new MSUi(this.app);
	private bg = new MSBg(this.app);

	/**
	 *
	 */
	protected init() {
		this.grid.interactiveChildren = false;

		this.gridBack = new PIXI.TilingSprite(this.app.getFrame("tiles", "back-0"));

		this.board.tint = hexToNum(this.app.style.colorBoard);

		this.menu.on("start", (config: MSGameConfig) => {
			this.newGame(config);
			this.showGame();
		});

		this.menu.on("preview", (config: MSGameConfig) => {
			this.previewGame(config);
		});

		this.ui.on("close", () => {
			this.showMenu();
		});

		this.ui.on("restart", () => {
			this.app.audio.play("dirt-thud-0", { delay: 0.005, transpose: 12 });
			this.newGame(this.gameConfig);
		});

		this.ui.visible = false;

		this.container.addChild(this.board);
		this.container.addChild(this.gridBack);
		this.container.addChild(this.grid);
		this.addChild(this.bg);
		this.addChild(this.container);
		this.addChild(this.ui);
		this.addChild(this.touchUi);
		this.addChild(this.menu);
	}

	/**
	 *
	 * @param dt
	 */
	protected update(dt: number) {
		if (this.timeActive) {
			this.time += this.app.ticker.elapsedMS / 1000;
		}
	}

	/**
	 *
	 * @param width
	 * @param height
	 */
	protected resize(width: number, height: number) {
		const marginX = 64;
		const marginY = 96;
		const maxWidth = width - marginX * 2;
		const maxHeight = height - marginY * 2;
		const refBoardWidth = REF_WIDTH * this.app.state.width;
		const refBoardHeight = REF_HEIGHT * this.app.state.height;
		let scale = 1;

		if (refBoardHeight > maxHeight) {
			scale = clamp(maxHeight / refBoardHeight, 0.1, 1);
		}
		if (refBoardWidth * scale > maxWidth) {
			scale = clamp(maxWidth / refBoardWidth, 0.1, 1);
		}

		this.cellWidth = REF_WIDTH * scale;
		this.cellHeight = REF_HEIGHT * scale;

		const widthPx = this.app.state.width * this.cellWidth;
		const heightPx = this.app.state.height * this.cellHeight;
		const boardWidth = widthPx + this.cellWidth / 2;
		const boardHeight = heightPx + this.cellHeight / 2;
		this.board.x = -boardWidth / 2;
		this.board.y = -boardHeight / 2;
		this.board.width = boardWidth;
		this.board.height = boardHeight;
		this.grid.scale.set(this.cellWidth / REF_WIDTH);
		this.grid.x = -(this.app.state.width / 2) * this.cellWidth;
		this.grid.y = -(this.app.state.height / 2) * this.cellHeight;

		if (this.gridBack) {
			this.gridBack.tileScale.set(2 * (this.cellWidth / REF_WIDTH));
			this.gridBack.width = this.app.state.width * this.cellWidth;
			this.gridBack.height = this.app.state.height * this.cellHeight;
			this.gridBack.x = (-this.app.state.width * this.cellWidth) / 2;
			this.gridBack.y = (-this.app.state.height * this.cellHeight) / 2;
		}
	}

	/**
	 *
	 */
	protected cleanup() {
		// Prevent static cell view instances being recursivley destroyed.
		this.grid.removeChildren();
	}

	/**
	 *
	 */
	private async initGrid() {
		this.transitionIdx = (this.transitionIdx + 1) % 3;

		this.grid.removeChildren().forEach((el) => {
			el.off("pointertap", this.onPointerTap, this);
			el.off("pointerdown", this.onPointerDown, this);
			el.off("pointerout", this.onPointerOut, this);
		});

		while (this.app.cellPool.length < this.app.state.totalCells) {
			await this.delay(100);
		}

		for (let i = 0; i < this.app.state.totalCells; i++) {
			const [x, y] = this.app.state.coordsOf(i);
			const msCell = this.app.getCellView(x, y);
			this.grid.addChild(msCell);
			this.app.cellPool[i].setState({
				...CELL_STATE_DEFAULT,
				...{ x, y, covered: false },
			});
			msCell.on("pointertap", this.onPointerTap, this);
			msCell.on("pointerdown", this.onPointerDown, this);
			msCell.on("pointerout", this.onPointerOut, this);
		}

		await this.delay(250);

		await this.transitionCells();
	}

	/**
	 *
	 * @param e
	 */
	private onPointerTap(e: PIXI.InteractionEvent) {
		const msCell = e.currentTarget as MSCell;

		const cellState = this.app.state.cellAt(msCell.ix, msCell.iy);

		if (!cellState) {
			throw new Error(`Can't find cell at ${msCell.ix},${msCell.iy}`);
		}

		switch (e.data.pointerType) {
			case "mouse":
				const isRightClick = e.data.button === 2;

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
					const local = this.toLocal(msCell.getGlobalPosition());
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
		const msCell = e.currentTarget as MSCell;

		const cellState = this.app.state.cellAt(msCell.ix, msCell.iy);

		if (!cellState) {
			throw new Error(`Can't find cell at ${msCell.ix},${msCell.iy}`);
		}

		switch (e.data.pointerType) {
			case "mouse":
				const isRightClick = e.data.button === 2;

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
		const msCell = e.currentTarget as MSCell;

		const cellState = this.app.state.cellAt(msCell.ix, msCell.iy);

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

	/**
	 *
	 */
	private transitionCells() {
		switch (this.transitionIdx) {
			default:
			case 0:
				return this.grid.noiseWipe();
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
		this.app.state.init(config);
		this.grid.interactiveChildren = false;
		this.gameConfig = { ...config };
		this.isFirstClick = true;
		this.touchUi.hide();

		analytics.logEvent("new_game", this.app.state.config);

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

		const period = 1 / hz;
		const periodMs = period * 1000;
		const cycles = Math.floor(duration / period);
		const count = cycles * 2;
		let tween = this.tween(this.container.pivot);
		let angle = Math.PI / 2;

		for (let i = 0; i < count; i++) {
			const s = i / count;
			const decay = -s + 1;
			const coords = {
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
		this.app.audio.playMidi("minesweeper.mid");

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
		this.app.state.init(config);
		this.resize(this.app.width, this.app.height);
		if (this.gridBack) {
			this.gridBack.visible = true;
		}
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

		const msCell = this.app.getCellView(cellState.x, cellState.y);

		msCell.updateViewState();
	}

	/**
	 *
	 */
	public async leftClick(cellState: MSCellState) {
		const msCell = this.app.getCellView(cellState.x, cellState.y);
		const x = msCell.ix;
		const y = msCell.iy;

		let result;

		if (this.isFirstClick) {
			this.isFirstClick = false;
			result = this.app.state.selectFirst(x, y);
		} //
		else {
			result = this.app.state.select(x, y);
		}

		if (cellState.mine) {
			if (cellState.flag) {
				this.app.state.clearFlag(x, y);
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
				const s = result.length / this.app.state.totalCells;

				this.screenShake(s * 8);

				// Start sounds
				this.audio.play("rumble", { type: "attack", volume: s });
				this.audio.play("dirt-thud-0", { delay: 0.005, volume: s });

				await this.grid.animateUpdateFrom(cellState);

				this.audio.play("rumble", { type: "release" });
			} else {
				this.audio.play("dirt-thud-2", { delay: 0.005, transpose: 6, volume: 0.5 });
				msCell.updateViewState();
			}
		}

		this.checkWin();
	}

	/**
	 * Animate win.
	 */
	private async animateWin() {
		analytics.logEvent("win_game", this.app.state.config);

		this.endGame();

		this.audio.play("chime-rattle-a");
		this.audio.play("chord", { transpose: 12, volume: 0.5 });

		const unplacedFlags = this.app.state.getUnplacedFlags();

		while (unplacedFlags.length > 0) {
			const idx = Math.floor(Math.random() * unplacedFlags.length);
			const el = unplacedFlags.splice(idx, 1)[0];
			const msCell = this.app.getCellView(el.x, el.y);
			msCell.setFlagEnabled(true);
			msCell.animateCorrect();

			this.audio.play("chime");

			await this.delay(66);
		}

		const correctFlags = this.app.state.getCorrectFlags();

		while (correctFlags.length > 0) {
			const idx = Math.floor(Math.random() * correctFlags.length);
			const el = correctFlags.splice(idx, 1)[0];
			const msCell = this.app.getCellView(el.x, el.y);
			msCell.animateCorrect();

			this.audio.play("chime");

			await this.delay(66);
		}
	}

	/**
	 * Animate loss.
	 */
	private async animateLose(firstMine: MSCellState) {
		analytics.logEvent("lose_game", this.app.state.config);

		this.endGame();

		const result = this.app.state.getLossData();

		result.incorrect.splice(result.incorrect.indexOf(firstMine), 1);
		this.app.getCellView(firstMine.x, firstMine.y).animateResult();

		await this.delay(500);

		while (result.incorrect.length > 0) {
			const idx = Math.floor(Math.random() * result.incorrect.length);
			const el = result.incorrect.splice(idx, 1)[0];
			const msCell = this.app.getCellView(el.x, el.y);
			const cellState = this.app.state.cellAt(el.x, el.y)!;

			msCell.animateResult();

			this.audio.play("click", { transpose: (Math.random() - 0.5) * 6 });

			if (!cellState.flag) {
				msCell.animateDigEnd();
			}

			await this.delay(50);
		}

		while (result.correct.length > 0) {
			const idx = Math.floor(Math.random() * result.correct.length);
			const el = result.correct.splice(idx, 1)[0];
			const msCell = this.app.getCellView(el.x, el.y);
			msCell.animateResult();

			this.audio.play("chime");

			await this.delay(100);
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
	 *
	 */
	private checkWin() {
		if (this.app.state.isWin()) {
			this.animateWin();
		}
	}
}
