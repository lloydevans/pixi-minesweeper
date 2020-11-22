import defaults from "lodash-es/defaults";
import * as PIXI from "pixi.js-legacy";
import { AppBase } from "./app-base";
import { hexToNum } from "./color";
import { GameText } from "./game-text";
import { MSApp } from "../ms-app";
import { UiElement } from "./ui-element";

const PADDING = 4;

export interface UITextInputOptions {
	type: "text" | "email" | "password";
	label: string;
	labelColor: string;
	placeholder: string;
	maxCharacters: number;
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
	placeholder: "Placeholder",
	maxCharacters: 32,
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
	private input: HTMLInputElement = window.document.createElement("input");
	private label: GameText;
	private options: UITextInputOptions;
	private debugHitarea: PIXI.Graphics = new PIXI.Graphics();

	constructor(app: MSApp, options?: Partial<UITextInputOptions>) {
		super(app);

		this.options = defaults(options || {}, UITextInputOptionDefaults);

		this.label = new GameText(this.app, { text: this.options.label, fontName: "bmfont", fontSize: 18 });
		this.label._anchor.set(1, 0.5);
		this.label.tint = hexToNum(this.options.labelColor);

		this.input.type = this.options.type;
		this.input.style.position = "absolute";
		this.input.style.padding = "0";
		this.input.style.border = "0";
		this.input.style.margin = "0";

		window.document.body.appendChild(this.input);
		this.once("destroy", () => {
			this.input.parentElement?.removeChild(this.input);
		});
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
		const rect = this.app.renderer.view.getBoundingClientRect();
		const resolution = this.app.renderer.resolution;
		const sx = (rect.width / this.app.renderer.width) * resolution;
		const sy = (rect.height / this.app.renderer.height) * resolution;
		const input = this.input;
		const target = this;

		input.style.left = rect.left + "px";
		input.style.top = rect.top + "px";
		input.style.width = this.app.renderer.width + "px";
		input.style.height = this.app.renderer.height + "px";

		const wt = target.worldTransform;

		let hitArea = target.hitArea as PIXI.Rectangle;

		if (hitArea) {
			input.style.left = (wt.tx + hitArea.x * wt.a) * sx + "px";
			input.style.top = (wt.ty + hitArea.y * wt.d) * sy + "px";
			input.style.width = hitArea.width * wt.a * sx + "px";
			input.style.height = hitArea.height * wt.d * sy + "px";
		} else {
			hitArea = target.getBounds();
			input.style.left = hitArea.x * sx + "px";
			input.style.top = hitArea.y * sy + "px";
			input.style.width = hitArea.width * sx + "px";
			input.style.height = hitArea.height * sy + "px";
		}
	}

	private setSize(width: number, height: number) {
		this.label._anchor.x = 1;

		this.label.x = -width / 2 - 16;

		let x = PADDING;
		let y = PADDING;
		let w = width - PADDING;
		let h = height - PADDING;

		this.hitArea = new PIXI.Rectangle(x + -w / 2, y + -h / 2, w, h);

		this.debugHitarea.clear();
		this.debugHitarea.beginFill(0x00ff00);
		this.debugHitarea.drawRect(x + -w / 2, y + -h / 2, w, h);
		this.debugHitarea.endFill();
	}
}
