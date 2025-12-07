import defaults from "lodash-es/defaults";
import { AppBase } from "../common/app-base";
import { preventContextMenu } from "../common/utils/utils";
import { MinesweeperCell } from "./minesweeper-cell";
import type { MinesweeperGridConfig, MinesweeperStyleConfig } from "./minesweeper-config";
import { MS_CONFIG_DEFAULT } from "./minesweeper-config";
import { MAX_GRID_HEIGHT, MAX_GRID_WIDTH, MinesweeperState } from "./minesweeper-state";
import { GameScene } from "./scenes/game-scene";

export const INITIAL_GAME_CONFIG: MinesweeperGridConfig = {
	startMines: 16,
	gridWidth: 16,
	gridHeight: 12,
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
		super({
			// 4K 16:9 reference resolution
			width: 4096,
			height: 2160,
			blend: 1,
			resolutionBreakpoints: [
				// Approximate breakpoints still need refinement
				{ maxSideSizeThreshold: 0, resolution: 1 },
				{ maxSideSizeThreshold: 1200, resolution: 2 },
				{ maxSideSizeThreshold: 3200, resolution: 4 },
			],
		});

		preventContextMenu();

		this.config = this.parseConfig();

		this.onUpdate.on(this.handleUpdate, this);
		this.onReady.on(this.handleReady, this);
	}

	public handleReady() {
		this.isLoaded = true;

		const tilesAtlas = this.getAtlas("tiles");
		if (tilesAtlas) tilesAtlas.textureSource.scaleMode = "nearest";

		const bgAtlas = this.getAtlas("bg");
		if (bgAtlas) bgAtlas.textureSource.scaleMode = "nearest";

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
