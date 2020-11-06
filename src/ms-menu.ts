import defer from "lodash/defer";
import { Container, Graphics, Sprite, TextStyle, Texture } from "pixi.js-legacy";
import { ButtonScroller } from "./common/button-scroller";
import { MSApp } from "./ms-app";
import { REF_HEIGHT } from "./ms-cell";
import { ButtonText } from "./common/button-text";

export class MSMenu extends Container {
	private title!: Sprite;
	private background!: Graphics;
	private buttonStart!: ButtonText;
	private widthScroller!: ButtonScroller;
	private heightScroller!: ButtonScroller;
	private app: MSApp;

	constructor(app: MSApp) {
		super();

		this.app = app;
	}

	public init() {
		let textStyle = new TextStyle({
			fontFamily: "Arial",
			fontWeight: "Bold",
			fill: 0xffffff,
			fontSize: 36
		});

		this.title = Sprite.from(this.app.getFrame("textures", "title"));
		this.title.y = -REF_HEIGHT * 2;
		this.title.scale.set(0.75);
		this.title.anchor.set(0.5);

		this.buttonStart = new ButtonText(this.app, {
			textStyle,
			text: "Start",
			backTexture: this.app.getFrame("textures", "button-long")
		});
		this.buttonStart.position.set(0, 128);
		this.buttonStart.anchor.set(0.5);

		this.widthScroller = new ButtonScroller(this.app, {
			textStyle,
			textureArrow: Texture.WHITE,
			label: "Width",
			default: 4,
			min: 4,
			max: 16
		});
		this.widthScroller.x = 64;
		this.widthScroller.y = -32;

		this.heightScroller = new ButtonScroller(this.app, {
			textStyle,
			textureArrow: Texture.WHITE,
			label: "Height",
			default: 4,
			min: 4,
			max: 16
		});
		this.heightScroller.x = 64;
		this.heightScroller.y = 32;

		this.background = new Graphics();
		this.background.beginFill(0xaaaaaa, 0.8);
		this.background.drawRect(-200, -200, 400, 400);
		this.background.endFill();

		this.addChild(this.background);
		this.addChild(this.buttonStart);
		this.addChild(this.title);
		this.addChild(this.widthScroller);
		this.addChild(this.heightScroller);

		this.widthScroller.on("set", this.updatePreview, this);
		this.heightScroller.on("set", this.updatePreview, this);
		this.updatePreview();

		this.buttonStart.on("tap", () => {
			this.visible = false;
			let gridWidth = this.widthScroller.current;
			let gridHeight = this.heightScroller.current;
			defer(() => {
				this.app.newGame({
					startMines: (gridWidth * gridHeight) / 3,
					gridWidth,
					gridHeight
				});
			});
		});
	}

	/**
	 *
	 */
	updatePreview() {
		let gridWidth = this.widthScroller.current;
		let gridHeight = this.heightScroller.current;
		this.app.previewGame({
			startMines: (gridWidth * gridHeight) / 3,
			gridWidth,
			gridHeight
		});
	}
}
