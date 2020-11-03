import { InteractionEvent, Sprite, Texture } from "pixi.js-legacy";
import { AppBase } from "./app-base";

/**
 * Very quick button class.
 */
export class Button extends Sprite {
	private app: AppBase;
	private content: Sprite;

	constructor(app: AppBase, texture: Texture) {
		super();

		this.app = app;
		this.content = Sprite.from(texture);
		this.content.anchor.set(0.5);

		this.buttonMode = true;
		this.accessible = true;
		this.interactive = true;

		this.addChild(this.content);

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
	private onPointerOut(e: InteractionEvent) {}

	/**
	 *
	 * @param e
	 */
	private onPointerOver(e: InteractionEvent) {}

	/**
	 *
	 * @param e
	 */
	private onPointerUp(e: InteractionEvent) {}

	/**
	 *
	 * @param e
	 */
	private onPointerDown(e: InteractionEvent) {}

	/**
	 *
	 * @param e
	 */
	private onPointerCancel(e: InteractionEvent) {}

	/**
	 *
	 * @param e
	 */
	private onPointerTap(e: InteractionEvent) {
		this.emit("tap", e);
	}
}
