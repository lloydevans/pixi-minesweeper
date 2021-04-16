import * as PIXI from "pixi.js-legacy";
import { Button } from "../common/core/components/ui/button";
import { Entity } from "../common/core/entity/entity";
import { MSCellState } from "./ms-cell-state";

/**
 * UI overlay for touch and accessible controls.
 */
export class MSTouchUi extends Entity {
	public targetCell?: MSCellState;

	private buttonFlag!: Button;
	private buttonDig!: Button;

	/** */
	protected init() {
		this.visible = false;

		const cursor = new PIXI.Graphics();
		cursor.beginFill(0x00ff00);
		cursor.drawCircle(0, 0, 8);

		this.buttonFlag = new Entity(this.app).add(Button, {
			textureUp: this.app.getFrame("textures", "button-flag"),
			textureDown: this.app.getFrame("textures", "button-flag"),
		});

		this.buttonDig = new Entity(this.app).add(Button, {
			textureUp: this.app.getFrame("textures", "button-dig"),
			textureDown: this.app.getFrame("textures", "button-dig"),
		});

		this.buttonFlag.entity.x = -64;
		this.buttonFlag.entity.y = 0;
		this.buttonDig.entity.x = 0;
		this.buttonDig.entity.y = 64;

		this.addChild(this.buttonFlag.entity);
		this.addChild(this.buttonDig.entity);
		this.addChild(cursor);

		this.buttonDig.on("pointertap", () => {
			if (this.targetCell) {
				this.emit("left-click", this.targetCell);
				this.visible = false;
			}
		});

		this.buttonFlag.on("pointertap", () => {
			if (this.targetCell) {
				this.emit("right-click", this.targetCell);
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
