import * as PIXI from "pixi.js-legacy";
import { UiButtonScroller } from "./common/ui-button-scroller";
import { UiButtonText } from "./common/ui-button-text";
import { Component } from "./common/component";
import { GameText } from "./common/game-text";
import { MSApp } from "./ms-app";
import { MAX_GRID_HEIGHT, MAX_GRID_WIDTH, MIN_GRID_HEIGHT, MIN_GRID_WIDTH, MIN_EMPTY } from "./ms-state";
import { MS_GAME_CONFIG_DEFAULT } from "./ms-config";

export class MSMenu extends Component<MSApp> {
	private title!: GameText;
	private background!: PIXI.Graphics;
	private buttonStart!: UiButtonText;
	private widthScroller!: UiButtonScroller;
	private heightScroller!: UiButtonScroller;
	private minesScroller!: UiButtonScroller;
	private container = new PIXI.Container();

	protected init() {
		this.background = new PIXI.Graphics();

		this.title = new GameText(this.app, { text: "MINESWEEPER", fontName: "bmfont", fontSize: 72 });
		this.title.y = -190;
		this.title._anchor.set(0.5);

		this.buttonStart = new UiButtonText(this.app, {
			backTexture: this.app.getFrame("textures", "button-long"),
			label: "START",
		});
		this.buttonStart.position.set(0, 180);
		// this.buttonStart.anchor.set(0.5);

		this.widthScroller = new UiButtonScroller(this.app, {
			arrowTexture: this.app.getFrame("textures", "button-arrow"),
			label: "Width",
			default: MS_GAME_CONFIG_DEFAULT.gridWidth,
			min: MIN_GRID_WIDTH,
			max: MAX_GRID_WIDTH,
		});

		this.heightScroller = new UiButtonScroller(this.app, {
			arrowTexture: this.app.getFrame("textures", "button-arrow"),
			label: "Height",
			default: MS_GAME_CONFIG_DEFAULT.gridHeight,
			min: MIN_GRID_HEIGHT,
			max: MAX_GRID_HEIGHT,
		});

		this.minesScroller = new UiButtonScroller(this.app, {
			arrowTexture: this.app.getFrame("textures", "button-arrow"),
			label: "Mines",
			default: MS_GAME_CONFIG_DEFAULT.startMines,
			min: 1,
			max: MS_GAME_CONFIG_DEFAULT.gridWidth * MS_GAME_CONFIG_DEFAULT.gridHeight - MIN_EMPTY,
		});

		this.widthScroller.x = 64;
		this.widthScroller.y = -80;
		this.heightScroller.x = 64;
		this.heightScroller.y = 0;
		this.minesScroller.x = 64;
		this.minesScroller.y = 80;

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
			const gridWidth = this.widthScroller.current;
			const gridHeight = this.heightScroller.current;
			const startMines = this.minesScroller.current;
			this.emit("start", { startMines, gridWidth, gridHeight });
		});
	}

	/**
	 *
	 * @param width
	 * @param height
	 */
	protected resize(width: number, height: number) {
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
	protected updatePreview() {
		const gridWidth = this.widthScroller.current;
		const gridHeight = this.heightScroller.current;
		const startMines = this.minesScroller.current;
		this.minesScroller.max = gridWidth * gridHeight - MIN_EMPTY;
		this.emit("preview", { startMines, gridWidth, gridHeight });
	}
}
