import { AppBase } from "../app-base";
import { Component } from "../component";
import { TypedEmitter } from "../typed-emitter";

export class UiElement<T extends AppBase = AppBase> extends Component<T> {
	public readonly onFocusChange = new TypedEmitter<boolean>();
	public readonly onActiveChange = new TypedEmitter<boolean>();

	public get focused() {
		return this._focused;
	}
	public set focused(value: boolean) {
		if (value !== this._focused) {
			this._focused = value;
			if (this._focused) {
				this.app.blurAllUiElements();
			}
			this.onFocusChange.emit(this._focused);
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
			this.onActiveChange.emit(this._active);
			this.eventMode = this._active ? "static" : "none";
		}
	}

	private _focused = true;
	private _active = true;

	constructor(app: T) {
		super(app);

		this.on("pointertap", () => {
			this.focused = true;
		});

		this.onInit.once(() => this.app.registerUiElement(this));
		this.onDestroy.once(() => this.app.unregisterUiElement(this));
	}
}
