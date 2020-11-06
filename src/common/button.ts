import { InteractionEvent, Sprite, Texture } from "pixi.js-legacy";
import { AppBase } from "./app-base";

export interface ButtonConfig {}

/**
 * Very quick button class.
 */
export class Button extends Sprite {
	protected app: AppBase;
	protected back: Sprite;

	constructor(app: AppBase, texture: Texture) {
		super();

		this.app = app;
		this.back = Sprite.from(texture);
		this.back.anchor.set(0.5);

		this.buttonMode = true;
		this.accessible = true;
		this.interactive = true;

		this.addChild(this.back);

		this.on("mouseout", this.onPointerOut, this);
		this.on("mouseover", this.onPointerOver, this);
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
	protected onPointerOut(e: InteractionEvent) {}

	/**
	 *
	 * @param e
	 */
	protected onPointerOver(e: InteractionEvent) {}

	/**
	 *
	 * @param e
	 */
	protected onPointerUp(e: InteractionEvent) {}

	/**
	 *
	 * @param e
	 */
	protected onPointerDown(e: InteractionEvent) {}

	/**
	 *
	 * @param e
	 */
	protected onPointerCancel(e: InteractionEvent) {}

	/**
	 *
	 * @param e
	 */
	protected onPointerTap(e: InteractionEvent) {
		this.emit("tap", e);
	}
}
