import { ColorSchemes, hexToNum } from "../../common/color";
import { ButtonText } from "../../common/core/components/ui/button-text";
import { TextInputDom } from "../../common/core/components/ui/text-input-dom";
import { Entity } from "../../common/core/entity/entity";
import { BmText } from "../../common/core/internal/bm-text";

export class PanelLogin extends Entity {
	private inputUsername!: TextInputDom;
	private inputEmail!: TextInputDom;
	private inputPassword!: TextInputDom;
	private buttonPrimary!: ButtonText;
	private btnSecondary!: ButtonText;
	private btnForgotPassword!: ButtonText;
	private btnGuest!: ButtonText;
	private secondaryButtons = new PIXI.Container();
	private menuState: "login" | "create" | "forgot-pword" = "login";
	private error!: BmText;

	protected init() {
		this.error = new BmText(this.app, { fontName: "bmfont", fontSize: 16 });
		this.error.maxWidth = 256;
		this.error._anchor.set(0.5);
		this.error.tint = hexToNum("#aa3333");

		this.inputUsername = new Entity(this.app).add(TextInputDom);
		this.inputUsername.setOptions({
			label: "Username",
			placeholder: "",
			type: "text",
		});

		this.inputEmail = new Entity(this.app).add(TextInputDom);
		this.inputEmail.setOptions({
			label: "Email",
			placeholder: "",
			type: "email",
		});

		this.inputPassword = new Entity(this.app).add(TextInputDom);
		this.inputPassword.setOptions({
			label: "Password",
			placeholder: "",
			type: "password",
		});

		this.buttonPrimary = new Entity(this.app).add(ButtonText);
		this.buttonPrimary.setOptions({
			textureDown: this.app.getFrame("textures", "button-down"),
			textureUp: this.app.getFrame("textures", "button-up"),
			tint: hexToNum(ColorSchemes.beachRainbow.red),
			text: "LOGIN",
		});

		this.btnSecondary = new Entity(this.app).add(ButtonText);
		this.btnSecondary.setOptions({
			textureUp: PIXI.Texture.EMPTY,
			textureDown: PIXI.Texture.EMPTY,
			text: "Create account",
			fontSize: 24,
		});

		this.btnGuest = new Entity(this.app).add(ButtonText);
		this.btnGuest.setOptions({
			textureUp: PIXI.Texture.EMPTY,
			textureDown: PIXI.Texture.EMPTY,
			text: "Play as guest",
			fontSize: 24,
		});

		this.btnForgotPassword = new Entity(this.app).add(ButtonText);
		this.btnForgotPassword.setOptions({
			textureUp: PIXI.Texture.EMPTY,
			textureDown: PIXI.Texture.EMPTY,
			text: "Forgot password?",
			fontSize: 24,
		});

		this.buttonPrimary.entity.accessible = true;
		this.btnSecondary.entity.accessible = true;
		this.btnSecondary.entity.hitArea = new PIXI.Rectangle(-128, -24, 256, 48);
		this.btnGuest.entity.accessible = true;
		this.btnGuest.entity.hitArea = new PIXI.Rectangle(-128, -24, 256, 48);
		this.btnForgotPassword.entity.accessible = true;

		this.btnSecondary.entity.y = 0;
		this.btnGuest.entity.y = 40;
		this.btnForgotPassword.entity.y = 80;

		this.inputUsername.entity.y = -100;
		this.inputEmail.entity.y = -50;
		this.inputPassword.entity.y = 0;
		this.buttonPrimary.entity.y = 128;
		this.secondaryButtons.y = 180;
		this.error.y = 60;

		// this.addChild(this.inputUsername);
		this.secondaryButtons.addChild(this.btnSecondary.entity);
		this.secondaryButtons.addChild(this.btnGuest.entity);
		this.secondaryButtons.addChild(this.btnForgotPassword.entity);
		this.addChild(this.inputEmail.entity);
		this.addChild(this.inputPassword.entity);
		this.addChild(this.buttonPrimary.entity);
		this.addChild(this.secondaryButtons);
		this.addChild(this.error);

		this.buttonPrimary.on("pointertap", this.buttonPrimaryCb, this);
		this.btnSecondary.on("pointertap", this.buttonSecondaryCb, this);
		this.btnGuest.on("pointertap", this.buttonGuestCb, this);
		this.btnForgotPassword.on("pointertap", () => {});

		this.inputEmail.on("input", this.inputCB, this);
		this.inputUsername.on("input", this.inputCB, this);
		this.inputPassword.on("input", this.inputCB, this);
		this.inputCB();

		this.showLogin();
	}

	private async buttonPrimaryCb() {
		this.app.setAllUiElementsActive(false);

		const email = this.inputEmail.value;
		const password = this.inputPassword.value;
		const username = this.inputUsername.value;

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
		this.inputEmail.entity.visible = true;
		this.inputPassword.entity.visible = true;
		this.inputUsername.entity.visible = false;
		this.buttonPrimary.text = "LOGIN";
		this.btnSecondary.text = "Create account";
	}

	private showCreateAccount() {
		this.menuState = "create";
		this.inputEmail.entity.visible = true;
		this.inputPassword.entity.visible = true;
		this.inputUsername.entity.visible = true;
		this.buttonPrimary.text = "CREATE";
		this.btnSecondary.text = "Login";
	}

	private showForgotPword() {
		this.inputEmail.entity.visible = true;
		this.inputPassword.entity.visible = false;
		this.inputUsername.entity.visible = false;
	}
}
