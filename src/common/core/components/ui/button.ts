import defaults from "lodash-es/defaults";
import * as PIXI from "pixi.js-legacy";
import * as Tone from "tone";
import { ComponentOptions } from "../component";
import { UiElement } from "./ui-element";

export interface ButtonOptions extends ComponentOptions {
	textureDown: PIXI.Texture;
	textureUp: PIXI.Texture;
}

export const ButtonOptionDefaults = {
	textureDown: PIXI.Texture.WHITE,
	textureUp: PIXI.Texture.WHITE,
};

/** Basic button class. */
export class Button extends UiElement {
	/** Graphic behind button content. */
	protected back!: PIXI.Sprite;

	/**  */
	protected textureDown!: PIXI.Texture;

	/**  */
	protected textureUp!: PIXI.Texture;

	/**  */
	public get tint() {
		return this.back.tint;
	}
	public set tint(value: number) {
		this.back.tint = value;
	}

	/** */
	public init(options: Partial<ButtonOptions> = {}) {
		const _options: ButtonOptions = defaults(options, ButtonOptionDefaults);
		this.textureDown = _options.textureDown;
		this.textureUp = _options.textureUp;

		this.back = PIXI.Sprite.from(this.textureUp);
		this.back.anchor.set(0.5);

		this.container.on("mouseover", this.onPointerOver, this);
		this.container.on("pointerout", this.onPointerOut, this);
		this.container.on("pointertap", this.onPointerTap, this);
		this.container.on("pointerdown", this.onPointerDown, this);
		this.container.on("pointerup", this.onPointerUp, this);
		this.container.on("pointerupoutside", this.onPointerCancel, this);
		this.container.on("pointercancel", this.onPointerCancel, this);

		if (Tone.context.state !== "running") {
			this.container.on("pointerdown", this.toneStart, this);
			this.container.on("pointerup", this.toneStart, this);
		}

		this.setInteractive(true);

		this.entity.addChild(this.container);
		this.container.addChild(this.back);
	}

	/**
	 *
	 * @param value
	 */
	public setInteractive(value: boolean) {
		this.entity.buttonMode = value;
		this.entity.interactive = value;
	}

	/**
	 * Start audio context.
	 */
	private async toneStart() {
		this.container.off("pointerdown", this.toneStart, this);
		this.container.off("pointerup", this.toneStart, this);
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
		this.back.texture = this.textureUp;
	}

	/**
	 *
	 * @param e
	 */
	protected onPointerOver(e: PIXI.InteractionEvent) {
		this.back.texture = this.textureUp;
	}

	/**
	 *
	 * @param e
	 */
	protected async onPointerUp(e: PIXI.InteractionEvent) {
		this.back.texture = this.textureUp;

		if (Tone.context.state === "running") {
			this.app.audio.play("blop", { transpose: 24, delay: 0.01 });
		}
	}

	/**
	 *
	 * @param e
	 */
	protected async onPointerDown(e: PIXI.InteractionEvent) {
		this.back.texture = this.textureDown;

		if (Tone.context.state === "running") {
			this.app.audio.play("blop", { transpose: 12 });
		}
	}

	/**
	 *
	 * @param e
	 */
	protected onPointerCancel(e: PIXI.InteractionEvent) {
		this.container.alpha = 1;
	}

	/**
	 *
	 * @param e
	 */
	protected onPointerTap(e: PIXI.InteractionEvent) {}
}
