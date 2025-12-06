import * as PIXI from "pixi.js";
import { AppBase } from "./app-base";

export interface BmTextOptions {
	fontName?: string;
	text?: string;
	fontSize?: number;
	align?: string;
	tint?: number;
	letterSpacing?: number;
	maxWidth?: number;
}

export const BmTextOptionDefaults: BmTextOptions = {
	text: "",
	tint: 0,
	fontSize: 32,
	fontName: "bmfont",
	align: undefined,
	letterSpacing: undefined,
	maxWidth: undefined,
};

export const DEFAULT_TEXT_STYLE: Partial<PIXI.TextStyle> = {
	align: "left",
	fill: 0xffffff,
	fontFamily: "Arial",
	fontSize: 24,
};

export class BmText extends PIXI.BitmapText {
	private app: AppBase;

	constructor(app: AppBase, options: Partial<{ text: string; style: PIXI.TextStyleOptions }> = {}) {
		super({
			text: options.text || "",
			style: options.style,
		});

		this.app = app;
	}
}
