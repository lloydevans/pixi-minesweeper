import * as PIXI from "pixi.js-legacy";
import { BmText } from "./common/bm-text";
import { Component } from "./common/component";
import { auth, setPersistence } from "./firebase";
import { MSApp } from "./ms-app";
import { PanelLogin } from "./ui/panel-login";

/**
 *
 */
export class SceneMenu extends Component<MSApp> {
	title!: BmText;
	background!: PIXI.TilingSprite;
	panelLogin?: PanelLogin;

	async init() {
		this.title = new BmText(this.app, { text: "Minesweeper", fontName: "bmfont", fontSize: 72 });
		this.title.y = -190;
		this.title._anchor.set(0.5);

		const bgTexture = this.app.getFrame("tiles", "bg-tile");
		this.background = new PIXI.TilingSprite(bgTexture);
		this.background.tint = 0x66acd1;

		this.addChild(this.background);
		this.addChild(this.title);

		await setPersistence();

		let user = auth.currentUser;

		if (!user) {
			console.log("No user");
			this.panelLogin = new PanelLogin(this.app);
			this.addChild(this.panelLogin);
		} //
		else {
			console.log("User logged in", user);
      auth.signOut();
		}

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
