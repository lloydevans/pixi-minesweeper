import defaults from "lodash-es/defaults";
import * as PIXI from "pixi.js";
import { AppBase } from "../common/app-base";
import { preventContextMenu } from "../common/utils";
import { MinesweeperCell } from "./minesweeper-cell";
import type { MinesweeperStyleConfig, MinesweeperGridConfig } from "./minesweeper-config";
import { MS_CONFIG_DEFAULT } from "./minesweeper-config";
import { MAX_GRID_HEIGHT, MAX_GRID_WIDTH, MinesweeperState } from "./minesweeper-state";
import { GameScene } from "./scenes/game-scene";

export const INITIAL_GAME_CONFIG: MinesweeperGridConfig = {
	startMines: 32,
	gridWidth: 26,
	gridHeight: 14,
};

/**
 * Core App class.
 */
export class MinesweeperApp extends AppBase {
	public state: MinesweeperState = new MinesweeperState();
	public cellPool: MinesweeperCell[] = [];
	public config: MinesweeperStyleConfig;
	public scenes: {
		game?: GameScene;
	} = {};

	private isLoaded = false;

	constructor() {
		super();

		preventContextMenu();

		this.config = this.parseConfig();

		this.onUpdate.on(this.handleUpdate, this);

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

		this.scenes.game = new GameScene(this);
		this.root.addChild(this.scenes.game);
	}

	private handleUpdate() {
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

	public getCellView(x: number, y: number): MinesweeperCell {
		const idx = this.state.indexOf(x, y);
		const cell = this.cellPool[idx];

		if (!cell) {
			throw new Error(`Can't find cell view at ${x},${y}`);
		}

		return cell;
	}

	private parseConfig(config: Partial<MinesweeperStyleConfig> = {}): MinesweeperStyleConfig {
		return defaults(config, MS_CONFIG_DEFAULT);
	}

	private createCellView(): MinesweeperCell {
		const msCell = new MinesweeperCell(this);
		return msCell;
	}
}
