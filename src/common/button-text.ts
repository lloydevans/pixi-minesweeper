import * as PIXI from "pixi.js-legacy";
import { AppBase } from "./app-base";
import { GameText } from "./game-text";
import { Button } from "./button";

export interface ButtonTextOption {
	backTexture: PIXI.Texture;
	text: string;
}

export class ButtonText extends Button {
	private label: GameText;

	constructor(app: AppBase, options: ButtonTextOption) {
		super(app, { texture: options.backTexture });

		this.label = new GameText(this.app, options.text, {
			fontName: "bmfont",
			fontSize: 36,
		});
		this.label._anchor.set(0.5);

		this.addChild(this.label);
	}
}
