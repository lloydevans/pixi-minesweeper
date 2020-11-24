import * as PIXI from "pixi.js-legacy";
import { BmText } from "./common/bm-text";
import { ColorSchemes, hexToNum } from "./common/color";
import { Component } from "./common/component";
import { auth, setPersistence } from "./firebase";
import { MSApp } from "./ms-app";
import { PanelGameOptions } from "./ui/panel-game-options";
import { PanelLogin } from "./ui/panel-login";

/**
 *
 */
export class SceneMenu extends Component<MSApp> {
	title!: BmText;
	background!: PIXI.TilingSprite;
	panelLogin?: PanelLogin;
	panelGameOptions?: PanelGameOptions;

	async init() {
		this.title = new BmText(this.app, {
			text: "Minesweeper",
			fontName: "bmfont",
			fontSize: 72,
		});
		this.title.y = -190;
		this.title._anchor.set(0.5);

		const bgTexture = this.app.getFrame("tiles", "bg-tile");
		this.background = new PIXI.TilingSprite(bgTexture);
		this.background.tint = hexToNum(Object.values(ColorSchemes.beachRainbowDark)[1]);

		this.addChild(this.background);
		this.addChild(this.title);

		await setPersistence();

		let user = auth.currentUser;

		if (!user) {
			this.showLogin();
		} //
		else {
			this.showGameOptions();
		}
	}

	showLogin() {
		this.panelGameOptions && this.panelGameOptions.destroy();
		this.panelLogin = new PanelLogin(this.app);
		this.addChild(this.panelLogin);

		this.panelLogin.off("login");
		this.panelLogin.once("login", () => {
			this.panelGameOptions = new PanelGameOptions(this.app);
			this.addChild(this.panelGameOptions);
		});
	}

	showGameOptions() {
		this.panelLogin && this.panelLogin.destroy();
		this.panelGameOptions = new PanelGameOptions(this.app);
		this.addChild(this.panelGameOptions);
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
