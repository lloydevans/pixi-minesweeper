import { InteractionEvent, Sprite, Texture } from "pixi.js-legacy";
import * as Tone from "tone";
import { sounds } from "../ms-tone";
import { AppBase } from "./app-base";

export interface ButtonConfig {
	texture: Texture;
}

/**
 * Very quick button class.
 */
export class Button extends Sprite {
	protected app: AppBase;
	protected back: Sprite;
	protected config: ButtonConfig;

	constructor(app: AppBase, config: ButtonConfig) {
		super();

		this.app = app;
		this.config = { ...config };
		this.back = Sprite.from(config.texture);
		this.back.anchor.set(0.5);

		this.buttonMode = true;
		this.accessible = true;
		this.interactive = true;

		this.addChild(this.back);

		this.on("mouseover", this.onPointerOver, this);
		this.on("pointerout", this.onPointerOut, this);
		this.on("pointertap", this.onPointerTap, this);
		this.on("pointerdown", this.onPointerDown, this);
		this.on("pointerup", this.onPointerUp, this);
		this.on("pointerupoutside", this.onPointerCancel, this);
		this.on("pointercancel", this.onPointerCancel, this);
	}

	/**
	 *
	 * @param e
	 */
	protected onPointerOut(e: InteractionEvent) {
		this.alpha = 1;
	}

	/**
	 *
	 * @param e
	 */
	protected onPointerOver(e: InteractionEvent) {
		this.alpha = 0.5;
	}

	/**
	 *
	 * @param e
	 */
	protected async onPointerUp(e: InteractionEvent) {
		this.alpha = 1;

		if (Tone.context.state !== "running") {
			await Tone.start();
		}

		sounds.blop.playbackRate = 3;
		sounds.blop.start();
	}

	/**
	 *
	 * @param e
	 */
	protected async onPointerDown(e: InteractionEvent) {
		this.alpha = 0.5;

		if (Tone.context.state !== "running") {
			await Tone.start();
		}

		sounds.blop.playbackRate = 2;
		sounds.blop.start();
	}

	/**
	 *
	 * @param e
	 */
	protected onPointerCancel(e: InteractionEvent) {
		this.alpha = 1;
	}

	/**
	 *
	 * @param e
	 */
	protected onPointerTap(e: InteractionEvent) {}
}
