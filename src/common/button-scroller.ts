import clamp from "lodash/clamp";
import { Container, TextStyle, Texture } from "pixi.js-legacy";
import { AppBase } from "./app-base";
import { Button } from "./button";
import { GameText } from "./game-text";

export interface ButtonScrollerOptions {
	arrowTexture: Texture;
	textStyle: TextStyle;
	label: string;
	default: number;
	min: number;
	max: number;
}

export class ButtonScroller extends Container {
	app: AppBase;

	private _min: number;
	get min(): number {
		return this._min;
	}
	set min(value: number) {
		this._min = value;
		if (this.current > this._min) {
			this.set(this._min);
		}
	}

	private _max: number;
	get max(): number {
		return this._max;
	}
	set max(value: number) {
		this._max = value;
		if (this.current > this._max) {
			this.set(this._max);
		}
	}

	private _current: number;
	get current(): number {
		return this._current;
	}

	private _default: number;
	get default(): number {
		return this._default;
	}

	private number: GameText;
	private buttonLeft: Button;
	private buttonRight: Button;
	private label: GameText;

	constructor(app: AppBase, options: ButtonScrollerOptions) {
		super();

		this.app = app;

		this._min = options.min;
		this._max = options.max;
		this._default = options.default;
		this._current = this.default;

		this.buttonLeft = new Button(this.app, { texture: options.arrowTexture });
		this.buttonLeft.rotation = Math.PI;
		this.buttonLeft.anchor.set(0.5);
		this.buttonLeft.x = -64;

		this.buttonRight = new Button(this.app, { texture: options.arrowTexture });
		this.buttonRight.anchor.set(0.5);
		this.buttonRight.x = 64;

		this.number = new GameText(this.app, this.default.toString(), options.textStyle);
		this.number.anchor.set(0.5, 0.5);

		this.label = new GameText(this.app, options.label, options.textStyle);
		this.label.anchor.set(1, 0.5);
		this.label.position.set(-110, 0);

		this.addChild(this.label, this.number, this.buttonLeft, this.buttonRight);

		this.buttonLeft.on("pointertap", () => this.set(this.current - 1));
		this.buttonRight.on("pointertap", () => this.set(this.current + 1));

		this.set(this.default);
	}

	set(value: number) {
		this._current = Math.floor(clamp(value, this.min, this.max));
		this.number.text = this.current.toString();
		this.buttonLeft.interactive = this.current !== this.min;
		this.buttonLeft.alpha = this.current !== this.min ? 1 : 0.5;
		this.buttonRight.interactive = this.current !== this.max;
		this.buttonRight.alpha = this.current !== this.max ? 1 : 0.5;

		this.emit("set", this.current);
	}
}
