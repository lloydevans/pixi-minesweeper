import * as PIXI from "pixi.js-legacy";
import { UiButton } from "./common/ui-button";
import { Component } from "./common/component";
import { MSApp } from "./ms-app";
import { MSCellState } from "./ms-cell-state";

/**
 * UI overlay for touch and accesible controls.
 */
export class MSTouchUi extends Component<MSApp> {
	public targetCell?: MSCellState;

	private buttonFlag!: UiButton;
	private buttonDig!: UiButton;

	/**
	 *
	 */
	protected init() {
		this.visible = false;

		const cursor = new PIXI.Graphics();
		cursor.beginFill(0x00ff00);
		cursor.drawCircle(0, 0, 8);

		this.buttonFlag = new UiButton(this.app, {
			textureUp: this.app.getFrame("textures", "button-flag"),
			textureDown: this.app.getFrame("textures", "button-flag"),
		});
		this.buttonFlag.x = -64;
		this.buttonFlag.y = 0;

		this.buttonDig = new UiButton(this.app, {
			textureUp: this.app.getFrame("textures", "button-dig"),
			textureDown: this.app.getFrame("textures", "button-dig"),
		});
		this.buttonDig.x = 0;
		this.buttonDig.y = 64;

		this.addChild(this.buttonFlag);
		this.addChild(this.buttonDig);
		this.addChild(cursor);

		this.buttonDig.on("pointertap", () => {
			if (this.targetCell) {
				this.app.scenes.game && this.app.scenes.game.leftClick(this.targetCell);
				this.visible = false;
			}
		});

		this.buttonFlag.on("pointertap", () => {
			if (this.targetCell) {
				this.app.scenes.game && this.app.scenes.game.rightClick(this.targetCell);
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
