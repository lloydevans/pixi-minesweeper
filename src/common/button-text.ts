import { Texture, TextStyle } from "pixi.js-legacy";
import { AppBase } from "./app-base";
import { GameText } from "./game-text";
import { Button } from "./button";

export interface ButtonTextOption {
	backTexture: Texture;
	textStyle: TextStyle;
	text: string;
}

export class ButtonText extends Button {
	private label: GameText;

	constructor(app: AppBase, options: ButtonTextOption) {
		super(app, options.backTexture);

		this.label = new GameText(this.app, options.text, options.textStyle);
		this.label.anchor.set(0.5);

		this.addChild(this.label);
	}
}
