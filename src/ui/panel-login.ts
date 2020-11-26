import { BmText } from "../common/bm-text";
import { ColorSchemes, hexToNum } from "../common/color";
import { Component } from "../common/component";
import { UiButtonText } from "../common/ui-button-text";
import { UiTextInputDom } from "../common/ui-text-input-dom";
import { MSApp } from "../ms-app";

export class PanelLogin extends Component<MSApp> {
	private inputUsername!: UiTextInputDom;
	private inputEmail!: UiTextInputDom;
	private inputPassword!: UiTextInputDom;
	private buttonPrimary!: UiButtonText;
	private buttonSecondary!: UiButtonText;
	private buttonForgotPword!: UiButtonText;
	private buttonGuest!: UiButtonText;
	private secondaryButtons = new PIXI.Container();
	private menuState: "login" | "create" | "forgot-pword" = "login";
	private error!: BmText;

	protected init() {
		this.error = new BmText(this.app, { fontName: "bmfont", fontSize: 16 });
		this.error.maxWidth = 256;
		this.error._anchor.set(0.5);
		this.error.tint = hexToNum("#aa3333");

		this.inputUsername = new UiTextInputDom(this.app, {
			label: "Username",
			placeholder: "",
			type: "text",
		});

		this.inputEmail = new UiTextInputDom(this.app, {
			label: "Email",
			placeholder: "",
			type: "email",
		});

		this.inputPassword = new UiTextInputDom(this.app, {
			label: "Password",
			placeholder: "",
			type: "password",
		});

		this.buttonPrimary = new UiButtonText(this.app, {
			textureDown: this.app.getFrame("textures", "button-down"),
			textureUp: this.app.getFrame("textures", "button-up"),
			text: "LOGIN",
		});
		this.buttonPrimary.tint = hexToNum(ColorSchemes.beachRainbow.red);
		this.buttonPrimary.accessible = true;

		this.buttonSecondary = new UiButtonText(this.app, {
			textureUp: PIXI.Texture.EMPTY,
			textureDown: PIXI.Texture.EMPTY,
			text: "Create account",
			fontSize: 24,
		});
		this.buttonSecondary.accessible = true;
		this.buttonSecondary.hitArea = new PIXI.Rectangle(-128, -24, 256, 48);

		this.buttonGuest = new UiButtonText(this.app, {
			textureUp: PIXI.Texture.EMPTY,
			textureDown: PIXI.Texture.EMPTY,
			text: "Play as guest",
			fontSize: 24,
		});
		this.buttonGuest.accessible = true;
		this.buttonGuest.hitArea = new PIXI.Rectangle(-128, -24, 256, 48);

		this.buttonForgotPword = new UiButtonText(this.app, {
			textureUp: PIXI.Texture.EMPTY,
			textureDown: PIXI.Texture.EMPTY,
			text: "Forgot password?",
			fontSize: 24,
		});
		this.buttonForgotPword.accessible = true;

		this.buttonSecondary.y = 0;
		this.buttonGuest.y = 40;
		this.buttonForgotPword.y = 80;
		this.secondaryButtons.addChild(this.buttonSecondary);
		this.secondaryButtons.addChild(this.buttonGuest);
		this.secondaryButtons.addChild(this.buttonForgotPword);

		this.error.y = 60;
		this.inputUsername.y = -100;
		this.inputEmail.y = -50;
		this.inputPassword.y = 0;
		this.buttonPrimary.y = 128;
		this.secondaryButtons.y = 180;
		// this.addChild(this.inputUsername);
		this.addChild(this.inputEmail);
		this.addChild(this.inputPassword);
		this.addChild(this.buttonPrimary);
		this.addChild(this.secondaryButtons);
		this.addChild(this.error);

		this.buttonPrimary.on("pointertap", this.buttonPrimaryCb, this);
		this.buttonSecondary.on("pointertap", this.buttonSecondaryCb, this);
		this.buttonGuest.on("pointertap", this.buttonGuestCb, this);
		this.buttonForgotPword.on("pointertap", () => {});

		this.inputEmail.on("input", this.inputCB, this);
		this.inputUsername.on("input", this.inputCB, this);
		this.inputPassword.on("input", this.inputCB, this);
		this.inputCB();

		this.showLogin();
	}

	private async buttonPrimaryCb() {
		this.app.setAllUiElementsActive(false);

		let email = this.inputEmail.value;
		let password = this.inputPassword.value;
		let username = this.inputUsername.value;

		switch (this.menuState) {
			case "create":
				this.emit("create", email, password, username);
				break;

			case "login":
				this.emit("login", email, password);
				break;
		}
	}

	private async buttonSecondaryCb() {
		if (this.menuState === "login") {
			this.showCreateAccount();
		} else {
			this.showLogin();
		}
	}

	private async buttonGuestCb() {
		this.emit("guest");
	}

	private inputCB() {
		switch (this.menuState) {
			case "create":
				// this.buttonPrimary.active = !!(this.inputUsername.value && this.inputEmail.value && this.inputPassword.value);
				break;

			case "login":
				// this.buttonPrimary.active = !!(this.inputEmail.value && this.inputPassword.value);
				break;
		}
	}

	public showError(message: string) {
		this.error.text = message;
	}

	public clearError() {
		this.error.text = "";
	}

	private showLogin() {
		this.menuState = "login";
		this.inputEmail.visible = true;
		this.inputPassword.visible = true;
		this.inputUsername.visible = false;
		this.buttonPrimary.text = "LOGIN";
		this.buttonSecondary.text = "Create account";
	}

	private showCreateAccount() {
		this.menuState = "create";
		this.inputEmail.visible = true;
		this.inputPassword.visible = true;
		this.inputUsername.visible = true;
		this.buttonPrimary.text = "CREATE";
		this.buttonSecondary.text = "Login";
	}

	private showForgotPword() {
		this.inputEmail.visible = true;
		this.inputPassword.visible = false;
		this.inputUsername.visible = false;
	}
}
