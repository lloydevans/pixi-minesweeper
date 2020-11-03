import { Application, Text } from "pixi.js-legacy";

export class GameText extends Text {
	private app: Application;

	constructor(app: Application, text: string, style?: any | PIXI.TextStyle) {
		super(text, style);
		this.app = app;
		this.resolution = app.renderer.resolution;
	}
}
