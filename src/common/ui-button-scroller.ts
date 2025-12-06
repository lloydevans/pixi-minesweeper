import clamp from "lodash-es/clamp";
import { Container, Texture } from "pixi.js";
import { AppBase } from "./app-base";
import { UiButton } from "./ui-button";
import { BmText } from "./bm-text";
import { EventEmitter } from "./event-emitter";

export interface ButtonScrollerOptions {
	arrowTexture: Texture;
	label: string;
	default: number;
	min: number;
	max: number;
}

export class UiButtonScroller extends Container {
	app: AppBase;

	public readonly onSet = new EventEmitter<number>();

	private _min: number;
	get min(): number {
		return this._min;
	}
	set min(value: number) {
		this._min = value;
		if (this.currentValue > this._min) {
			this.set(this._min);
		}
	}

	private _max: number;
	get max(): number {
		return this._max;
	}
	set max(value: number) {
		this._max = value;
		if (this.currentValue > this._max) {
			this.set(this._max);
		}
	}

	private _currentValue: number;
	get currentValue(): number {
		return this._currentValue;
	}

	private _default: number;
	get default(): number {
		return this._default;
	}

	private number: BmText;
	private buttonLeft: UiButton;
	private buttonRight: UiButton;
	private label: BmText;

	constructor(app: AppBase, options: ButtonScrollerOptions) {
		super();

		this.app = app;

		this._min = options.min;
		this._max = options.max;
		this._default = options.default;
		this._currentValue = this.default;

		this.buttonLeft = new UiButton(this.app, {
			textureUp: options.arrowTexture,
			textureDown: options.arrowTexture,
		});
		this.buttonLeft.rotation = Math.PI;
		this.buttonLeft.x = -64;

		this.buttonRight = new UiButton(this.app, {
			textureUp: options.arrowTexture,
			textureDown: options.arrowTexture,
		});
		this.buttonRight.x = 64;

		this.number = new BmText(this.app, {
			text: this.default.toString(),
			fontName: "bmfont",
			fontSize: 38,
		});
		this.number.anchor.set(0.5);

		this.label = new BmText(this.app, {
			text: options.label,
			fontName: "bmfont",
			fontSize: 38,
		});
		this.label.anchor.set(1, 0.5);
		this.label.position.set(-106, 0);

		this.addChild(this.label, this.number, this.buttonLeft, this.buttonRight);

		this.buttonLeft.on("pointertap", () => this.set(this.currentValue - 1));
		this.buttonRight.on("pointertap", () => this.set(this.currentValue + 1));

		this.set(this.default);
	}

	set(value: number) {
		this._currentValue = Math.floor(clamp(value, this.min, this.max));
		this.number.text = this.currentValue.toString();
		this.buttonLeft.eventMode = this.currentValue !== this.min ? "static" : "none";
		this.buttonLeft.alpha = this.currentValue !== this.min ? 1 : 0.5;
		this.buttonRight.eventMode = this.currentValue !== this.max ? "static" : "none";
		this.buttonRight.alpha = this.currentValue !== this.max ? 1 : 0.5;

		this.onSet.emit(this.currentValue);
	}
}
