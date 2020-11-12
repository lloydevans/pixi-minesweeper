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
	private layers: PIXI.TilingSprite[] = [];
	private speed: number = 0.5;
	private scroll: number = 0;
	private bgSet: BGSet = "bg-swamp";

	public init(bgSet: BGSet = this.bgSet) {
		this.layers.push(
			this.createBgLayer(bgSet + "-a"),
			this.createBgLayer(bgSet + "-b"),
			this.createBgLayer(bgSet + "-c"),
			this.createBgLayer(bgSet + "-d")
		);

		this.addChild(...this.layers);

		this.app.events.on("resize", this.onResize, this);
		this.app.events.on("update", this.onUpdate, this);

		this.onResize(this.app.width, this.app.height);
	}

	private onUpdate(dt: number) {
		this.scroll += this.speed * dt;
		for (let i = 0, l = this.layers.length; i < l; i++) {
			this.layers[i].tilePosition.x = this.scroll * Ease.sineIn(i / l);
		}
	}

	private onResize(width: number, height: number) {
		for (let i = 0; i < this.layers.length; i++) {
			const el = this.layers[i];
			el.tileScale.y = (height / REF_BG_HEIGHT) * 1.2;
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
		sprite.tint = 0x555555;
		return sprite;
	}
}
