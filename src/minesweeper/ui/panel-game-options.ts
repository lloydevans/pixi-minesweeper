import * as PIXI from "pixi.js-legacy";
import { ColorSchemes, hexToNum } from "../../common/color";
import { ButtonScroller } from "../../common/core/components/ui/button-scroller";
import { ButtonText } from "../../common/core/components/ui/button-text";
import { Entity } from "../../common/core/entity/entity";
import { MS_GAME_CONFIG_DEFAULT } from "../ms-config";
import { MAX_GRID_HEIGHT, MAX_GRID_WIDTH, MIN_EMPTY, MIN_GRID_HEIGHT, MIN_GRID_WIDTH } from "../ms-state";

export class PanelGameOptions extends Entity {
	private buttonPrimary!: ButtonText;
	private buttonSecondary!: ButtonText;
	private widthScroller!: ButtonScroller;
	private heightScroller!: ButtonScroller;
	private minesScroller!: ButtonScroller;
	private container = new PIXI.Container();

	protected init() {
		this.buttonPrimary = new Entity(this.app).add(ButtonText);
		this.buttonPrimary.setOptions({
			textureDown: this.app.getFrame("textures", "button-down"),
			textureUp: this.app.getFrame("textures", "button-up"),
			tint: hexToNum(ColorSchemes.beachRainbow.red),
			text: "START",
		});

		this.buttonSecondary = new Entity(this.app).add(ButtonText);
		this.buttonSecondary.setOptions({
			textureDown: this.app.getFrame("textures", "button-down"),
			textureUp: this.app.getFrame("textures", "button-up"),
			tint: hexToNum(ColorSchemes.beachRainbow.purple),
			text: "LOGOUT",
		});

		this.widthScroller = new Entity(this.app).add(ButtonScroller);
		this.widthScroller.setOptions({
			arrowTexture: this.app.getFrame("textures", "button-arrow"),
			text: "Width",
			default: MS_GAME_CONFIG_DEFAULT.gridWidth,
			min: MIN_GRID_WIDTH,
			max: MAX_GRID_WIDTH,
		});

		this.heightScroller = new Entity(this.app).add(ButtonScroller);
		this.widthScroller.setOptions({
			arrowTexture: this.app.getFrame("textures", "button-arrow"),
			text: "Height",
			default: MS_GAME_CONFIG_DEFAULT.gridHeight,
			min: MIN_GRID_HEIGHT,
			max: MAX_GRID_HEIGHT,
		});

		this.minesScroller = new Entity(this.app).add(ButtonScroller);
		this.widthScroller.setOptions({
			arrowTexture: this.app.getFrame("textures", "button-arrow"),
			text: "Mines",
			default: MS_GAME_CONFIG_DEFAULT.startMines,
			min: 1,
			max: MS_GAME_CONFIG_DEFAULT.gridWidth * MS_GAME_CONFIG_DEFAULT.gridHeight - MIN_EMPTY,
		});

		this.buttonPrimary.entity.position.set(0, 180);
		this.buttonSecondary.entity.position.set(0, 260);
		this.widthScroller.entity.x = 64;
		this.widthScroller.entity.y = -80;
		this.heightScroller.entity.x = 64;
		this.heightScroller.entity.y = 0;
		this.minesScroller.entity.x = 64;
		this.minesScroller.entity.y = 80;

		this.addChild(this.container);
		this.container.addChild(this.buttonPrimary.entity);
		this.container.addChild(this.buttonSecondary.entity);
		this.container.addChild(this.widthScroller.entity);
		this.container.addChild(this.heightScroller.entity);
		this.container.addChild(this.minesScroller.entity);

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

	/** */
	protected updatePreview() {
		const gridWidth = this.widthScroller.current;
		const gridHeight = this.heightScroller.current;
		const startMines = this.minesScroller.current;
		this.minesScroller.max = gridWidth * gridHeight - MIN_EMPTY;
		this.emit("preview", { startMines, gridWidth, gridHeight });
	}
}
