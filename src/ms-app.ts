import defaults from "lodash-es/defaults";
import * as PIXI from "pixi.js";
import { AppBase } from "./common/app-base";
import { preventContextMenu } from "./common/utils";
import { MSCell } from "./ms-cell";
import type { MSConfig, MSGameConfig } from "./ms-config";
import { MS_CONFIG_DEFAULT } from "./ms-config";
import { MAX_GRID_HEIGHT, MAX_GRID_WIDTH, MSState } from "./ms-state";
import { SceneGame } from "./scene-game";

export const INITIAL_GAME_CONFIG: MSGameConfig = {
	startMines: 32,
	gridWidth: 26,
	gridHeight: 14,
};

/**
 * Core App class.
 */
export class MSApp extends AppBase {
	public state: MSState = new MSState();
	public cellPool: MSCell[] = [];
	public config: MSConfig;
	public scenes: {
		game?: SceneGame;
	} = {};

	private isLoaded = false;

	constructor() {
		super();

		preventContextMenu();

		this.config = { ...MS_CONFIG_DEFAULT };

		this.events.on("update", this.onUpdate, this);

		this.setReady();
	}

	public onLoad() {
		this.isLoaded = true;

		const tilesAtlas = this.getAtlas("tiles");
		if (tilesAtlas) {
			tilesAtlas.baseTexture.mipmap = PIXI.MIPMAP_MODES.OFF;
			tilesAtlas.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
			tilesAtlas.baseTexture.update();
		}

		const bgAtlas = this.getAtlas("bg");
		if (bgAtlas) {
			bgAtlas.baseTexture.mipmap = PIXI.MIPMAP_MODES.OFF;
			bgAtlas.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
			bgAtlas.baseTexture.update();
		}

		this.scenes.game = new SceneGame(this);
		this.root.addChild(this.scenes.game);
	}

	private onUpdate() {
		// Generate cell view instances in the background.
		const maxCells = MAX_GRID_WIDTH * MAX_GRID_HEIGHT;
		const length = this.cellPool.length;
		if (this.isLoaded && length < maxCells) {
			for (let i = 0; i < 5; i++) {
				const idx = length + i;
				if (idx > maxCells - 1) {
					break;
				}

				this.cellPool[idx] = this.createCellView();
			}
		}
	}

	public getCellView(x: number, y: number): MSCell {
		const idx = this.state.indexOf(x, y);
		const cell = this.cellPool[idx];

		if (!cell) {
			throw new Error(`Can't find cell view at ${x},${y}`);
		}

		return cell;
	}

	private parseConfig(config: Partial<MSConfig> = {}): MSConfig {
		return defaults(config, MS_CONFIG_DEFAULT);
	}

	private createCellView(): MSCell {
		const msCell = new MSCell(this);
		return msCell;
	}
}
