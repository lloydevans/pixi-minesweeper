import defaults from "lodash-es/defaults";
import * as PIXI from "pixi.js-legacy";
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

export class BmText extends PIXI.BitmapText {
	private app: AppBase;

	protected options: BmTextOptions;

	// Anchor is number | Point?
	public readonly _anchor = new PIXI.ObservablePoint(function (this: BmText) {
		(this.anchor as PIXI.Point).x = this._anchor.x;
		(this.anchor as PIXI.Point).y = this._anchor.y;
	}, this);

	constructor(app: AppBase, options: BmTextOptions = {}) {
		super(options.text || "", options as any);

		this.app = app;

		this.options = defaults(options, BmTextOptionDefaults);

		// TODO: figure out doing this through loader bitmap resource
		this.scale.set(this.app.dpr);
	}
}
