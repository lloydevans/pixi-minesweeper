import { AppBase } from "./app-base";
import { Component } from "./component";

/**
 */
export class UiElement<T extends AppBase = AppBase> extends Component<T> {
	public get focused() {
		return this._focused;
	}
	public set focused(value: boolean) {
		if (value !== this._focused) {
			this._focused = value;
			if (this._focused) {
				this.app.blurAllUiElements();
			}
			this.emit("focus", this._focused);
		}
	}

	public get active() {
		return this._active;
	}
	public set active(value: boolean) {
		if (value !== this._active) {
			this._active = value;
			if (this._active) {
				this.alpha = 1;
			} else {
				this.alpha = 0.5;
			}
			this.emit("active", this._active);
			this.interactive = this._active;
			this.buttonMode = this._active;
		}
	}

	private _focused = true;
	private _active = true;

	constructor(app: T) {
		super(app);

		this.on("pointertap", () => {
			this.focused = true;
		});

		this.once("init", () => {
			this.app.registerUiElement(this);
		});

		this.once("destroy", () => {
			this.app.unregisterUiElement(this);
		});
	}
}
