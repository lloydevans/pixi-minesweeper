import * as PIXI from "pixi.js-legacy";
import { Button } from "./common/button";
import { Component } from "./common/component";
import { MSApp } from "./ms-app";
import { MSCellState } from "./ms-cell-state";

/**
 * UI overlay for touch and accesible controls.
 */
export class MSTouchUi extends Component<MSApp> {
	public targetCell?: MSCellState;

	private buttonFlag!: Button;
	private buttonDig!: Button;

	constructor(app: MSApp) {
		super(app);
	}

	/**
	 *
	 */
	public init() {
		this.visible = false;

		let cursor = new PIXI.Graphics();
		cursor.beginFill(0x00ff00);
		cursor.drawCircle(0, 0, 8);

		this.buttonFlag = new Button(this.app, { texture: this.app.getFrame("textures", "button-flag") });
		this.buttonFlag.tint = 0x444444;
		this.buttonFlag.x = -64;
		this.buttonFlag.y = 0;

		this.buttonDig = new Button(this.app, { texture: this.app.getFrame("textures", "button-dig") });
		this.buttonDig.tint = 0x444444;
		this.buttonDig.x = 0;
		this.buttonDig.y = 64;

		this.addChild(this.buttonFlag);
		this.addChild(this.buttonDig);
		this.addChild(cursor);

		this.buttonDig.on("pointertap", () => {
			if (this.targetCell) {
				this.app.leftClick(this.targetCell);
				this.visible = false;
			}
		});

		this.buttonFlag.on("pointertap", () => {
			if (this.targetCell) {
				this.app.rightClick(this.targetCell);
				this.visible = false;
			}
		});
	}

	/**
	 * Set current target cell.
	 */
	public setTargetCell(cell: MSCellState) {
		this.targetCell = cell;
	}

	/**
	 * TODO: animation
	 */
	public hide() {
		this.visible = false;
	}

	/**
	 * TODO: animation
	 */
	public show() {
		this.visible = true;
	}
}
