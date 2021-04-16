import { BmText } from "../../common/core/internal/bm-text";
import { Scene } from "../../common/core/scene/scene";
import { auth, functions } from "../../firebase";
import { MSGameConfig } from "../ms-config";
import { showGame } from "../ms-entry";
import { PanelGameOptions } from "../ui/panel-game-options";
import { PanelLogin } from "../ui/panel-login";

/**
 *
 */
export class SceneMenu extends Scene {
	private title!: BmText;
	private panelLogin?: PanelLogin;
	private panelGameOptions?: PanelGameOptions;

	public init() {
		this.title = new BmText(this.app, {
			text: "Minesweeper",
			fontName: "bmfont",
			fontSize: 72,
		});
		this.title.y = -190;
		this.title._anchor.set(0.5);

		this.entity.addChild(this.title);

		if (!auth.currentUser) {
			this.showLogin();
		} //
		else {
			this.showGameOptions();
		}
	}

	private showLogin() {
		this.panelGameOptions && this.panelGameOptions.destroy();

		this.panelLogin = this.entity.add(PanelLogin);
		this.entity.addChild(this.panelLogin.entity);

		console.log(this.panelLogin);

		this.panelLogin.on("create", async (email: string, password: string, username: string) => {
			this.app.setAllUiElementsActive(false);

			this.panelLogin?.clearError();

			try {
				await auth.createUserWithEmailAndPassword(email, password);
				// await result!.user!.updateProfile({ displayName: username });
				this.showGameOptions();
			} catch (err) {
				this.panelLogin?.showError(err.message);
			}

			this.app.setAllUiElementsActive(true);
		});

		this.panelLogin.on("login", async (email: string, password: string) => {
			this.app.setAllUiElementsActive(false);

			this.panelLogin?.clearError();

			try {
				await auth.signInWithEmailAndPassword(email, password);
				this.showGameOptions();
			} catch (err) {
				this.panelLogin?.showError(err.message);
			}

			this.app.setAllUiElementsActive(true);
		});

		this.panelLogin.on("guest", async () => {
			this.app.setAllUiElementsActive(false);

			this.panelLogin?.clearError();

			try {
				await auth.signInAnonymously();
				this.showGameOptions();
			} catch (err) {
				this.panelLogin?.showError(err.message);
			}

			this.app.setAllUiElementsActive(true);
		});
	}

	private showGameOptions() {
		this.panelLogin && this.panelLogin.destroy();

		this.panelGameOptions = new PanelGameOptions(this.app);
		this.entity.addChild(this.panelGameOptions);

		this.panelGameOptions.on("start", async (config: MSGameConfig) => {
			this.app.setAllUiElementsActive(false);

			try {
				const gameId = (await functions.httpsCallable("newGame")(config))?.data;
				showGame(gameId);
			} catch (err) {
				console.log(err);
				this.app.setAllUiElementsActive(true);
			}
		});

		this.panelGameOptions.on("logout", async () => {
			this.app.setAllUiElementsActive(false);

			try {
				await auth.signOut();
			} catch (err) {
				console.log(err);
				this.app.setAllUiElementsActive(true);
			}

			if (!auth.currentUser) {
				this.showLogin();
			}
		});
	}
}
