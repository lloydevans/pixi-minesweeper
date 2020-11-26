import * as PIXI from "pixi.js-legacy";
import { UiButton } from "./common/ui-button";
import { BmText } from "./common/bm-text";
import { Spine } from "./common/spine";
import { MSApp } from "./ms-app";
import { Component } from "./common/component";

/**
 */
const MAX_TIME = 999;

/**
 * Class handle UI elements.
 */
export class MSUi extends Component<MSApp> {
	private buttonRestart!: UiButton;
	private buttonCross!: UiButton;
	private flagsContainer!: PIXI.Container;
	private flagsGraphic!: Spine;
	private flagsCount!: BmText;
	private timeContainer!: PIXI.Container;
	private timeGraphic!: Spine;
	private timeCount!: BmText;

	/**
	 * Initialisation must be called after assets are loaded.
	 */
	protected init() {
		this.flagsContainer = new PIXI.Container();
		this.flagsContainer.y = -8;

		this.flagsGraphic = new Spine(this.app.getSpine("grid-square"));
		this.flagsGraphic.state.setAnimation(0, "flag-idle", false);
		this.flagsGraphic.y = -24;

		this.flagsCount = new BmText(this.app, { fontName: "bmfont", fontSize: 38 });
		this.flagsCount._anchor.set(0, 0.5);
		this.flagsCount.x = 38;
		this.flagsCount.y = -24;

		this.timeContainer = new PIXI.Container();
		this.timeContainer.y = -8;

		this.timeGraphic = new Spine(this.app.getSpine("timer"));
		this.timeGraphic.scale.set(0.75);
		this.timeGraphic.y = -22;

		this.timeCount = new BmText(this.app, { fontName: "bmfont", fontSize: 38 });
		this.timeCount._anchor.set(0, 0.5);
		this.timeCount.x = 38;
		this.timeCount.y = -24;

		this.buttonCross = new UiButton(this.app, {
			textureUp: this.app.getFrame("textures", "button-cross"),
			textureDown: this.app.getFrame("textures", "button-cross"),
		});

		this.buttonRestart = new UiButton(this.app, {
			textureUp: this.app.getFrame("textures", "button-restart"),
			textureDown: this.app.getFrame("textures", "button-restart"),
		});

		this.timeContainer.addChild(this.timeGraphic);
		this.timeContainer.addChild(this.timeCount);

		this.flagsContainer.addChild(this.flagsGraphic);
		this.flagsContainer.addChild(this.flagsCount);

		this.addChild(this.timeContainer);
		this.addChild(this.flagsContainer);
		this.addChild(this.buttonRestart);
		this.addChild(this.buttonCross);

		this.buttonCross.on("pointertap", () => this.emit("close"));
		this.buttonRestart.on("pointertap", () => this.emit("restart"));
	}

	/**
	 * Update callback.
	 * Simple poll for changes.
	 * TODO: observables/signals/listeners?
	 *
	 * @param dt
	 */
	protected update(dt: number) {
		const flagCount = this.app.state.flagCount.toString();
		if (flagCount !== this.flagsCount.text) {
			this.flagsCount.text = flagCount;
		}

		// const time = Math.min(MAX_TIME, Math.floor(this.app.currentTime)).toString();
		// if (time !== this.timeCount.text) {
		// 	this.timeCount.text = time;
		// }
	}

	/**
	 * Resize callback.
	 */
	protected resize(width: number, height: number) {
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
