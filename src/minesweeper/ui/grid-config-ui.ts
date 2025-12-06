import * as PIXI from "pixi.js";
import { ResizeEventData } from "../../common/app-base";
import { BmText } from "../../common/bm-text";
import { Component } from "../../common/component";
import { EventEmitter } from "../../common/event-emitter";
import { UiButtonScroller } from "../../common/ui-button-scroller";
import { UiButtonText } from "../../common/ui-button-text";
import { INITIAL_GAME_CONFIG, MinesweeperApp } from "../minesweeper-app";
import { MAX_GRID_HEIGHT, MAX_GRID_WIDTH, MIN_EMPTY, MIN_GRID_HEIGHT, MIN_GRID_WIDTH } from "../minesweeper-state";

export interface GameConfigData {
	startMines: number;
	gridWidth: number;
	gridHeight: number;
}

export class GridConfigUi extends Component<MinesweeperApp> {
	public readonly onStartGame = new EventEmitter<GameConfigData>();
	public readonly onPreviewGrid = new EventEmitter<GameConfigData>();

	private title!: PIXI.BitmapText;
	private background!: PIXI.Graphics;
	private startButton!: UiButtonText;
	private widthScroller!: UiButtonScroller;
	private heightScroller!: UiButtonScroller;
	private minesScroller!: UiButtonScroller;
	private container = new PIXI.Container();

	protected init() {
		this.background = new PIXI.Graphics();

		this.title = new BmText(this.app, {
			text: "MINESWEEPER",
			style: {
				fontFamily: "bmfont",
				fontSize: 128,
			},
		});
		this.title.anchor.set(0.5);

		this.startButton = new UiButtonText(this.app, {
			textureUp: this.app.getFrame("textures", "button-long"),
			textureDown: this.app.getFrame("textures", "button-long"),
			fontSize: 72,
			text: "START",
		});
		this.startButton.position.set(0, 550);

		this.widthScroller = new UiButtonScroller(this.app, {
			arrowTexture: this.app.getFrame("textures", "button-arrow"),
			label: "Width",
			default: INITIAL_GAME_CONFIG.gridWidth,
			min: MIN_GRID_WIDTH,
			max: MAX_GRID_WIDTH,
		});

		this.heightScroller = new UiButtonScroller(this.app, {
			arrowTexture: this.app.getFrame("textures", "button-arrow"),
			label: "Height",
			default: INITIAL_GAME_CONFIG.gridHeight,
			min: MIN_GRID_HEIGHT,
			max: MAX_GRID_HEIGHT,
		});

		this.minesScroller = new UiButtonScroller(this.app, {
			arrowTexture: this.app.getFrame("textures", "button-arrow"),
			label: "Mines",
			default: INITIAL_GAME_CONFIG.startMines,
			min: 1,
			max: INITIAL_GAME_CONFIG.gridWidth * INITIAL_GAME_CONFIG.gridHeight - MIN_EMPTY,
		});

		this.title.y = -600;
		this.widthScroller.y = -280;
		this.heightScroller.y = -20;
		this.minesScroller.y = 240;

		this.container.scale.set(0.75);

		this.addChild(this.background);
		this.addChild(this.container);
		this.container.addChild(this.startButton);
		this.container.addChild(this.title);
		this.container.addChild(this.widthScroller);
		this.container.addChild(this.heightScroller);
		this.container.addChild(this.minesScroller);

		this.widthScroller.onSet.on(this.updatePreview, this);
		this.heightScroller.onSet.on(this.updatePreview, this);
		this.updatePreview();

		this.startButton.on("pointertap", () => {
			const gridWidth = this.widthScroller.currentValue;
			const gridHeight = this.heightScroller.currentValue;
			const startMines = this.minesScroller.currentValue;
			this.onStartGame.emit({ startMines, gridWidth, gridHeight });
		});
	}

	protected resize({ width, height }: ResizeEventData) {
		this.background.clear();
		this.background.rect(-width / 2, -height / 2, width, height);
		this.background.fill({ color: 0x000000, alpha: 0.75 });
	}

	protected updatePreview() {
		const gridWidth = this.widthScroller.currentValue;
		const gridHeight = this.heightScroller.currentValue;
		const startMines = this.minesScroller.currentValue;
		this.minesScroller.max = gridWidth * gridHeight - MIN_EMPTY;
		this.onPreviewGrid.emit({ startMines, gridWidth, gridHeight });
	}
}
