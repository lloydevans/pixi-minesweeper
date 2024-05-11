import defaults from "lodash-es/defaults";
import * as PIXI from "pixi.js";
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
		return this._label.text;
	}
	public set text(value: string) {
		this._label.text = value;
	}

	private options: ButtonTextOptions;
	private _label: BmText;

	constructor(app: AppBase, options: ButtonTextOptions) {
		super(app, options);

		this.options = defaults(options, ButtonTextOptionDefaults);

		this._label = new BmText(this.app, this.options);
		this._label.text = this.options.text || "";
		this._label.anchor.set(0.5);

		this.addChild(this._label);

		this.on("pointerdown", () => {
			this._label.position.set(this.options.textureOffsetDownX, this.options.textureOffsetDownY);
		});
		this.on("pointerup", () => {
			this._label.position.set(0);
		});
	}
}
