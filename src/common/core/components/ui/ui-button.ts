import defaults from "lodash-es/defaults";
import * as PIXI from "pixi.js-legacy";
import * as Tone from "tone";
import { Entity } from "../../entity/entity";
import { UiElement } from "./ui-element";

export interface ButtonOptions {
	textureDown: PIXI.Texture;
	textureUp: PIXI.Texture;
}

export const ButtonOptionDefaults = {
	textureDown: PIXI.Texture.WHITE,
	textureUp: PIXI.Texture.WHITE,
};

/**
 * Basic button class.
 */
export class UiButton extends UiElement {
	/**
	 * Graphic behind button content.
	 */
	protected back: PIXI.Sprite;

	/**
	 * Configuration options.
	 */
	public options: ButtonOptions;

	public get tint() {
		return this.back.tint;
	}
	public set tint(value: number) {
		this.back.tint = value;
	}

	/**
	 * Components are instantiated via `Entity.prototype.add`.
	 *
	 * @param entity - The Entity instance this component will be added to.
	 */
	public constructor(entity: Entity) {
		super(entity);

		this.options = defaults({}, ButtonOptionDefaults);

		this.back = PIXI.Sprite.from(this.options.textureUp);
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
	 */
	public setOptions(config: ButtonOptions) {
		this.options = defaults(config, ButtonOptionDefaults);
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
		this.back.texture = this.options.textureUp;
	}

	/**
	 *
	 * @param e
	 */
	protected onPointerOver(e: PIXI.InteractionEvent) {
		this.back.texture = this.options.textureUp;
	}

	/**
	 *
	 * @param e
	 */
	protected async onPointerUp(e: PIXI.InteractionEvent) {
		this.back.texture = this.options.textureUp;

		if (Tone.context.state === "running") {
			// TODO: Configuration.
			this.app.audio.play("blop", { transpose: 24, delay: 0.01 });
		}
	}

	/**
	 *
	 * @param e
	 */
	protected async onPointerDown(e: PIXI.InteractionEvent) {
		this.back.texture = this.options.textureDown;

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
		this.container.alpha = 1;
	}

	/**
	 *
	 * @param e
	 */
	protected onPointerTap(e: PIXI.InteractionEvent) {}
}
