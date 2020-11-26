import * as PIXI from "pixi.js-legacy";
import { ColorSchemes, hexToNum, hexToRgba, numToRgba, RgbaObject, rgbToNum } from "./common/color";
import { Component } from "./common/component";
import { Ease } from "./common/ease";
import { Tween } from "./common/tween";
import { MSApp } from "./ms-app";

/**
 */
export class MSBgFlat extends Component<MSApp> {
	public offset = new PIXI.Point();
	private speed: number = 0.1;
	private scroll: number = 0;
	private sprite!: PIXI.TilingSprite;
	private rgba: RgbaObject = { r: 0, g: 0, b: 0, a: 1 };

	protected init() {
		this.sprite = this.createSprite("tiles", "bg-tile");
		this.sprite.tint = hexToNum(Object.values(ColorSchemes.beachRainbowDark)[1]);
		this.sprite.tileScale.set(0.5);
		this.addChild(this.sprite);
	}

	protected update(dt: number) {
		this.scroll += dt * this.speed;
		const totalWidth = this.sprite.texture.width * this.sprite.tileScale.x;
		const totalHeight = this.sprite.texture.height * this.sprite.tileScale.y;
		this.sprite.tilePosition.x = (this.scroll + this.offset.x) % totalWidth;
		this.sprite.tilePosition.y = (this.scroll + this.offset.y) % totalHeight;
	}

	protected resize(width: number, height: number) {
		this.sprite.width = width;
		this.sprite.height = height;
	}

	public animateColor(hex: string, ms = 333, ease = Ease.sineInOut) {
		Tween.removeTweens(this.rgba);

		Object.assign(this.rgba, numToRgba(this.sprite.tint));

		const tween = this.tween(this.rgba).to(hexToRgba(hex), ms, ease);

		tween.on("change", () => (this.sprite.tint = rgbToNum(this.rgba)));
	}

	private createSprite(atlasName: string, frameName: string) {
		const sprite = new PIXI.TilingSprite(this.app.getFrame(atlasName, frameName));
		sprite.width = this.app.width;
		sprite.height = this.app.height;
		sprite.anchor.set(0.5);
		sprite.tint = 0x888888;
		return sprite;
	}
}
