import defaults from "lodash-es/defaults";
import * as PIXI from "pixi.js";
import * as Tone from "tone";
import { AppBase } from "../app-base";
import { UiElement } from "./ui-element";

export interface ButtonOptions {
	textureDown: PIXI.Texture;
	textureUp: PIXI.Texture;
}

export const ButtonOptionDefaults = {
	textureDown: PIXI.Texture.WHITE,
	textureUp: PIXI.Texture.WHITE,
};

/** Very quick button class. */
export class UiButton extends UiElement {
	protected back: PIXI.Sprite;
	private config: ButtonOptions;

	public get tint() {
		return this.back.tint as number;
	}
	public set tint(value: number) {
		this.back.tint = value;
	}

	constructor(app: AppBase, config: ButtonOptions) {
		super(app);

		this.app = app;
		this.config = defaults(config, ButtonOptionDefaults);

		this.back = PIXI.Sprite.from(this.config.textureUp);
		this.back.anchor.set(0.5);

		this.addChild(this.back);

		this.on("mouseover", this.handlePointerOver, this);
		this.on("pointerout", this.handlePointerOut, this);
		this.on("pointertap", this.handlePointerTap, this);
		this.on("pointerdown", this.handlePointerDown, this);
		this.on("pointerup", this.handlePointerUp, this);
		this.on("pointerupoutside", this.handlePointerCancel, this);
		this.on("pointercancel", this.handlePointerCancel, this);

		// Start Tone.js context on first interaction.
		if (Tone.getContext().state !== "running") {
			this.on("pointerdown", this.toneStart, this);
			this.on("pointerup", this.toneStart, this);
		}

		this.setInteractive(true);
	}

	public setInteractive(value: boolean) {
		this.eventMode = value ? "static" : "none";
		this.cursor = value ? "pointer" : "auto";
	}

	private async toneStart() {
		this.off("pointerdown", this.toneStart, this);
		this.off("pointerup", this.toneStart, this);
		if (Tone.getContext().state !== "running") {
			try {
				await Tone.start();
			} catch (err) {
				console.error(err);
			}
		}
	}

	protected handlePointerOut() {
		this.back.texture = this.config.textureUp;
	}

	protected handlePointerOver() {
		this.back.texture = this.config.textureUp;
	}

	protected async handlePointerUp() {
		this.back.texture = this.config.textureUp;

		this.back.scale.set(1);

		if (Tone.getContext().state === "running") {
			// TODO: Configuration.
			this.app.audio.play("blop", { transpose: 24, delay: 0.01 });
		}
	}

	protected async handlePointerDown() {
		this.back.texture = this.config.textureDown;

		this.back.scale.set(0.9);

		if (Tone.getContext().state === "running") {
			// TODO: Configuration.
			this.app.audio.play("blop", { transpose: 12 });
		}
	}

	protected handlePointerCancel() {
		this.alpha = 1;
	}

	protected handlePointerTap() {}
}
