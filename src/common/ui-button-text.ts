import defaults from "lodash-es/defaults";
import * as PIXI from "pixi.js-legacy";
import { AppBase } from "./app-base";
import { BmText, BmTextOptions } from "./bm-text";
import { UiButton, ButtonOptions } from "./ui-button";

export interface ButtonTextOptions extends BmTextOptions, ButtonOptions {
	textureOffsetDownX?: number;
	textureOffsetDownY?: number;
}

export const ButtonTextOptionDefaults: ButtonTextOptions = {
	textureUp: PIXI.Texture.WHITE,
	textureDown: PIXI.Texture.WHITE,
	textureOffsetDownX: 2,
	textureOffsetDownY: 2,
	fontSize: 32,
	fontName: "bmfont",
};

export class UiButtonText extends UiButton {
	public get text(): string {
		return this.label.text;
	}
	public set text(value: string) {
		this.label.text = value;
	}

	private options: ButtonTextOptions;
	private label: BmText;

	constructor(app: AppBase, options: ButtonTextOptions) {
		super(app, options);

		this.options = defaults(options, ButtonTextOptionDefaults);

		this.label = new BmText(this.app, this.options);
		this.label.text = this.options.text || "";
		this.label._anchor.set(0.5);

		this.addChild(this.label);

		this.on("pointerdown", () => {
			this.label.position.set(this.options.textureOffsetDownX, this.options.textureOffsetDownY);
		});
		this.on("pointerup", () => {
			this.label.position.set(0);
		});
	}
}
