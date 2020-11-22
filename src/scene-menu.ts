import * as PIXI from "pixi.js-legacy";
import { Component } from "./common/component";
import { MSApp } from "./ms-app";
import { PanelLogin } from "./ui/panel-login";

/**
 *
 */
export class SceneMenu extends Component<MSApp> {
	background!: PIXI.TilingSprite;
	panelLogin!: PanelLogin;

	init() {
		const bgTexture = this.app.getFrame("tiles", "bg-tile");
		this.background = new PIXI.TilingSprite(bgTexture);
		this.background.tint = 0x66acd1;

		this.panelLogin = new PanelLogin(this.app);

		this.addChild(this.background);
		this.addChild(this.panelLogin);
	}

	update(dt: number) {
		this.background.tilePosition.x += dt / 8;
		this.background.tilePosition.y += dt / 8;
		this.background.tileScale.set(0.5);
	}

	resize(width: number, height: number) {
		this.background.x = -width / 2;
		this.background.y = -height / 2;
		this.background.width = width;
		this.background.height = height;
	}
}
