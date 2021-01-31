import clamp from "lodash-es/clamp";
import defaults from "lodash-es/defaults";
import { Texture } from "pixi.js-legacy";
import { Entity } from "../../entity/entity";
import { BmText } from "../../internal/bm-text";
import { Component } from "../component";
import { Button } from "./button";

export interface ButtonScrollerOptions {
	arrowTexture: Texture;
	text: string;
	default: number;
	min: number;
	max: number;
}

export const ButtonScrollerOptionDefaults: ButtonScrollerOptions = {
	arrowTexture: PIXI.Texture.WHITE,
	text: "",
	default: 0,
	min: 0,
	max: 0,
};

export class ButtonScroller extends Component {
	public get min(): number {
		return this._min;
	}
	public set min(value: number) {
		this._min = value;
		if (this.current > this._min) {
			this.set(this._min);
		}
	}

	public get max(): number {
		return this._max;
	}
	public set max(value: number) {
		this._max = value;
		if (this.current > this._max) {
			this.set(this._max);
		}
	}

	public get current(): number {
		return this._current;
	}

	public get default(): number {
		return this._default;
	}

	public options: ButtonScrollerOptions;

	private _default: number;
	private _current: number;
	private _max: number;
	private _min: number;

	private needsViewUpdate = true;
	private container: Entity;
	private number: BmText;
	private btnL: Button;
	private btnR: Button;
	private label: BmText;

	/**
	 *
	 * @param entity
	 */
	public constructor(entity: Entity) {
		super(entity);

		this.options = defaults({}, ButtonScrollerOptionDefaults);

		this._min = this.options.min;
		this._max = this.options.max;
		this._default = this.options.default;
		this._current = this.default;

		this.container = new Entity(this.app);
		this.btnL = new Entity(this.app).add(Button);
		this.btnR = new Entity(this.app).add(Button);

		this.number = new BmText(this.app, {
			text: this.default.toString(),
			fontName: "bmfont",
			fontSize: 38,
		});

		this.label = new BmText(this.app, {
			text: this.options.text,
			fontName: "bmfont",
			fontSize: 38,
		});

		this.btnL.entity.rotation = Math.PI;
		this.btnL.entity.x = -64;
		this.btnR.entity.x = 64;
		this.number._anchor.set(0.5);
		this.label._anchor.set(1, 0.5);
		this.label.position.set(-106, 0);

		this.entity.addChild(this.container);
		this.container.addChild(this.label);
		this.container.addChild(this.number);
		this.container.addChild(this.btnL.entity);
		this.container.addChild(this.btnR.entity);

		this.btnL.on("pointertap", () => this.set(this.current - 1));
		this.btnR.on("pointertap", () => this.set(this.current + 1));
		this.entity.on("prerender", this.prerenderCb, this);
		this.set(this.default);
	}

	/**
	 *
	 * @param options
	 */
	public setOptions(options: Partial<ButtonScrollerOptions>) {
		this.options = defaults(options, ButtonScrollerOptionDefaults);
		this._min = this.options.min;
		this._max = this.options.max;
		this._default = this.options.default;
		this._current = this.default;

		this.btnL.setOptions({
			textureUp: this.options.arrowTexture,
			textureDown: this.options.arrowTexture,
		});

		this.btnR.setOptions({
			textureUp: this.options.arrowTexture,
			textureDown: this.options.arrowTexture,
		});

		this.needsViewUpdate = true;
	}

	/**
	 *
	 */
	private prerenderCb() {
		if (this.needsViewUpdate) {
			this.needsViewUpdate = false;
			this.updateView();
		}
	}

	/**
	 *
	 * @param value
	 */
	public set(value: number) {
		this._current = Math.floor(clamp(value, this.min, this.max));
		this.emit("set", this.current);
	}

	/**
	 *
	 */
	private updateView() {
		this.number.text = this.current.toString();
		this.btnL.entity.interactive = this.current !== this.min;
		this.btnL.entity.alpha = this.current !== this.min ? 1 : 0.5;
		this.btnR.entity.interactive = this.current !== this.max;
		this.btnR.entity.alpha = this.current !== this.max ? 1 : 0.5;
	}
}
