import * as PIXI from "pixi.js-legacy";
import { ColorSchemes, hexToNum } from "../common/color";
import { Component } from "../common/component";
import { UiButtonScroller } from "../common/ui-button-scroller";
import { UiButtonText } from "../common/ui-button-text";
import { MSApp } from "../ms-app";
import { MS_GAME_CONFIG_DEFAULT } from "../ms-config";
import { MAX_GRID_HEIGHT, MAX_GRID_WIDTH, MIN_EMPTY, MIN_GRID_HEIGHT, MIN_GRID_WIDTH } from "../ms-state";

export class PanelGameOptions extends Component<MSApp> {
	private buttonPrimary!: UiButtonText;
	private buttonSecondary!: UiButtonText;
	private widthScroller!: UiButtonScroller;
	private heightScroller!: UiButtonScroller;
	private minesScroller!: UiButtonScroller;
	private container = new PIXI.Container();

	protected init() {
		this.buttonPrimary = new UiButtonText(this.app, {
			textureDown: this.app.getFrame("textures", "button-down"),
			textureUp: this.app.getFrame("textures", "button-up"),
			text: "START",
		});
		this.buttonPrimary.tint = hexToNum(ColorSchemes.beachRainbow.red);

		this.buttonSecondary = new UiButtonText(this.app, {
			textureDown: this.app.getFrame("textures", "button-down"),
			textureUp: this.app.getFrame("textures", "button-up"),
			text: "LOGOUT",
		});
		this.buttonSecondary.tint = hexToNum(ColorSchemes.beachRainbow.purple);

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

		this.buttonPrimary.position.set(0, 180);
		this.buttonSecondary.position.set(0, 260);
		this.widthScroller.x = 64;
		this.widthScroller.y = -80;
		this.heightScroller.x = 64;
		this.heightScroller.y = 0;
		this.minesScroller.x = 64;
		this.minesScroller.y = 80;

		this.addChild(this.container);
		this.container.addChild(this.buttonPrimary);
		this.container.addChild(this.buttonSecondary);
		this.container.addChild(this.widthScroller);
		this.container.addChild(this.heightScroller);
		this.container.addChild(this.minesScroller);

		this.widthScroller.on("set", this.updatePreview, this);
		this.heightScroller.on("set", this.updatePreview, this);
		this.updatePreview();

		this.buttonPrimary.on("pointertap", () => {
			const gridWidth = this.widthScroller.current;
			const gridHeight = this.heightScroller.current;
			const startMines = this.minesScroller.current;
			const config = { startMines, gridWidth, gridHeight };
			this.emit("start", config);
		});

		this.buttonSecondary.on("pointertap", () => {
			this.emit("logout");
		});
	}

	/**
	 *
	 * @param width
	 * @param height
	 */
	protected resize(width: number, height: number) {
		// It's not great to resize like this but this menu is a temporary.
		// if (width > height) {
		// 	this.container.height = Math.min(height - 128, 410);
		// 	this.container.scale.x = this.container.scale.y;
		// } //
		// else {
		// 	this.container.width = Math.min(width - 128, 410);
		// 	this.container.scale.y = this.container.scale.x;
		// }
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
