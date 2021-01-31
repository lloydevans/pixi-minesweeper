import defaults from "lodash-es/defaults";
import * as PIXI from "pixi.js-legacy";
import { BmText } from "../internal/bm-text";
import { ButtonOptions, UiButton } from "./ui-button";

export interface ButtonTextOptions extends ButtonOptions {
	fontName?: string;
	text?: string;
	fontSize?: number;
	tint?: number;
	maxWidth?: number;
	textureOffsetDownX?: number;
	textureOffsetDownY?: number;
}

export const ButtonTextOptionDefaults: ButtonTextOptions = {
	textureUp: PIXI.Texture.WHITE,
	textureDown: PIXI.Texture.WHITE,
	textureOffsetDownX: 2,
	textureOffsetDownY: 2,
	fontSize: 32,
	tint: 0,
	fontName: "bmfont",
};

export class UiButtonText extends UiButton {
	public get text(): string {
		return this.label.text;
	}
	public set text(value: string) {
		this.label.text = value;
	}

	public options!: ButtonTextOptions;

	private label!: BmText;

	/**
	 *
	 * @param options
	 */
	public init() {
		this.options = defaults({}, ButtonTextOptionDefaults);

		this.label = new BmText(this.entity.app, this.options);
		this.label.text = this.options.text || "";
		this.label._anchor.set(0.5);

		this.entity.addChild(this.label);

		this.on("pointerdown", () => {
			this.label.position.set(this.options.textureOffsetDownX, this.options.textureOffsetDownY);
		});
		this.on("pointerup", () => {
			this.label.position.set(0);
		});
	}

	/**
	 *
	 */
	public setOptions(config: ButtonTextOptions) {
		this.options = defaults(config, ButtonTextOptionDefaults);
	}
}
