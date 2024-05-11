import clone from "lodash-es/clone";
import defaults from "lodash-es/defaults";
import * as PIXI from "pixi.js";
import { AppBase } from "./common/app-base";
import { ColorSchemes } from "./common/color";
import { ToneAudioConfig } from "./common/tone-audio";
import { preventContextMenu } from "./common/utils";
import { auth, db, setPersistence } from "./firebase";
import { MSBgFlat } from "./ms-bg-flat";
import { MSCell } from "./ms-cell";
import type { MSConfig, MSGameConfig } from "./ms-config";
import { MS_CONFIG_DEFAULT } from "./ms-config";
import { MAX_GRID_HEIGHT, MAX_GRID_WIDTH, MSState } from "./ms-state";
import { SceneGame } from "./scene-game";
import { SceneMenu } from "./scene-menu";

/**
 * Core App class.
 */
export class MSApp extends AppBase {
	public background?: MSBgFlat;
	public container = new PIXI.Container();
	public state: MSState = new MSState();
	public cellPool: MSCell[] = [];
	public style: MSStyleConfig;
	public scenes: {
		game?: SceneGame;
		menu?: SceneMenu;
	} = {};

	private isLoaded = false;

	constructor() {
		super();

		this.referenceSize = {
			width: 1280,
			height: 720,
			blend: 1,
		};

		preventContextMenu();

		this.root.addChild(this.container);

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
		await this.scenes.game.setGameId(gameId);
		await this.scenes.game.initGame();
	}

	/**
	 *
	 */
	public async showMenu() {
		this.tweenGroup.reset();
		this.background?.animateColor(ColorSchemes.beachRainbowDark.yellow);
		Object.values(this.scenes).forEach((el) => el?.destroy());
		this.scenes.menu = new SceneMenu(this);
		this.root.addChild(this.scenes.menu);
	}

	private onUpdate(dt: number) {
		// Generate cell view instances in the background.
		const maxCells = MAX_GRID_WIDTH * MAX_GRID_HEIGHT;
		const length = this.cellPool.length;
		if (this.ready && length < maxCells) {
			for (let i = 0; i < 5; i++) {
				const idx = length + i;
				if (idx > maxCells - 1) {
					break;
				}

				const [x, y] = this.state.coordsOf(idx);
				this.cellPool[idx] = this.createCellView(x, y);
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

	private createCellView(x: number, y: number): MSCell {
		const msCell = new MSCell(this);
		return msCell;
	}
}
