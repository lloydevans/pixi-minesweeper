import * as PIXI from "pixi.js-legacy";
import { Button } from "./common/button";
import { GameText } from "./common/game-text";
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
	private background!: PIXI.Graphics;
	private buttonRestart!: Button;
	private buttonCross!: Button;
	private flagsContainer!: PIXI.Container;
	private flagsGraphic!: Spine;
	private flagsCount!: GameText;
	private timeContainer!: PIXI.Container;
	private timeGraphic!: Spine;
	private timeCount!: GameText;

	/**
	 * Initialisation must be called after assets are loaded.
	 */
	protected init() {
		this.background = new PIXI.Graphics();

		this.flagsContainer = new PIXI.Container();
		this.flagsContainer.y = -8;

		this.flagsGraphic = new Spine(this.app.getSpine("grid-square"));
		this.flagsGraphic.state.setAnimation(0, "flag-idle", false);
		this.flagsGraphic.y = -24;

		this.flagsCount = new GameText(this.app, "", {
			fontName: "bmfont",
			fontSize: 38,
		});
		this.flagsCount._anchor.set(0, 0.5);
		this.flagsCount.x = 38;
		this.flagsCount.y = -24;

		this.timeContainer = new PIXI.Container();
		this.timeContainer.y = -8;

		this.timeGraphic = new Spine(this.app.getSpine("timer"));
		this.timeGraphic.scale.set(0.75);
		this.timeGraphic.y = -22;

		this.timeCount = new GameText(this.app, "", {
			fontName: "bmfont",
			fontSize: 38,
		});
		this.timeCount._anchor.set(0, 0.5);
		this.timeCount.x = 38;
		this.timeCount.y = -24;

		this.buttonCross = new Button(this.app, {
			texture: this.app.getFrame("textures", "button-cross"),
		});
		this.buttonCross.on("pointertap", () => this.app.showMenu());

		this.buttonRestart = new Button(this.app, {
			texture: this.app.getFrame("textures", "button-restart"),
		});
		this.buttonRestart.on("pointertap", () => {
			this.app.audio.play("dirt-thud-0", { delay: 0.005, transpose: 12 });
			this.app.newGame();
		});

		this.timeContainer.addChild(this.timeGraphic);
		this.timeContainer.addChild(this.timeCount);

		this.flagsContainer.addChild(this.flagsGraphic);
		this.flagsContainer.addChild(this.flagsCount);

		this.addChild(this.background);
		this.addChild(this.timeContainer);
		this.addChild(this.flagsContainer);
		this.addChild(this.buttonRestart);
		this.addChild(this.buttonCross);
	}

	/**
	 * Update callback.
	 * Simple poll for changes.
	 * TODO: observables/signals/listeners?
	 *
	 * @param dt
	 */
	protected update(dt: number) {
		let flagCount = this.app.state.flagCount.toString();
		if (flagCount !== this.flagsCount.text) {
			this.flagsCount.text = flagCount;
		}

		let time = Math.min(MAX_TIME, Math.floor(this.app.currentTime)).toString();
		if (time !== this.timeCount.text) {
			this.timeCount.text = time;
		}
	}

	/**
	 * Resize callback.
	 */
	protected resize(width: number, height: number) {
		this.buttonRestart.x = width / 2 - 64;
		this.buttonRestart.y = -height / 2 + 42;
		this.buttonCross.x = width / 2 - 148;
		this.buttonCross.y = -height / 2 + 42;
		this.flagsContainer.x = -width / 2 + 32;
		this.flagsContainer.y = -height / 2 + 64;
		this.timeContainer.x = -width / 2 + 170;
		this.timeContainer.y = -height / 2 + 64;
	}
}
