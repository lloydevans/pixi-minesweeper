import clamp from "lodash-es/clamp";
import * as PIXI from "pixi.js-legacy";
import { hexToNum, ColorSchemes } from "./common/color";
import { Ease } from "./common/ease";
import { Scene } from "./common/scene";
import { auth, db, functions } from "./firebase";
import { MSApp } from "./ms-app";
import { MSCell, REF_HEIGHT, REF_WIDTH } from "./ms-cell";
import { CELL_STATE_DEFAULT, MSCellState } from "./ms-cell-state";
import { MSGrid } from "./ms-grid";
import { MSStateClient } from "./ms-state";
import { MSTouchUi } from "./ms-touch-ui";
import { MSUi } from "./ms-ui";

export class SceneGame extends Scene<MSApp> {
	public get currentTime() {
		return this.time;
	}

	private time = 0;
	private timeActive = false;
	private board = PIXI.Sprite.from(PIXI.Texture.WHITE);
	private cellWidth = REF_WIDTH;
	private cellHeight = REF_HEIGHT;
	private container = new PIXI.Container();
	private gridBack?: PIXI.TilingSprite;
	private grid = new MSGrid(this.app);
	private touchUi = new MSTouchUi(this.app);
	private ui = new MSUi(this.app);
	private gameId?: string;
	private gameData?: MSStateClient;
	private gameSnapshotUnsubscribe!: () => void;

	constructor(app: MSApp) {
		super(app);

		this.container.visible = false;
	}

	/**
	 *
	 */
	protected async init() {
		// @ts-ignore
		window.game = this;

		this.addChild(this.container);
		this.addChild(this.ui);
		this.addChild(this.touchUi);

		this.grid.setInteractionEnabled(false);

		this.gridBack = new PIXI.TilingSprite(this.app.getFrame("tiles", "back-0"));

		this.board.tint = hexToNum(ColorSchemes.beachRainbowDark.yellow);

		this.container.addChild(this.board);
		this.container.addChild(this.gridBack);
		this.container.addChild(this.grid);

		this.ui.on("restart", async () => {
			this.grid.setInteractionEnabled(false);
			this.app.setAllUiElementsActive(false);

			try {
				const gameId = (await functions.httpsCallable("newGame")(this.app.state.config)).data;

				if (!gameId) {
					throw new Error("New game request failed to return game ID");
				}

				await this.setGameId(gameId);
				await this.waitForBoardStateUpdate();
				await this.initGame();
			} catch (err) {
				console.log(err);
			}

			this.app.setAllUiElementsActive(true);
			this.grid.setInteractionEnabled(true);
		});

		this.ui.on("close", async () => {
			this.grid.setInteractionEnabled(false);
			this.app.setAllUiElementsActive(false);

			try {
				functions.httpsCallable("quitGame")(this.gameId);
				this.app.showMenu();
			} catch (err) {
				console.log(err);
			}

			this.app.setAllUiElementsActive(true);
			this.grid.setInteractionEnabled(true);
		});
	}

	/**
	 *
	 * @param gameId
	 */
	public async setGameId(gameId: string) {
		this.gameId = gameId;

		const gameData = await this.getGameData();

		if (!this.app.state.config) {
			this.app.state.setConfig(gameData.config);
		}

		this.gameSnapshotUnsubscribe && this.gameSnapshotUnsubscribe();
		this.gameSnapshotUnsubscribe = db
			.collection("accounts")
			.doc(auth.currentUser!.uid)
			.collection("games_client")
			.doc(this.gameId)
			.onSnapshot((doc) => {
				const data = doc.data() as MSStateClient;
				this.updateSnapshot(data);
			});

		this.updateSnapshot(gameData);

		this.resize(this.app.width, this.app.height);
	}

	/**
	 *
	 * @param data
	 */
	private updateSnapshot(data: MSStateClient) {
		this.gameData = data;

		if (data?.cells) {
			this.app.state.parseClientState(data);
			this.emit("snapshot", data);
		}
	}

	/**
	 * Start a new game with given config.
	 *
	 * @param config
	 */
	public async initGame() {
		// analytics.logEvent("new_game", this.app.state.config);
		this.grid.setInteractionEnabled(false);
		this.container.visible = true;

		this.time = 0;
		this.touchUi.hide();
		this.tweenGroup.reset();

		await this.initGrid();

		if (this.app.state.isLose()) {
			const { x, y } = this.gameData!.history[0];
			this.animateLose(x, y);
			this.grid.updateCellStateReferences();
		} //
		else if (this.app.state.isWin()) {
			this.animateWin();
			this.grid.updateCellStateReferences();
		} //
		else {
			await this.grid.noiseWipe();
			this.timeActive = true;
			this.grid.setInteractionEnabled(true);
		}
	}

	/**
	 *
	 */
	private waitForBoardStateUpdate(): Promise<MSStateClient> {
		return new Promise((resolve) => this.once("snapshot", resolve));
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
		this.gameSnapshotUnsubscribe && this.gameSnapshotUnsubscribe();
		// Prevent static cell view instances being recursivley destroyed.
		this.grid.removeChildren().forEach((el) => {
			el.off("pointertap", this.onPointerTap, this);
			el.off("pointerdown", this.onPointerDown, this);
		});
	}

	/**
	 *
	 */
	private async initGrid() {
		this.grid.removeChildren().forEach((el) => {
			el.off("pointertap", this.onPointerTap, this);
			el.off("pointerdown", this.onPointerDown, this);
		});

		while (this.app.cellPool.length < this.app.state.totalCells) {
			await this.delay(100);
		}

		for (let i = 0; i < this.app.state.totalCells; i++) {
			const [x, y] = this.app.state.coordsOf(i);
			const msCell = this.app.getCellView(x, y);
			this.grid.addChild(msCell);

			// Temporarily give the cell this state for animation purposes.
			msCell.setState({ ...CELL_STATE_DEFAULT, ...{ x, y, covered: false } });
			msCell.reset();

			msCell.on("pointertap", this.onPointerTap, this);
			msCell.on("pointerdown", this.onPointerDown, this);
		}
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
				if (this.app.state.firstMove) {
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
			this.app.background!.offset.x = this.container.pivot.x;
			this.app.background!.offset.y = this.container.pivot.y * 0.5;
		});
	}

	/**
	 *
	 */
	private setMove(x: number, y: number, flag = false) {
		// TODO: Offline mode
		return functions.httpsCallable("newMove")({ x, y, flag });
	}

	/**
	 *
	 */
	private async getGameData(): Promise<MSStateClient> {
		let gameData;

		try {
			gameData = this.app.persistentRequest(async () => {
				return (
					await db //
						.collection("accounts")
						.doc(auth.currentUser!.uid)
						.collection("games_client")
						.doc(this.gameId)
						.get()
				).data() as MSStateClient;
			});
		} catch (err) {
			throw new Error("Failed to retreive game data.");
		}

		return gameData;
	}

	/**
	 *
	 * @param cellState
	 */
	public async rightClick(cellState: MSCellState) {
		this.grid.setInteractionEnabled(false);

		cellState.flag = !cellState.flag;

		const msCell = this.app.getCellView(cellState.x, cellState.y);
		const x = msCell.ix;
		const y = msCell.iy;

		msCell.cancelPointer();

		// Set move.
		try {
			this.app.log("Place flag", x, y);
			this.setMove(x, y, true);
			await this.waitForBoardStateUpdate();
		} catch (error) {
			console.log(error.code, error.message);
		}

		this.app.log("Board updated");

		if (cellState.flag) {
			this.audio.play("blop", { transpose: 12 });
		} //
		else {
			this.audio.play("blop", { transpose: 24 });
		}

		msCell.updateViewState();

		this.grid.setInteractionEnabled(true);
	}

	/**
	 *
	 */
	public async leftClick(cellState: MSCellState) {
		this.grid.setInteractionEnabled(false);

		const msCell = this.app.getCellView(cellState.x, cellState.y);
		const x = msCell.ix;
		const y = msCell.iy;

		if (this.app.state.firstMove) {
			this.app.log("First click");
		}

		// Set move.
		try {
			this.app.log("Set move", x, y);
			this.setMove(x, y);
			await this.waitForBoardStateUpdate();
			this.app.log("Board updated");
		} catch (error) {
			console.log(error.code, error.message);
			throw new Error("Move request failed.");
		}

		// Get an array of cell coords which were uncovered by the last move.
		if (!this.app.state.lastMove) {
			throw new Error("Last move not present.");
		}
		const result = this.app.state.lastMove.uncovered;

		this.audio.play("blop", { transpose: 12 });
		this.audio.play("dirt-thud-2", { delay: 0.005, transpose: 12 });

		if (result.length > 1) {
			const s = result.length / this.app.state.totalCells;

			this.screenShake(s * 8);

			this.audio.play("rumble", { type: "attack", volume: s }); // Rumble start

			this.audio.play("dirt-thud-0", { delay: 0.005, volume: s });

			await this.grid.animateUpdateFrom(cellState);

			this.audio.play("rumble", { type: "release" }); // Rumble end
		} else {
			this.audio.play("dirt-thud-2", { delay: 0.005, transpose: 6, volume: 0.5 });
			msCell.updateViewState();
		}

		// Lose state
		if (this.app.state.isLose()) {
			this.app.log("Lose state");

			if (cellState.flag) {
				this.app.state.clearFlag(x, y);
			}

			this.audio.play("click", { delay: 0.05 });

			this.audio.play("dirt-thud-2", { delay: 0.005, transpose: 12 });

			msCell.updateViewState();
			this.animateLose(x, y);
		}

		// Win state
		else if (this.app.state.isWin()) {
			this.app.log("Win state");

			this.animateWin();
		}

		// Continue state
		else {
			this.app.log("Continue state");

			this.grid.setInteractionEnabled(true);
		}
	}

	/**
	 * Animate win.
	 */
	private async animateWin() {
		// analytics.logEvent("win_game", this.app.state.config);

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
	private async animateLose(x: number, y: number) {
		// analytics.logEvent("lose_game", this.app.state.config);

		this.endGame();

		const result = this.app.state.getResultData();

		const firstIdx = result.incorrect.findIndex((el) => el.x === x && el.y === y);
		result.incorrect.splice(firstIdx, 1);
		this.app.getCellView(x, y).animateResult();

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
		this.grid.setInteractionEnabled(false);
	}
}
