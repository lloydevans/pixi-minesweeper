import * as PIXI from "pixi.js-legacy";
import * as Tone from "tone";
import { sounds } from "../ms-tone";
import { AppBase } from "./app-base";

export interface ButtonConfig {
	texture: PIXI.Texture;
}

/**
 * Very quick button class.
 */
export class Button extends PIXI.Sprite {
	protected app: AppBase;
	protected back: PIXI.Sprite;
	protected config: ButtonConfig;

	constructor(app: AppBase, config: ButtonConfig) {
		super();

		this.app = app;
		this.config = { ...config };
		this.back = PIXI.Sprite.from(config.texture);
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

		if (Tone.context.state !== "running") {
			this.on("pointerdown", this.toneStart, this);
			this.on("pointerup", this.toneStart, this);
		}
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

		sounds.blop.playbackRate = 3;
		sounds.blop.start();
	}

	/**
	 *
	 * @param e
	 */
	protected async onPointerDown(e: PIXI.InteractionEvent) {
		this.alpha = 0.5;

		sounds.blop.playbackRate = 2;
		sounds.blop.start();
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
