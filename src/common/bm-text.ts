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

	/**
	 * Anchor is number | Point?
	 * This is a slightly awkward hangover from the JS feature of setting
	 * this value as either a number or a point object for 'convenience'.
	 * Here I'm using this temporary value, and should probably try and get
	 * this changed in Pixi by making a PR. I doubt anyone is particularly attached
	 * to being able to set this as a number.
	 */
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
