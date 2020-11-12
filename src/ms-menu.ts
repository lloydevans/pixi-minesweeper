import * as PIXI from "pixi.js-legacy";
import { ButtonScroller } from "./common/button-scroller";
import { ButtonText } from "./common/button-text";
import { Component } from "./common/component";
import { GameText } from "./common/game-text";
import { INITIAL_GAME_CONFIG, MSApp } from "./ms-app";
import { MAX_GRID_HEIGHT, MAX_GRID_WIDTH, MIN_GRID_HEIGHT, MIN_GRID_WIDTH } from "./ms-state";

export class MSMenu extends Component<MSApp> {
	private title!: GameText;
	private background!: PIXI.Graphics;
	private buttonStart!: ButtonText;
	private widthScroller!: ButtonScroller;
	private heightScroller!: ButtonScroller;
	private minesScroller!: ButtonScroller;
	private container = new PIXI.Container();

	public init() {
		this.title = new GameText(this.app, "MINESWEEPER", {
			fontName: "bmfont",
			fontSize: 72
		});
		this.title.y = -190;
		this.title._anchor.set(0.5);

		this.buttonStart = new ButtonText(this.app, {
			backTexture: this.app.getFrame("textures", "button-long"),
			text: "START"
		});
		this.buttonStart.position.set(0, 180);
		this.buttonStart.anchor.set(0.5);

		this.widthScroller = new ButtonScroller(this.app, {
			arrowTexture: this.app.getFrame("textures", "button-arrow"),
			label: "Width",
			default: INITIAL_GAME_CONFIG.gridWidth,
			min: MIN_GRID_WIDTH,
			max: MAX_GRID_WIDTH
		});
		this.widthScroller.x = 64;
		this.widthScroller.y = -80;

		this.heightScroller = new ButtonScroller(this.app, {
			arrowTexture: this.app.getFrame("textures", "button-arrow"),
			label: "Height",
			default: INITIAL_GAME_CONFIG.gridWidth,
			min: MIN_GRID_HEIGHT,
			max: MAX_GRID_HEIGHT
		});
		this.heightScroller.x = 64;
		this.heightScroller.y = 0;

		this.minesScroller = new ButtonScroller(this.app, {
			arrowTexture: this.app.getFrame("textures", "button-arrow"),
			label: "Mines",
			default: INITIAL_GAME_CONFIG.startMines,
			min: 1,
			max: INITIAL_GAME_CONFIG.gridWidth * INITIAL_GAME_CONFIG.gridHeight - 2
		});
		this.minesScroller.x = 64;
		this.minesScroller.y = 80;

		this.background = new PIXI.Graphics();

		this.addChild(this.background);
		this.addChild(this.container);
		this.container.addChild(this.buttonStart);
		this.container.addChild(this.title);
		this.container.addChild(this.widthScroller);
		this.container.addChild(this.heightScroller);
		this.container.addChild(this.minesScroller);

		this.widthScroller.on("set", this.updatePreview, this);
		this.heightScroller.on("set", this.updatePreview, this);
		this.updatePreview();

		this.buttonStart.on("pointertap", () => {
			let gridWidth = this.widthScroller.current;
			let gridHeight = this.heightScroller.current;
			let startMines = this.minesScroller.current;

			this.app.newGame({
				startMines,
				gridWidth,
				gridHeight
			});
			this.app.showGame();
		});

		this.app.events.on("resize", this.onResize, this);

		this.onResize(this.app.width, this.app.height);
	}

	/**
	 *
	 * @param width
	 * @param height
	 */
	onResize(width: number, height: number) {
		this.background.clear();
		this.background.beginFill(0, 0.5);
		this.background.drawRect(-width / 2, -height / 2, width, height);
		this.background.endFill();

		// It's not great to resize like this but this menu is a temporary.
		if (width > height) {
			this.container.height = Math.min(height - 128, 410);
			this.container.scale.x = this.container.scale.y;
		} //
		else {
			this.container.width = Math.min(width - 128, 410);
			this.container.scale.y = this.container.scale.x;
		}
	}

	/**
	 *
	 */
	updatePreview() {
		let gridWidth = this.widthScroller.current;
		let gridHeight = this.heightScroller.current;
		let startMines = this.minesScroller.current;
		this.minesScroller.max = gridWidth * gridHeight - 2;
		this.app.previewGame({ startMines, gridWidth, gridHeight });
	}
}
