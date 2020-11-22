import * as PIXI from "pixi.js-legacy";
import { AppBase } from "./app-base";
import { GameText } from "./game-text";
import { UiButton } from "./ui-button";

export interface ButtonTextOption {
	backTexture: PIXI.Texture;
	label: string;
}

export class UiButtonText extends UiButton {
	private label: GameText;

	constructor(app: AppBase, options: ButtonTextOption) {
		super(app, { texture: options.backTexture });

		this.label = new GameText(this.app, { text: options.label, fontName: "bmfont", fontSize: 36 });
		this.label._anchor.set(0.5);

		this.addChild(this.label);
	}
}
