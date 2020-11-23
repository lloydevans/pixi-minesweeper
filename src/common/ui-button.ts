import defaults from "lodash-es/defaults";
import * as PIXI from "pixi.js-legacy";
import * as Tone from "tone";
import { AppBase } from "./app-base";
import { UiElement } from "./ui-element";

export interface ButtonOptions {
	texture: PIXI.Texture;
}

export const ButtonOptionDefaults = {
	texture: PIXI.Texture.WHITE,
};

/**
 * Very quick button class.
 */
export class UiButton extends UiElement {
	protected back: PIXI.Sprite;
	private config: ButtonOptions;

	private _active = true;
	public get active() {
		return this._active;
	}
	public set active(value: boolean) {
		if (value !== this._active) {
			this._active = value;
			if (this._active) {
				this.back.alpha = 1;
			} else {
				this.back.alpha = 0.5;
			}
			this.interactive = this._active;
			this.buttonMode = this._active;
		}
	}

	constructor(app: AppBase, config: Partial<ButtonOptions> = {}) {
		super(app);

		this.app = app;
		this.config = defaults(config, ButtonOptionDefaults);

		this.back = PIXI.Sprite.from(this.config.texture);
		this.back.anchor.set(0.5);

		this.addChild(this.back);

		this.on("mouseover", this.onPointerOver, this);
		this.on("pointerout", this.onPointerOut, this);
		this.on("pointertap", this.onPointerTap, this);
		this.on("pointerdown", this.onPointerDown, this);
		this.on("pointerup", this.onPointerUp, this);
		this.on("pointerupoutside", this.onPointerCancel, this);
		this.on("pointercancel", this.onPointerCancel, this);

		if (Tone.context.state !== "running") {
			this.on("pointerdown", this.toneStart, this);
			this.on("pointerup", this.toneStart, this);
		}

		this.setInteractive(true);
	}

	/**
	 *
	 * @param value
	 */
	public setInteractive(value: boolean) {
		this.buttonMode = value;
		this.interactive = value;
	}

	/**
	 * Start audio context.
	 */
	private async toneStart() {
		this.off("pointerdown", this.toneStart, this);
		this.off("pointerup", this.toneStart, this);
		if (Tone.context.state !== "running") {
			try {
				await Tone.start();
			} catch (err) {
				console.log(err);
			}
		}
	}

	/**
	 *
	 * @param e
	 */
	protected onPointerOut(e: PIXI.InteractionEvent) {
		this.alpha = 1;
	}

	/**
	 *
	 * @param e
	 */
	protected onPointerOver(e: PIXI.InteractionEvent) {
		this.alpha = 0.5;
	}

	/**
	 *
	 * @param e
	 */
	protected async onPointerUp(e: PIXI.InteractionEvent) {
		this.alpha = 1;

		if (Tone.context.state === "running") {
			// TODO: Configuration.
			this.app.audio.play("blop", { transpose: 24, delay: 0.05 });
		}
	}

	/**
	 *
	 * @param e
	 */
	protected async onPointerDown(e: PIXI.InteractionEvent) {
		this.alpha = 0.5;

		if (Tone.context.state === "running") {
			// TODO: Configuration.
			this.app.audio.play("blop", { transpose: 12 });
		}
	}

	/**
	 *
	 * @param e
	 */
	protected onPointerCancel(e: PIXI.InteractionEvent) {
		this.alpha = 1;
	}

	/**
	 *
	 * @param e
	 */
	protected onPointerTap(e: PIXI.InteractionEvent) {}
}
