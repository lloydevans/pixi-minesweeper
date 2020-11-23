import clamp from "lodash-es/clamp";
import defaults from "lodash-es/defaults";
import * as PIXI from "pixi.js-legacy";
import { MSApp } from "../ms-app";
import { hexToNum } from "./color";
import { UiElement } from "./ui-element";
import { BmText } from "./bm-text";
import { isEventKey } from "keycode";
import { AppBase } from "./app-base";

export interface UITextInputOptions {
	type: "text" | "email" | "password";
	label: string;
	labelColor: string;
	placeholder: string;
	maxCharacters: number;
	textColor: string;
	backColor: string;
	backColorOver: string;
	backColorDown: string;
	backColorSelected: string;
	borderThickness: number;
	borderColor: string;
	borderColorOver: string;
	borderColorDown: string;
	borderColorSelected: string;
	radius: number;
	width: number;
	height: number;
}

export const UITextInputOptionDefaults: UITextInputOptions = {
	type: "text",
	label: "Input",
	labelColor: "#ffffff",
	placeholder: "",
	maxCharacters: 32,
	textColor: "#000000",
	backColor: "#ffffff",
	backColorOver: "#cccccc",
	backColorDown: "#aaaaaa",
	backColorSelected: "#aaaaaa",
	borderColor: "#888888",
	borderColorOver: "#222222",
	borderColorDown: "#000000",
	borderColorSelected: "#444444",
	borderThickness: 2,
	radius: 4,
	width: 256,
	height: 32,
};

/**
 * This is a quick recreation of the dom single line text input as PixiJS graphics.
 */
export class UiTextInput extends UiElement<AppBase> {
	public get value() {
		return this.input.value;
	}
	private back = new PIXI.Graphics();
	private outline = new PIXI.Graphics();
	private textMask = new PIXI.Graphics();
	private textSelection = new PIXI.Graphics();
	private textContainer = new PIXI.Container();
	private textCursor = new PIXI.Graphics();
	private textCursorStart = 0;
	private textCursorEnd = 0;
	private charPositions: number[] = [0];
	private text: BmText;
	private label: BmText;
	private input: HTMLInputElement = window.document.createElement("input");
	private options: UITextInputOptions;

	constructor(app: MSApp, options?: Partial<UITextInputOptions>) {
		super(app);

		this.options = defaults(options || {}, UITextInputOptionDefaults);

		this.input.type = this.options.type;
		this.input.style.position = "absolute";
		this.input.style.zIndex = "-1000";
		window.document.body.appendChild(this.input);

		this.text = new BmText(this.app, { fontName: "bmfont", fontSize: 18 });
		this.text._anchor.set(0, 0.5);
		this.text.tint = hexToNum(this.options.textColor);

		this.label = new BmText(this.app, { text: this.options.label, fontName: "bmfont", fontSize: 18 });
		this.label._anchor.set(1, 0.5);
		this.label.tint = hexToNum(this.options.labelColor);

		this.tween(this.textCursor, { loop: -1 })
			.wait(500)
			.call(() => (this.textCursor.alpha = 0.75))
			.wait(500)
			.call(() => (this.textCursor.alpha = 0.25));

		const onInputCb = this.onInput.bind(this);
		const onKeydownCb = this.onKeydown.bind(this);
		this.input.addEventListener("input", onInputCb);
		this.input.addEventListener("keydown", onKeydownCb);
		this.once("destroy", () => {
			this.input.removeEventListener("input", onInputCb);
			this.input.removeEventListener("keydown", onKeydownCb);
			this.input.parentElement?.removeChild(this.input);
		});
	}

	private onKeydown(e: KeyboardEvent) {
		if (isEventKey(e, "Tab")) {
			e.preventDefault();
		}
	}

	private onInput(e: Event) {
		const target = e.target as HTMLInputElement;
		this.setText(target.value);
	}

	private setCursorPosition(start = this.textCursorStart, end = this.textCursorEnd) {
		this.textCursorStart = clamp(start, 0, this.input.value.length);
		this.textCursorEnd = clamp(end || start, 0, this.input.value.length);
		let cursorPx = this.charPositions[this.textCursorStart];
		let cursorPxEnd = this.charPositions[this.textCursorEnd];

		switch (this.input.selectionDirection) {
			case "forward":
			case "none":
				this.textCursor.x = this.text.x + cursorPxEnd;
				this.textContainer.x = -Math.max(0, -this.options.width + 16 + cursorPxEnd);
				break;

			case "backward":
				this.textCursor.x = this.text.x + cursorPx;
				this.textContainer.x = -Math.max(0, -this.options.width + 16 + cursorPx);
				break;
		}

		this.textSelection.clear();

		if (this.textCursorStart !== this.textCursorEnd) {
			let selectionWidth = cursorPxEnd - cursorPx;
			this.textSelection.beginFill(hexToNum(this.options.textColor), 0.3);
			this.textSelection.drawRect(
				this.text.x + cursorPx,
				-(this.options.height - 8) / 2,
				selectionWidth,
				this.options.height - 8
			);
			this.textSelection.endFill();
			this.textSelection.tint = hexToNum(this.options.backColor);
		}
	}

	protected init() {
		this.setSize(this.options.width, this.options.height);

		this.interactive = true;
		this.buttonMode = true;

		this.textCursor.visible = false;
		this.textContainer.mask = this.textMask;
		this.textContainer.addChild(this.text);
		this.textContainer.addChild(this.textCursor);
		this.textContainer.addChild(this.textSelection);

		this.addChild(this.textMask);
		this.addChild(this.outline);
		this.addChild(this.back);
		this.addChild(this.textContainer);
		this.addChild(this.label);

		this.on("pointerover", this.onPointerOver, this);
		this.on("pointerout", this.onPointerOut, this);
		this.on("pointerdown", this.onPointerDown, this);

		this.on("focus", () => {
			this.input.focus();
			this.textCursor.visible = true;
			this.back.tint = hexToNum(this.options.backColorSelected);
			this.outline.tint = hexToNum(this.options.borderColorSelected);
		});

		this.on("blur", () => {
			this.input.blur();
			this.textCursor.visible = false;
			this.back.tint = hexToNum(this.options.backColor);
			this.outline.tint = hexToNum(this.options.borderColor);
		});
	}

	protected update() {
		if (this.textCursorStart !== this.input.selectionStart || this.textCursorEnd !== this.input.selectionEnd) {
			this.textCursorStart = this.input.selectionStart || 0;
			this.textCursorEnd = this.input.selectionEnd || 0;
			this.setCursorPosition();
		}
	}

	private setText(text: string) {
		this.text.text = "";

		// It's not exactly efficient but works. Getting to the char positions
		// in bitmap text is abit tricky unless I'm missing something.
		this.charPositions = [0];
		Array.from(text).forEach((el, i) => {
			this.text.text += el;
			this.charPositions[i + 1] = this.text.textWidth * this.app.dpr;
		});
	}

	private onPointerOver(e: PIXI.InteractionEvent) {
		this.back.tint = hexToNum(this.options.backColorOver);
		this.outline.tint = hexToNum(this.options.borderColorOver);
	}

	private onPointerOut(e: PIXI.InteractionEvent) {
		if (!this.focused) {
			this.back.tint = hexToNum(this.options.backColor);
			this.outline.tint = hexToNum(this.options.borderColor);
		}
	}

	private onPointerDown(e: PIXI.InteractionEvent) {
		this.back.tint = hexToNum(this.options.backColorDown);
		this.outline.tint = hexToNum(this.options.borderColorDown);
	}

	private setSize(width: number, height: number) {
		this.textCursor.clear();
		this.textCursor.beginFill(hexToNum(this.options.textColor));
		this.textCursor.drawRect(-1, -(height - 8) / 2, 2, height - 8);
		this.textCursor.endFill();
		this.textCursor.tint = hexToNum(this.options.backColor);

		this.back.clear();
		this.back.beginFill(0xffffff);
		this.back.drawRoundedRect(-width / 2, -height / 2, width, height, this.options.radius);
		this.back.endFill();
		this.back.tint = hexToNum(this.options.backColor);

		this.textMask.clear();
		this.textMask.beginFill(0xffffff);
		this.textMask.drawRoundedRect(-width / 2, -height / 2, width, height, this.options.radius);
		this.textMask.endFill();
		this.textMask.tint = 0;

		let outlineW = width + this.options.borderThickness * 2;
		let outlineH = height + this.options.borderThickness * 2;
		this.outline.clear();
		this.outline.beginFill(0xffffff);
		this.outline.drawRoundedRect(-outlineW / 2, -outlineH / 2, outlineW, outlineH, this.options.radius);
		this.outline.endFill();
		this.outline.tint = hexToNum(this.options.borderColor);

		this.text.x = -width / 2 + 4;

		this.textCursor.x = this.text.x;

		this.label._anchor.x = 1;

		this.label.x = -width / 2 - 16;

		this.hitArea = new PIXI.Rectangle(-outlineW / 2, -outlineH / 2, outlineW, outlineH);
	}
}
