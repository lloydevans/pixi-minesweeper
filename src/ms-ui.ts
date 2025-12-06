import * as PIXI from "pixi.js";
import { UiButton } from "./common/ui-button";
import { BmText } from "./common/bm-text";
import { Spine } from "./common/spine";
import { MSApp } from "./ms-app";
import { Component } from "./common/component";
import { EventEmitter } from "./common/event-emitter";
import { ResizeEventData } from "./common/app-base";

/** Class handle UI elements. */
export class MSUi extends Component<MSApp> {
	public readonly onClose = new EventEmitter<void>();
	public readonly onRestart = new EventEmitter<void>();

	private buttonRestart!: UiButton;
	private buttonCross!: UiButton;
	private flagsContainer!: PIXI.Container;
	private flagsGraphic!: Spine;
	private flagsCount!: BmText;
	private timeContainer!: PIXI.Container;

	/** Initialisation must be called after assets are loaded. */
	protected init() {
		this.flagsContainer = new PIXI.Container();
		this.flagsContainer.y = -8;

		this.flagsGraphic = new Spine(this.app.getSpine("grid-square@1x"));
		this.flagsGraphic.state.setAnimation(0, "flag-idle", false);
		this.flagsGraphic.y = -24;

		this.flagsCount = new BmText(this.app, { fontName: "bmfont", fontSize: 38 });
		this.flagsCount.anchor.set(0, 0.5);
		this.flagsCount.x = 38;
		this.flagsCount.y = -24;

		this.timeContainer = new PIXI.Container();
		this.timeContainer.y = -8;

		this.buttonCross = new UiButton(this.app, {
			textureUp: this.app.getFrame("textures", "button-cross"),
			textureDown: this.app.getFrame("textures", "button-cross"),
		});

		this.buttonRestart = new UiButton(this.app, {
			textureUp: this.app.getFrame("textures", "button-restart"),
			textureDown: this.app.getFrame("textures", "button-restart"),
		});

		this.flagsContainer.addChild(this.flagsGraphic);
		this.flagsContainer.addChild(this.flagsCount);

		this.addChild(this.timeContainer);
		this.addChild(this.flagsContainer);
		this.addChild(this.buttonRestart);
		this.addChild(this.buttonCross);

		this.buttonCross.on("pointertap", () => this.onClose.emit());
		this.buttonRestart.on("pointertap", () => this.onRestart.emit());
	}

	protected update() {
		const flagCount = this.app.state.flagCount.toString();
		if (flagCount !== this.flagsCount.text) {
			this.flagsCount.text = flagCount;
		}
	}

	protected resize({ width, height }: ResizeEventData) {
		this.buttonCross.x = width / 2 - 48;
		this.buttonCross.y = -height / 2 + 42;
		this.buttonRestart.x = width / 2 - 128;
		this.buttonRestart.y = -height / 2 + 42;
		this.flagsContainer.x = -width / 2 + 32;
		this.flagsContainer.y = -height / 2 + 64;
		this.timeContainer.x = -width / 2 + 170;
		this.timeContainer.y = -height / 2 + 64;
	}
}
