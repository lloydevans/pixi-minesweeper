import * as PIXI from "pixi.js-legacy";
import { Component } from "./common/component";
import { MSApp } from "./ms-app";
import { Ease } from "./common/ease";

const REF_BG_WIDTH = 320;
const REF_BG_HEIGHT = 180;

type BGSet = "bg-green" | "bg-swamp" | "bg-ice";

/**
 * Tiling background graphics with simple paralax effect.
 */
export class MSBg extends Component<MSApp> {
	public offset = new PIXI.Point();
	private layers: PIXI.TilingSprite[] = [];
	private speed: number = 0.5;
	private scroll: number = 0;
	private bgSet: BGSet = "bg-swamp";
	private tileScale = 1.1;

	protected init(bgSet: BGSet = this.bgSet) {
		this.layers.push(
			this.createBgLayer(bgSet + "-a"),
			this.createBgLayer(bgSet + "-b"),
			this.createBgLayer(bgSet + "-c"),
			this.createBgLayer(bgSet + "-d")
		);

		this.addChild(...this.layers);
	}

	protected update(dt: number) {
		let length = this.layers.length;
		for (let i = 0; i < length; i++) {
			let totalWidth = this.layers[i].texture.width * this.layers[i].tileScale.x;
			let totalHeight = this.layers[i].texture.height * this.layers[i].tileScale.y;
			this.layers[i].tilePosition.x = ((this.scroll + this.offset.x) * Ease.sineIn(i / length)) % totalWidth;
			this.layers[i].tilePosition.y = (this.offset.y * Ease.sineIn(i / length)) % totalHeight;
		}
	}

	protected resize(width: number, height: number) {
		for (let i = 0; i < this.layers.length; i++) {
			const el = this.layers[i];
			el.tileScale.y = (height / REF_BG_HEIGHT) * this.tileScale;
			el.tileScale.x = el.tileScale.y;
			el.width = width;
			el.height = height;
		}
	}

	private createBgLayer(frameName: string) {
		let sprite = new PIXI.TilingSprite(this.app.getFrame("bg", frameName));
		sprite.width = this.app.width;
		sprite.height = this.app.height;
		sprite.anchor.set(0.5);
		sprite.tint = 0x888888;
		return sprite;
	}
}
