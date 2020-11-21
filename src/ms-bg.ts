import * as PIXI from "pixi.js-legacy";
import { Component } from "./common/component";
import { MSApp } from "./ms-app";
import { Ease } from "./common/ease";

const REF_BG_WIDTH = 320;
const REF_BG_HEIGHT = 180;

type BGSet = "bg-green" | "bg-swamp";

/**
 * Tiling background graphics with simple paralax effect.
 */
export class MSBg extends Component<MSApp> {
	public offset = new PIXI.Point();
	private layers: PIXI.TilingSprite[] = [];
	private speed: number = 0.25;
	private scroll: number = 0;
	private bgSet: BGSet = "bg-swamp";
	private tileScale = 1.15;

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
		const length = this.layers.length;
		this.scroll += dt * this.speed;
		for (let i = 0; i < length; i++) {
			const totalWidth = this.layers[i].texture.width * this.layers[i].tileScale.x;
			const totalHeight = this.layers[i].texture.height * this.layers[i].tileScale.y;
			this.layers[i].tilePosition.x = ((this.scroll + this.offset.x) * Ease.sineIn(i / length)) % totalWidth;
			this.layers[i].tilePosition.y = (this.offset.y * Ease.sineIn(i / length)) % totalHeight;
		}
	}

	protected resize(width: number, height: number) {
		for (let i = 0; i < this.layers.length; i++) {
			const el = this.layers[i];
			el.tileScale.set((height / REF_BG_HEIGHT) * this.tileScale);
			el.width = width;
			el.height = height;
		}
	}

	private createBgLayer(frameName: string) {
		const sprite = new PIXI.TilingSprite(this.app.getFrame("bg", frameName));
		sprite.width = this.app.width;
		sprite.height = this.app.height;
		sprite.anchor.set(0.5);
		sprite.tint = 0x888888;
		return sprite;
	}
}
