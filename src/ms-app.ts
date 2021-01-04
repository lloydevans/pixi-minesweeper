import clone from "lodash-es/clone";
import defaults from "lodash-es/defaults";
import * as PIXI from "pixi.js-legacy";
import { AppBase } from "./common/app-base";
import { ColorSchemes } from "./common/color";
import { ToneAudioConfig } from "./common/tone-audio";
import { preventContextMenu } from "./common/utils";
import { auth, db, setPersistence } from "./firebase";
import { MSBgFlat } from "./ms-bg-flat";
import { MSCell } from "./ms-cell";
import { MSStyleConfig, MS_STYLE_DEFAULT, UserData } from "./ms-config";
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

	/**
	 *
	 */
	constructor() {
		super({ forceCanvas: false });

		this.referenceSize = {
			width: 1280,
			height: 720,
			blend: 1,
		};

		preventContextMenu();

		this.root.addChild(this.container);

		this.style = clone(MS_STYLE_DEFAULT);

		this.events.on("init", this.initCb, this);
		this.events.on("update", this.updateCb, this);
	}

	/**
	 * Init callback.
	 */
	private async initCb() {
		this.addSpine("grid-square");
		this.addSpine("timer");
		this.addAtlas("textures");
		this.addAtlas("tiles");
		this.addAtlas("bg", 1);
		this.addBitmapFont("bmfont");
		this.addJson("config", "config.json");
		this.addJson("audio", "audio.json");
		this.loader.load();

		this.loader.onComplete.once(this.loadCb, this);
	}

	/**
	 * Load callback.
	 */
	private async loadCb() {
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

		this.background = new MSBgFlat(this);
		this.root.addChildAt(this.background, 0);

		try {
			await setPersistence();
		} catch (err) {
			console.log(err);
		}

		this.setReady();

		this.firstStart();
	}

	async firstStart() {
		const user = auth.currentUser;
		let userdata;

		if (user) {
			try {
				const account = await db.collection("accounts").doc(user.uid).get();
				userdata = account.data() as UserData;
			} catch (err) {
				console.log(err);
			}
		}

		if (!userdata) {
			this.showMenu();
		} //
		else {
			if (userdata.activeGame) {
				this.showGame(userdata.activeGame);
			} //
			else {
				this.showMenu();
			}
		}
	}

	/**
	 *
	 * @param config
	 */
	public async showGame(gameId: string) {
		this.tweenGroup.reset();
		this.background?.animateColor(ColorSchemes.beachRainbowDark.purple);
		Object.values(this.scenes).forEach((el) => el?.destroy());
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

	/**
	 * Update callback.
	 *
	 * @param dt - Delta time.
	 */
	private updateCb(dt: number) {
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
