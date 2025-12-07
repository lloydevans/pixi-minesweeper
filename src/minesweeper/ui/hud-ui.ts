import { Spine } from "@esotericsoftware/spine-pixi-v8";
import * as PIXI from "pixi.js";
import { ResizeEventData } from "../../common/app-base";
import { BmText } from "../../common/bm-text";
import { Component } from "../../common/component";
import { TypedEmitter } from "../../common/typed-emitter";
import { UiButton } from "../../common/ui/ui-button";
import { MinesweeperApp } from "../minesweeper-app";

/** Class handle UI elements. */
export class HudUi extends Component<MinesweeperApp> {
	public readonly onClose = new TypedEmitter<void>();
	public readonly onRestart = new TypedEmitter<void>();

	private buttonRestart!: UiButton;
	private buttonCross!: UiButton;
	private flagsContainer!: PIXI.Container;
	private flagsGraphic!: Spine;
	private flagsCount!: BmText;

	/** Initialisation must be called after assets are loaded. */
	protected init() {
		this.flagsContainer = new PIXI.Container();

		this.flagsGraphic = Spine.from(this.app.getSpine("grid-square"));
		this.flagsGraphic.state.setAnimation(0, "flag-idle", false);
		this.flagsGraphic.scale.set(0.75);

		this.flagsCount = new BmText(this.app, {
			style: { fontFamily: "bmfont", fontSize: 64 },
		});

		this.buttonCross = new UiButton(this.app, {
			textureUp: this.app.getFrame("textures", "button-cross"),
			textureDown: this.app.getFrame("textures", "button-cross"),
		});

		this.buttonRestart = new UiButton(this.app, {
			textureUp: this.app.getFrame("textures", "button-restart"),
			textureDown: this.app.getFrame("textures", "button-restart"),
		});

		this.buttonCross.scale.set(0.9);
		this.buttonRestart.scale.set(0.9);
		this.flagsCount.anchor.set(0, 0.5);
		this.flagsCount.x = 110;
		this.flagsGraphic.x = 32;

		this.flagsContainer.addChild(this.flagsGraphic);
		this.flagsContainer.addChild(this.flagsCount);

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
		this.buttonCross.x = width / 2 - 128;
		this.buttonCross.y = -height / 2 + 128;
		this.buttonRestart.x = width / 2 - 350;
		this.buttonRestart.y = -height / 2 + 128;
		this.flagsContainer.x = -width / 2 + 64;
		this.flagsContainer.y = -height / 2 + 128;
	}
}
