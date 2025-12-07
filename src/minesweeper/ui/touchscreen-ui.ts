import * as PIXI from "pixi.js";
import { UiButton } from "../../common/ui/ui-button";
import { Component } from "../../common/component";
import { MinesweeperApp } from "../minesweeper-app";
import { MinesweeperCellState } from "../minesweeper-cell-state";

/** UI overlay for touch and accesible controls. */
export class TouchscreenUi extends Component<MinesweeperApp> {
	public targetCell?: MinesweeperCellState;

	private buttonFlag!: UiButton;
	private buttonDig!: UiButton;

	protected init() {
		this.visible = false;

		const cursor = new PIXI.Graphics();
		cursor.circle(0, 0, 8);
		cursor.fill(0x00ff00);

		this.buttonFlag = new UiButton(this.app, {
			textureUp: this.app.getFrame("textures", "button-flag"),
			textureDown: this.app.getFrame("textures", "button-flag"),
		});

		this.buttonDig = new UiButton(this.app, {
			textureUp: this.app.getFrame("textures", "button-dig"),
			textureDown: this.app.getFrame("textures", "button-dig"),
		});
		
		this.buttonFlag.x = -100;
		this.buttonFlag.y = 4;
		this.buttonDig.x = 0;
		this.buttonDig.y = 104;

		this.addChild(this.buttonFlag);
		this.addChild(this.buttonDig);
		this.addChild(cursor);

		this.buttonDig.on("pointertap", () => {
			if (this.targetCell) {
				if (this.app.scenes.game) this.app.scenes.game.leftClick(this.targetCell);
				this.visible = false;
			}
		});

		this.buttonFlag.on("pointertap", () => {
			if (this.targetCell) {
				if (this.app.scenes.game) this.app.scenes.game.rightClick(this.targetCell);
				this.visible = false;
			}
		});
	}

	public setTargetCell(cell: MinesweeperCellState) {
		this.targetCell = cell;
	}

	public hide() {
		this.visible = false;
	}

	public show() {
		this.visible = true;
	}
}
