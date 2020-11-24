import defaults from "lodash-es/defaults";
import * as PIXI from "pixi.js-legacy";
import { AppBase } from "./app-base";
import { hexToNum } from "./color";
import { BmText } from "./bm-text";
import { MSApp } from "../ms-app";
import { UiElement } from "./ui-element";

export interface UITextInputOptions {
	type: "text" | "email" | "password";
	label: string;
	labelColor: string;
	placeholder: string;
	textColor: string;
	backColor: string;
	radius: number;
	width: number;
	height: number;
}

export const UITextInputOptionDefaults: UITextInputOptions = {
	type: "text",
	label: "Input",
	labelColor: "#ffffff",
	placeholder: "",
	textColor: "#000000",
	backColor: "#ffffff",
	radius: 4,
	width: 256,
	height: 32,
};

export class UiTextInputDom extends UiElement<AppBase> {
	public get value() {
		return this.input.value;
	}
	private input = window.document.createElement("input");
	private domVisible = false;
	private label: BmText;
	private options: UITextInputOptions;
	private debugHitarea = new PIXI.Graphics();

	constructor(app: MSApp, options?: Partial<UITextInputOptions>) {
		super(app);

		this.options = defaults(options || {}, UITextInputOptionDefaults);

		this.label = new BmText(this.app, { text: this.options.label, fontName: "bmfont", fontSize: 18 });
		this.label._anchor.set(1, 0.5);
		this.label.tint = hexToNum(this.options.labelColor);

		this.input.type = this.options.type;
		this.input.style.position = "absolute";
		this.input.style.paddingLeft = "8px";
		this.input.style.border = "0";
		this.input.style.margin = "0";

		const onInputCb = this.onInput.bind(this);
		this.input.addEventListener("input", onInputCb);
		this.once("destroy", () => {
			this.input.removeEventListener("input", onInputCb);
			this.input.parentElement?.removeChild(this.input);
		});

		this.on("active", (active: boolean) => {
			if (active) {
				this.input.disabled = false;
			} else {
				this.input.disabled = true;
			}
		});
	}

	private onInput(e: Event) {
		this.emit("input", e);
	}

	protected init() {
		this.setSize(this.options.width, this.options.height);

		this.interactive = true;
		this.buttonMode = true;

		this.addChild(this.label);

		this.on("focus", () => {
			this.input.focus();
		});

		this.on("blur", () => {
			this.input.blur();
		});
	}

	protected update(dt: number) {
		if ((!this.parent || !this.worldVisible) && this.domVisible) {
			this.input.parentElement?.removeChild(this.input);
			this.domVisible = false;
		}
		if (this.parent && this.worldVisible && !this.domVisible) {
			document.body.appendChild(this.input);
			this.domVisible = true;
		}

		const rect = this.app.renderer.view.getBoundingClientRect();
		const resolution = this.app.renderer.resolution;
		const sx = (rect.width / this.app.renderer.width) * resolution;
		const sy = (rect.height / this.app.renderer.height) * resolution;
		const element = this.input;

		element.style.left = rect.left + "px";
		element.style.top = rect.top + "px";
		element.style.width = this.app.renderer.width + "px";
		element.style.height = this.app.renderer.height + "px";

		const wt = this.worldTransform;

		let hitArea = this.hitArea as PIXI.Rectangle;

		if (hitArea) {
			element.style.left = (wt.tx + hitArea.x * wt.a) * sx + "px";
			element.style.top = (wt.ty + hitArea.y * wt.d) * sy + "px";
			element.style.width = hitArea.width * wt.a * sx + "px";
			element.style.height = hitArea.height * wt.d * sy + "px";
		} else {
			hitArea = this.getBounds();
			element.style.left = hitArea.x * sx + "px";
			element.style.top = hitArea.y * sy + "px";
			element.style.width = hitArea.width * sx + "px";
			element.style.height = hitArea.height * sy + "px";
		}
	}

	private setSize(width: number, height: number) {
		this.label._anchor.x = 1;

		this.label.x = -width / 2 - 16;

		const x = 0;
		const y = 0;
		const w = width;
		const h = height;

		this.hitArea = new PIXI.Rectangle(x + -w / 2, y + -h / 2, w, h);

		this.debugHitarea.clear();
		this.debugHitarea.beginFill(0x00ff00);
		this.debugHitarea.drawRect(x + -w / 2, y + -h / 2, w, h);
		this.debugHitarea.endFill();
	}
}
