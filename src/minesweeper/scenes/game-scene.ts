import { logEvent } from "firebase/analytics";
import clamp from "lodash-es/clamp";
import * as PIXI from "pixi.js";
import { ResizeEventData } from "../../common/app-base";
import { hexToNum } from "../../common/color";
import { Ease } from "../../common/ease";
import { Scene } from "../../common/scene";
import { analytics } from "../../firebase";
import { HudUi } from "../ui/hud-ui";
import { MinesweeperApp } from "../minesweeper-app";
import { MinesweeperCell, REF_HEIGHT, REF_WIDTH } from "../minesweeper-cell";
import { CELL_STATE_DEFAULT, MinesweeperCellState } from "../minesweeper-cell-state";
import { MinesweeperGridConfig } from "../minesweeper-config";
import { CellGrid } from "../cell-grid";
import { GridConfigUi } from "../ui/grid-config-ui";
import { ScrollingBackground } from "../scrolling-background";
import { TouchscreenUi } from "../ui/touchscreen-ui";

export class GameScene extends Scene<MinesweeperApp> {
	private transitionIdx = 0;
	private gridConfig!: MinesweeperGridConfig;
	private boardFrame = PIXI.Sprite.from(PIXI.Texture.WHITE);
	private cellWidth = REF_WIDTH;
	private cellHeight = REF_HEIGHT;
	private container = new PIXI.Container();
	private isFirstClick = true;
	private gridBack!: PIXI.TilingSprite;
	private hud = new HudUi(this.app);
	private cellGrid = new CellGrid(this.app);
	private gridConfigUi = new GridConfigUi(this.app);
	private touchscreenUi = new TouchscreenUi(this.app);
	private scrollingBackground = new ScrollingBackground(this.app);

	init() {
		this.cellGrid.interactiveChildren = false;

		this.gridBack = new PIXI.TilingSprite(this.app.getFrame("tiles", "back-0"));

		this.boardFrame.tint = hexToNum(this.app.config.colorBoard);

		this.gridConfigUi.onStartGame.on((config: MinesweeperGridConfig) => {
			this.newGame(config);
			this.showGame();
		});

		this.gridConfigUi.onPreviewGrid.on((config: MinesweeperGridConfig) => {
			this.previewGame(config);
		});

		this.hud.onClose.on(() => {
			this.showMenu();
		});

		this.hud.onRestart.on(() => {
			this.app.audio.play("dirt-thud-0", { delay: 0.005, transpose: 12 });
			this.newGame(this.gridConfig);
		});

		this.hud.visible = false;

		this.container.addChild(this.boardFrame);
		this.container.addChild(this.gridBack);
		this.container.addChild(this.cellGrid);
		this.addChild(this.scrollingBackground);
		this.addChild(this.container);
		this.addChild(this.hud);
		this.addChild(this.touchscreenUi);
		this.addChild(this.gridConfigUi);
	}

	resize({ width, height }: ResizeEventData) {
		const marginX = 256;
		const marginY = 256;
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

		const dimensionsX = this.app.state.width * this.cellWidth;
		const dimensionsY = this.app.state.height * this.cellHeight;
		const boardWidth = dimensionsX + this.cellWidth / 2;
		const boardHeight = dimensionsY + this.cellHeight / 2;
		this.boardFrame.x = -boardWidth / 2;
		this.boardFrame.y = -boardHeight / 2;
		this.boardFrame.width = boardWidth;
		this.boardFrame.height = boardHeight;
		this.cellGrid.scale.set(this.cellWidth / REF_WIDTH);
		this.cellGrid.x = -(this.app.state.width / 2) * this.cellWidth;
		this.cellGrid.y = -(this.app.state.height / 2) * this.cellHeight;

		if (this.gridBack) {
			this.gridBack.tileScale.set(2 * (this.cellWidth / REF_WIDTH));
			this.gridBack.width = this.app.state.width * this.cellWidth;
			this.gridBack.height = this.app.state.height * this.cellHeight;
			this.gridBack.x = (-this.app.state.width * this.cellWidth) / 2;
			this.gridBack.y = (-this.app.state.height * this.cellHeight) / 2;
		}
	}

	private async initGrid() {
		this.transitionIdx = (this.transitionIdx + 1) % 3;

		this.cellGrid.removeChildren().forEach((el) => {
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
			this.cellGrid.addChild(msCell);
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

	private onPointerTap(e: PIXI.FederatedPointerEvent) {
		const msCell = e.currentTarget as MinesweeperCell;

		const cellState = this.app.state.cellAt(msCell.ix, msCell.iy);

		if (!cellState) {
			throw new Error(`Can't find cell at ${msCell.ix},${msCell.iy}`);
		}

		switch (e.pointerType) {
			case "mouse": {
				const isRightClick = e.button === 2;

				if (!isRightClick) {
					this.leftClick(cellState);
				} //
				else if (isRightClick) {
					this.rightClick(cellState);
				}
				break;
			}
			case "touch":
				if (this.isFirstClick) {
					this.leftClick(cellState);
				} //
				else if (cellState === this.touchscreenUi.targetCell) {
					this.touchscreenUi.hide();
				} //
				else {
					this.touchscreenUi.show();
					this.touchscreenUi.setTargetCell(cellState);
					const local = this.toLocal(msCell.getGlobalPosition());
					this.touchscreenUi.x = local.x;
					this.touchscreenUi.y = local.y;
				}

				break;
		}
	}

	private onPointerDown(e: PIXI.FederatedPointerEvent) {
		const msCell = e.currentTarget as MinesweeperCell;

		const cellState = this.app.state.cellAt(msCell.ix, msCell.iy);

		if (!cellState) {
			throw new Error(`Can't find cell at ${msCell.ix},${msCell.iy}`);
		}

		switch (e.pointerType) {
			case "mouse":
				{
					const isRightClick = e.button === 2;

					this.audio.play("blop");

					if (isRightClick) {
						msCell.animatePlaceFlagStart();
					} //
					else {
						msCell.animateDigStart();
					}
				}

				break;
		}
	}

	private onPointerOut(e: PIXI.FederatedPointerEvent) {
		const msCell = e.currentTarget as MinesweeperCell;

		const cellState = this.app.state.cellAt(msCell.ix, msCell.iy);

		if (!cellState) {
			throw new Error(`Can't find cell at ${msCell.ix},${msCell.iy}`);
		}

		switch (e.pointerType) {
			case "mouse":
				msCell.animatePlaceFlagCancel();
				msCell.animateDigCancel();
				break;
		}
	}

	private transitionCells() {
		switch (this.transitionIdx) {
			default:
			case 0:
				return this.cellGrid.noiseWipe();
		}
	}

	public async newGame(config: MinesweeperGridConfig = this.gridConfig) {
		this.tweenGroup.reset();

		this.app.state.init(config);
		this.cellGrid.interactiveChildren = false;
		this.cellGrid.clearTweens();
		this.gridConfig = { ...config };
		this.isFirstClick = true;
		this.touchscreenUi.hide();

		logEvent(analytics, "new_game", this.app.state.config);

		await this.initGrid();

		this.cellGrid.interactiveChildren = true;
	}

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
			this.scrollingBackground.offset.x = this.container.pivot.x;
			this.scrollingBackground.offset.y = this.container.pivot.y * 0.5;
		});
	}

	public showGame() {
		this.app.audio.playMidi("minesweeper.mid");

		this.tween(this.container.position).to({ y: 32 }, 300, Ease.sineInOut);
		this.gridConfigUi.visible = false;
		this.cellGrid.visible = true;
		this.hud.visible = true;
	}

	public showMenu() {
		this.tween(this.container.position).to({ y: 0 }, 300, Ease.sineInOut);
		this.gridConfigUi.visible = true;
		this.cellGrid.visible = false;
		this.hud.visible = false;
	}

	public previewGame(config: MinesweeperGridConfig = this.gridConfig) {
		this.app.state.init(config);
		this.resize(this.app);
		if (this.gridBack) {
			this.gridBack.visible = true;
		}
	}

	public rightClick(cellState: MinesweeperCellState) {
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

	public async leftClick(cellState: MinesweeperCellState) {
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

				await this.cellGrid.animateUpdateFrom(cellState);

				this.audio.play("rumble", { type: "release" });
			} else {
				this.audio.play("dirt-thud-2", { delay: 0.005, transpose: 6, volume: 0.5 });
				msCell.updateViewState();
			}
		}

		this.checkWin();
	}

	private async animateWin() {
		logEvent(analytics, "win_game", this.app.state.config);

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

	private async animateLose(firstMine: MinesweeperCellState) {
		logEvent(analytics, "lose_game", this.app.state.config);

		this.endGame();

		const result = this.app.state.getLossData();

		result.incorrect.splice(result.incorrect.indexOf(firstMine), 1);
		this.app.getCellView(firstMine.x, firstMine.y).animateResult();

		await this.delay(500);

		while (result.incorrect.length > 0) {
			const idx = Math.floor(Math.random() * result.incorrect.length);
			const el = result.incorrect.splice(idx, 1)[0];
			const msCell = this.app.getCellView(el.x, el.y);
			const cellState = this.app.state.cellAt(el.x, el.y);

			if (!cellState) throw new Error(`Can't find cell at ${el.x},${el.y}`);

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

	private endGame() {
		this.cellGrid.interactiveChildren = false;
	}

	private checkWin() {
		if (this.app.state.isWin()) {
			this.animateWin();
		}
	}
}
