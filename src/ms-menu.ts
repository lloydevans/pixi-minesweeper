import * as PIXI from "pixi.js-legacy";
import { ButtonScroller } from "./common/button-scroller";
import { ButtonText } from "./common/button-text";
import { INITIAL_GAME_CONFIG, MSApp } from "./ms-app";
import { REF_HEIGHT } from "./ms-cell";
import { MAX_GRID_HEIGHT, MAX_GRID_WIDTH, MIN_GRID_HEIGHT, MIN_GRID_WIDTH } from "./ms-state";
import { Component } from "./common/component";

export class MSMenu extends Component<MSApp> {
	private title!: PIXI.Sprite;
	private background!: PIXI.Graphics;
	private buttonStart!: ButtonText;
	private widthScroller!: ButtonScroller;
	private heightScroller!: ButtonScroller;
	private minesScroller!: ButtonScroller;

	constructor(app: MSApp) {
		super(app);
	}

	public init() {
		let textStyle = new PIXI.TextStyle({
			fontFamily: "Arial",
			fontWeight: "Bold",
			fill: 0xffffff,
			fontSize: 36
		});

		this.title = PIXI.Sprite.from(this.app.getFrame("textures", "title"));
		this.title.y = -REF_HEIGHT * 2.5;
		this.title.anchor.set(0.5);

		this.buttonStart = new ButtonText(this.app, {
			textStyle,
			text: "Start",
			backTexture: this.app.getFrame("textures", "button-long")
		});
		this.buttonStart.position.set(0, 160);
		this.buttonStart.anchor.set(0.5);

		this.widthScroller = new ButtonScroller(this.app, {
			textStyle,
			arrowTexture: this.app.getFrame("textures", "button-arrow"),
			label: "Width",
			default: INITIAL_GAME_CONFIG.gridWidth,
			min: MIN_GRID_WIDTH,
			max: MAX_GRID_WIDTH
		});
		this.widthScroller.x = 64;
		this.widthScroller.y = -80;

		this.heightScroller = new ButtonScroller(this.app, {
			textStyle,
			arrowTexture: this.app.getFrame("textures", "button-arrow"),
			label: "Height",
			default: INITIAL_GAME_CONFIG.gridWidth,
			min: MIN_GRID_HEIGHT,
			max: MAX_GRID_HEIGHT
		});
		this.heightScroller.x = 64;
		this.heightScroller.y = -10;

		this.minesScroller = new ButtonScroller(this.app, {
			textStyle,
			arrowTexture: this.app.getFrame("textures", "button-arrow"),
			label: "Mines",
			default: INITIAL_GAME_CONFIG.startMines,
			min: 1,
			max: INITIAL_GAME_CONFIG.gridWidth * INITIAL_GAME_CONFIG.gridHeight - 2
		});
		this.minesScroller.x = 64;
		this.minesScroller.y = 60;

		this.background = new PIXI.Graphics();
		this.background.beginFill(0xaaaaaa, 0.8);
		this.background.drawRect(-200, -220, 400, 450);
		this.background.endFill();

		this.addChild(this.background);
		this.addChild(this.buttonStart);
		this.addChild(this.title);
		this.addChild(this.widthScroller);
		this.addChild(this.heightScroller);
		this.addChild(this.minesScroller);

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
