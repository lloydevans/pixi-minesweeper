import { Component } from "../common/component";
import { GameText } from "../common/game-text";
import { MSApp } from "../ms-app";
import { UiButton } from "../common/ui-button";
import { UiButtonText } from "../common/ui-button-text";
import { UiTextInputDom } from "../common/ui-text-input-dom";
// import { createAccount } from "../firebase";

export class PanelLogin extends Component<MSApp> {
	title!: GameText;
	inputUsername!: UiTextInputDom;
	inputPassword!: UiTextInputDom;
	submitButtom!: UiButton;
	error!: GameText;

	init() {
		this.title = new GameText(this.app, { text: "MINESWEEPER", fontName: "bmfont", fontSize: 72 });
		this.title.y = -190;
		this.title._anchor.set(0.5);

		this.error = new GameText(this.app, { fontName: "bmfont", fontSize: 16 });
		this.error.maxWidth = 256;
		this.error._anchor.set(0.5);
		this.error.tint = 0xff0000;
		this.error.y = 32;

		this.inputUsername = new UiTextInputDom(this.app, {
			label: "Email",
			placeholder: "",
			type: "email",
		});
		this.inputUsername.y = -96;

		this.inputPassword = new UiTextInputDom(this.app, {
			label: "Password",
			placeholder: "",
			type: "password",
		});
		this.inputPassword.y = -32;

		this.submitButtom = new UiButtonText(this.app, {
			backTexture: this.app.getFrame("textures", "button-long"),
			label: "LOGIN",
		});
		this.submitButtom.scale.set(0.75);
		this.submitButtom.y = 128;
		this.submitButtom.accessible = true;

		this.submitButtom.on("pointertap", async () => {
			this.submitButtom.interactive = false;
			try {
				// await createAccount(this.inputUsername.value, this.inputPassword.value);
			} catch (error) {
				this.error.text = error.message;
				this.submitButtom.interactive = true;
			}
		});

		this.addChild(this.title);
		this.addChild(this.inputUsername);
		this.addChild(this.inputPassword);
		this.addChild(this.submitButtom);
		this.addChild(this.error);
	}
}
