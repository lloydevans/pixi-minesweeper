import { Component } from "../common/component";
import { BmText } from "../common/bm-text";
import { MSApp } from "../ms-app";
import { UiButtonText } from "../common/ui-button-text";
import { UiTextInputDom } from "../common/ui-text-input-dom";
import { auth } from "../firebase";

export class PanelLogin extends Component<MSApp> {
	inputUsername!: UiTextInputDom;
	inputEmail!: UiTextInputDom;
	inputPassword!: UiTextInputDom;
	buttonPrimary!: UiButtonText;
	buttonSecondary!: UiButtonText;
	buttonForgotPword!: UiButtonText;
	buttonPlayAsGuest!: UiButtonText;
	secondaryButtons = new PIXI.Container();
	menuState: "login" | "create" | "forgot-pword" = "login";
	error!: BmText;

	init() {
		this.error = new BmText(this.app, { fontName: "bmfont", fontSize: 16 });
		this.error.maxWidth = 256;
		this.error._anchor.set(0.5);
		this.error.tint = 0xff0000;

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
			backTexture: this.app.getFrame("textures", "button-long"),
			text: "LOGIN",
		});
		this.buttonPrimary.scale.set(0.75);
		this.buttonPrimary.accessible = true;

		this.buttonSecondary = new UiButtonText(this.app, {
			backTexture: PIXI.Texture.EMPTY,
			text: "Create account",
			fontSize: 24,
		});
		this.buttonSecondary.scale.set(0.75);
		this.buttonSecondary.accessible = true;
		this.buttonSecondary.hitArea = new PIXI.Rectangle(-128, -24, 256, 48);

		this.buttonPlayAsGuest = new UiButtonText(this.app, {
			backTexture: PIXI.Texture.EMPTY,
			text: "Play as guest",
			fontSize: 24,
		});
		this.buttonPlayAsGuest.scale.set(0.75);
		this.buttonPlayAsGuest.accessible = true;
		this.buttonPlayAsGuest.hitArea = new PIXI.Rectangle(-128, -24, 256, 48);

		this.buttonForgotPword = new UiButtonText(this.app, {
			backTexture: PIXI.Texture.EMPTY,
			text: "Forgot password?",
			fontSize: 24,
		});
		this.buttonForgotPword.scale.set(0.75);
		this.buttonForgotPword.accessible = true;

		this.error.y = 60;
		this.inputUsername.y = -100;
		this.inputEmail.y = -50;
		this.inputPassword.y = 0;
		this.buttonPrimary.y = 128;
		this.secondaryButtons.y = 180;
		this.buttonSecondary.y = 0;
		this.buttonPlayAsGuest.y = 40;
		this.buttonForgotPword.y = 80;

		this.secondaryButtons.addChild(this.buttonSecondary);
		this.secondaryButtons.addChild(this.buttonPlayAsGuest);
		this.secondaryButtons.addChild(this.buttonForgotPword);
		this.addChild(this.inputUsername);
		this.addChild(this.inputEmail);
		this.addChild(this.inputPassword);
		this.addChild(this.buttonPrimary);
		this.addChild(this.secondaryButtons);
		this.addChild(this.error);

		this.buttonPrimary.on("pointertap", async () => {
			this.interactiveChildren = false;

			let email = this.inputEmail.value;
			let username = this.inputUsername.value;
			let password = this.inputPassword.value;

			if (this.menuState === "create") {
				try {
					const result = await auth.createUserWithEmailAndPassword(email, password);
					await result?.user?.updateProfile({ displayName: username });
					// await auth.sendSignInLinkToEmail(email, {
					// 	url: "http://localhost:8080",
					// 	handleCodeInApp: true,
					// });
				} catch (error) {
					this.error.text = error.message;
				}
			} else {
				try {
					await auth.signInWithEmailAndPassword(this.inputEmail.value, this.inputPassword.value);
				} catch (error) {
					this.error.text = error.message;
				}
			}

			this.interactiveChildren = true;
		});

		this.buttonForgotPword.on("pointertap", () => {
			// this.showForgotPword();
			auth.signOut();
		});

		this.buttonSecondary.on("pointertap", () => {
			if (this.menuState === "login") {
				this.showCreateAccount();
			} else {
				this.showLogin();
			}
		});

		this.buttonPlayAsGuest.on("pointertap", () => {
			auth.signInAnonymously();
		});

		this.showLogin();
	}

	update(dt: number) {
		switch (this.menuState) {
			case "create":
				this.buttonPrimary.active = !!(this.inputUsername.value && this.inputEmail.value && this.inputPassword.value);
				break;

			case "login":
				this.buttonPrimary.active = !!(this.inputEmail.value && this.inputPassword.value);
				break;
		}
	}

	showLogin() {
		this.menuState = "login";
		this.inputEmail.visible = true;
		this.inputPassword.visible = true;
		this.inputUsername.visible = false;
		this.buttonPrimary.text = "LOGIN";
		this.buttonSecondary.text = "Create account";
	}

	showCreateAccount() {
		this.menuState = "create";
		this.inputEmail.visible = true;
		this.inputPassword.visible = true;
		this.inputUsername.visible = true;
		this.buttonPrimary.text = "CREATE";
		this.buttonSecondary.text = "Login";
	}

	showForgotPword() {
		this.inputEmail.visible = true;
		this.inputPassword.visible = false;
		this.inputUsername.visible = false;
	}
}
