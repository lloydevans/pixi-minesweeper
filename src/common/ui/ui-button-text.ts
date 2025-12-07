import defaults from "lodash-es/defaults";
import * as PIXI from "pixi.js";
import { AppBase } from "../app-base";
import { BmText } from "../bm-text";
import { UiButton, ButtonOptions } from "./ui-button";

export interface ButtonTextOptions extends Partial<PIXI.TextStyle>, ButtonOptions {
	text: string;
}

export const ButtonTextOptionDefaults: ButtonTextOptions = {
	textureUp: PIXI.Texture.WHITE,
	textureDown: PIXI.Texture.WHITE,
	fontSize: 32,
	fontFamily: "bmfont",
	text: "",
};

export class UiButtonText extends UiButton {
	public get text(): string {
		return this.labelText.text;
	}
	public set text(value: string) {
		this.labelText.text = value;
	}

	private options: ButtonTextOptions;
	private labelText: BmText;

	constructor(app: AppBase, options: ButtonTextOptions) {
		super(app, options);

		this.options = defaults(options, ButtonTextOptionDefaults);

		this.labelText = new BmText(this.app, {
			text: this.options.text,
			style: {
				fontSize: this.options.fontSize,
				fontFamily: this.options.fontFamily,
			},
		});
		this.labelText.text = this.options.text || "";
		this.labelText.anchor.set(0.5);
		this.labelText.y = -10;

		this.addChild(this.labelText);

		this.on("pointerdown", () => this.labelText.scale.set(0.9));
		this.on("pointerup", () => this.labelText.scale.set(1));
	}
}
