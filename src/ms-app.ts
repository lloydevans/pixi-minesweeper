import clone from "lodash-es/clone";
import defaults from "lodash-es/defaults";
import * as PIXI from "pixi.js-legacy";
import { AppBase } from "./common/app-base";
import { ToneAudioConfig } from "./common/tone-audio";
import { preventContextMenu } from "./common/utils";
import { MSCell } from "./ms-cell";
import { MSStyleConfig, MS_STYLE_DEFAULT } from "./ms-config";
import { MAX_GRID_HEIGHT, MAX_GRID_WIDTH, MSState } from "./ms-state";
import { SceneGame } from "./scene-game";
import { SceneMenu } from "./scene-menu";

/**
 * Core App class.
 */
export class MSApp extends AppBase {
	public state: MSState = new MSState();
	public cellPool: MSCell[] = [];
	public style: MSStyleConfig;
	public scenes: {
		game?: SceneGame;
		menu?: SceneMenu;
	} = {};

	/**
	 *
	 */
	constructor() {
		super({ forceCanvas: false });

		preventContextMenu();

		this.style = clone(MS_STYLE_DEFAULT);

		this.events.on("init", this.onInit, this);
		this.events.on("update", this.onUpdate, this);
	}

	/**
	 * Init callback.
	 */
	private onInit() {
		this.addSpine("grid-square");
		this.addSpine("timer");
		this.addAtlas("textures");
		this.addAtlas("tiles");
		this.addAtlas("bg", 1);
		this.addBitmapFont("bmfont");
		this.addJson("config", "config.json");
		this.addJson("audio", "audio.json");
		this.loader.load();

		this.loader.onComplete.once(this.onLoad, this);
	}

	/**
	 * Load callback.
	 */
	private onLoad() {
		this.audio.init(this.getJson("audio") as ToneAudioConfig);

		this.style = this.parseConfig(this.getJson("config") as MSStyleConfig);

		const tilesAtlas = this.getAtlas("tiles");
		if (tilesAtlas.spritesheet) {
			tilesAtlas.spritesheet.baseTexture.mipmap = PIXI.MIPMAP_MODES.OFF;
			tilesAtlas.spritesheet.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
			tilesAtlas.spritesheet.baseTexture.update();
		}

		const bgAtlas = this.getAtlas("bg");
		if (bgAtlas.spritesheet) {
			bgAtlas.spritesheet.baseTexture.mipmap = PIXI.MIPMAP_MODES.OFF;
			bgAtlas.spritesheet.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
			bgAtlas.spritesheet.baseTexture.update();
		}

		this.setReady();
		this.startup();
	}

	private startup() {
		// this.scenes.game = new SceneGame(this);
		// this.root.addChild(this.scenes.game);

		this.scenes.menu = new SceneMenu(this);
		this.root.addChild(this.scenes.menu);
	}

	/**
	 * Update callback.
	 *
	 * @param dt
	 */
	private onUpdate(dt: number) {
		// Generate cell view instances in the bakground.
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

	/**
	 *
	 * @param x
	 * @param y
	 */
	public getCellView(x: number, y: number): MSCell {
		const idx = this.state.indexOf(x, y);
		const cell = this.cellPool[idx];

		if (!cell) {
			throw new Error(`Can't find cell view at ${x},${y}`);
		}

		return cell;
	}

	/**
	 *
	 * @param config
	 */
	private parseConfig(config: Partial<MSStyleConfig> = {}): MSStyleConfig {
		return defaults(config, MS_STYLE_DEFAULT);
	}

	/**
	 *
	 * @param x
	 * @param y
	 */
	private createCellView(x: number, y: number): MSCell {
		const msCell = new MSCell(this);
		return msCell;
	}
}
