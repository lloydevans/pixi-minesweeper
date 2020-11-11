import * as PIXI from "pixi.js-legacy";

export class GameText extends PIXI.Text {
	private app: PIXI.Application;

	constructor(app: PIXI.Application, text: string, style?: PIXI.TextStyle) {
		super(text, style);
		this.app = app;
		this.resolution = app.renderer.resolution;
	}
}
