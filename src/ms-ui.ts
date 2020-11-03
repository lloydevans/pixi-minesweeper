import { Container, Graphics, Text, TextStyle } from "pixi.js-legacy";
import { Button } from "./common/button";
import { GameText } from "./common/game-text";
import { Spine } from "./common/spine";
import { MSApp } from "./ms-app";

/**
 */
const MAX_TIME = 999;

/**
 * Class handle UI elements.
 */
export class MSUi extends Container {
	private app: MSApp;
	private background: Graphics;

	// These definitely get set in initilisation.
	private buttonRestart!: Button;
	private flagsContainer!: Container;
	private flagsGraphic!: Spine;
	private flagsCount!: Text;
	private timeContainer!: Container;
	private timeGraphic!: Spine;
	private timeCount!: Text;

	/**
	 *
	 * @param app
	 */
	constructor(app: MSApp) {
		super();
		this.app = app;
		this.background = new Graphics();
		this.addChild(this.background);
	}

	/**
	 * Initialisation must be called after assets are loaded.
	 */
	init() {
		let textStyle = new TextStyle({ fill: 0xffffff, fontWeight: "bold" });

		this.flagsContainer = new Container();
		this.flagsContainer.y = -8;

		this.flagsGraphic = new Spine(this.app.getSpine("flag"));
		this.flagsGraphic.state.setAnimation(0, "place-confirm", false);
		this.flagsGraphic.scale.set(0.75);
		this.flagsGraphic.y = -4;

		this.flagsCount = new GameText(this.app, "", textStyle);
		this.flagsCount.anchor.set(0, 0.5);
		this.flagsCount.x = 38;
		this.flagsCount.y = -24;

		this.timeContainer = new Container();
		this.timeContainer.y = -8;

		this.timeGraphic = new Spine(this.app.getSpine("timer"));
		this.timeGraphic.scale.set(0.75);
		this.timeGraphic.y = -22;

		this.timeCount = new GameText(this.app, "", textStyle);
		this.timeCount.anchor.set(0, 0.5);
		this.timeCount.x = 38;
		this.timeCount.y = -24;

		this.buttonRestart = new Button(this.app, this.app.getFrame("textures", "button-restart"));
		this.buttonRestart.on("pointertap", () => this.app.newGame());

		this.timeContainer.addChild(this.timeGraphic);
		this.timeContainer.addChild(this.timeCount);

		this.flagsContainer.addChild(this.flagsGraphic);
		this.flagsContainer.addChild(this.flagsCount);

		this.addChild(this.timeContainer);
		this.addChild(this.flagsContainer);
		this.addChild(this.buttonRestart);

		this.app.events.on("update", this.onUpdate, this);
		this.app.events.on("resize", this.onResize, this);
		this.onResize(this.app.width, this.app.height);
	}

	/**
	 * Update callback.
	 * Simple poll for changes.
	 * TODO: observables/signals/listeners?
	 *
	 * @param dt
	 */
	onUpdate(dt: number) {
		let flagCount = this.app.state.flagCount.toString();
		if (flagCount !== this.flagsCount.text) {
			this.flagsCount.text = flagCount;
		}

		let time = Math.min(MAX_TIME, Math.floor(this.app.time)).toString();
		if (time !== this.timeCount.text) {
			this.timeCount.text = time;
		}
	}

	/**
	 * Resize callback.
	 */
	onResize(width: number, height: number) {
		this.buttonRestart.x = width / 2 - 64;
		this.buttonRestart.y = -height / 2 + 42;
		this.flagsContainer.x = -width / 2 + 32;
		this.flagsContainer.y = -height / 2 + 64;
		this.timeContainer.x = -width / 2 + 148;
		this.timeContainer.y = -height / 2 + 64;
	}
}
