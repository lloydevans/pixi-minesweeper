import { Entity } from "../../entity/entity";
import { Component } from "../component";

/**
 */
export class UiElement extends Component {
	protected container: Entity;

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
				this.container.alpha = 1;
			} else {
				this.container.alpha = 0.5;
			}
			this.emit("active", this._active);
			this.container.interactive = this._active;
			this.container.buttonMode = this._active;
		}
	}

	private _focused = true;
	private _active = true;

	public constructor(entity: Entity) {
		super(entity);

		this.container = new Entity(this.app);

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
