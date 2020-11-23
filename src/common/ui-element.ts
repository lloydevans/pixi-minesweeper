import { AppBase } from "./app-base";
import { Component } from "./component";

/**
 */
export class UiElement<T extends AppBase = AppBase> extends Component<T> {
	public focused = false;

	constructor(app: T) {
		super(app);

		this.on("pointertap", () => {
			this.focus();
		});

		this.once("init", () => {
			this.app.registerUiElement(this);
		});

		this.once("destroy", () => {
			this.app.unregisterUiElement(this);
		});
	}

	public focus() {
		this.app.blurAllUiElements();
		this.focused = true;
		this.emit("focus");
	}

	public blur() {
		this.focused = false;
		this.emit("blur");
	}
}
