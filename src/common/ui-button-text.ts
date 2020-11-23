import defaults from "lodash-es/defaults";
import * as PIXI from "pixi.js-legacy";
import { AppBase } from "./app-base";
import { BmText, BmTextOptions } from "./bm-text";
import { UiButton } from "./ui-button";

export interface ButtonTextOptions extends BmTextOptions {
	backTexture?: PIXI.Texture;
}

export const ButtonTextOptionDefaults: ButtonTextOptions = {
	backTexture: PIXI.Texture.EMPTY,
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
		super(app, { texture: options.backTexture || PIXI.Texture.EMPTY });

		this.options = defaults(options, ButtonTextOptionDefaults);

		this.label = new BmText(this.app, this.options);
		this.label.text = this.options.text || "";
		this.label._anchor.set(0.5);

		this.addChild(this.label);
	}
}
