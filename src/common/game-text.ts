import * as PIXI from "pixi.js-legacy";
import { AppBase } from "./app-base";

export class GameText extends PIXI.BitmapText {
	private app: AppBase;

	// Anchor is number | Point?
	public readonly _anchor = new PIXI.ObservablePoint(function (this: GameText) {
		(this.anchor as PIXI.Point).x = this._anchor.x;
		(this.anchor as PIXI.Point).y = this._anchor.y;
	}, this);

	constructor(
		app: AppBase,
		text: string,
		// Style type only exists inline for Bitmap text
		// so this is a copy/paste.
		style: {
			fontName: string;
			fontSize?: number;
			align?: string;
			tint?: number;
			letterSpacing?: number;
			maxWidth?: number;
		}
	) {
		super(text, style);

		this.app = app;

		// TODO: figure out doing this through loader bitmap resource
		this.scale.set(this.app.dpr);
	}
}
