import * as PIXI from "pixi.js-legacy";
import { App } from "./common/core/app/app";
import { ToneAudioConfig } from "./common/core/audio/tone-audio";
import { preventContextMenu } from "./common/utils";
import { auth, db, setPersistence } from "./firebase";
import { MSBgFlat } from "./ms-bg-flat";
import { MSCell } from "./ms-cell";
import { UserData } from "./ms-config";
import { MAX_GRID_HEIGHT, MAX_GRID_WIDTH, MSState } from "./ms-state";
import { SceneGame } from "./scenes/scene-game";
import { SceneMenu } from "./scenes/scene-menu";

export const state = new MSState();

export const cellPool: MSCell[] = [];

const scenes: {
	game?: SceneGame;
	menu?: SceneMenu;
} = {};

const app = new App();
app.events.init.once(initCb);
app.events.update.once(updateCb);
app.referenceSize = {
	width: 1280,
	height: 720,
	blend: 1,
};

function pageLoad() {
	window.document.body.style.background = "black";
	window.document.body.style.overflow = "hidden";
	window.document.body.style.margin = "0px";
	window.document.body.style.padding = "0px";
	window.document.body.style.border = "0px";

	app.init();

	// TODO: Loading bar
	app.loader.onComplete.once(() => {
		window.document.body.appendChild(app.view);
	});

	firstStart();
}

function initCb() {
	app.addSpine("grid-square");
	app.addSpine("timer");
	app.addAtlas("textures");
	app.addAtlas("tiles");
	app.addAtlas("bg", 1);
	app.addBitmapFont("bmfont");
	app.addJson("config", "config.json");
	app.addJson("audio", "audio.json");
	app.loader.load();

	app.loader.onComplete.once(loadCb);
}

function updateCb() {
	// Generate cell view instances in the background.
	const maxCells = MAX_GRID_WIDTH * MAX_GRID_HEIGHT;
	const length = cellPool.length;
	if (app.ready && length < maxCells) {
		for (let i = 0; i < 5; i++) {
			const idx = length + i;
			if (idx > maxCells - 1) {
				break;
			}

			const [x, y] = state.coordsOf(idx);
			cellPool[idx] = createCellView(x, y);
		}
	}
}

async function loadCb() {
	const background = new MSBgFlat(app);
	app.root.addChildAt(background, 0);

	const tonAudioConfig = app.getJson("audio") as ToneAudioConfig;
	app.audio.init(tonAudioConfig);

	const tilesAtlas = app.getAtlas("tiles");
	if (tilesAtlas.spritesheet) {
		tilesAtlas.spritesheet.baseTexture.mipmap = PIXI.MIPMAP_MODES.OFF;
		tilesAtlas.spritesheet.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
		tilesAtlas.spritesheet.baseTexture.update();
	}

	const bgAtlas = app.getAtlas("bg");
	if (bgAtlas.spritesheet) {
		bgAtlas.spritesheet.baseTexture.mipmap = PIXI.MIPMAP_MODES.OFF;
		bgAtlas.spritesheet.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
		bgAtlas.spritesheet.baseTexture.update();
	}

	try {
		await setPersistence();
	} catch (err) {
		console.log(err);
	}

	app.setReady();

	firstStart();
}

export async function showGame(gameId: string) {
	Object.values(scenes).forEach((el) => el?.root.destroy());
	scenes.game = new SceneGame(app);
	app.root.addChild(scenes.game.root);
	await scenes.game.setGameId(gameId);
	await scenes.game.initGame();
}

export async function showMenu() {
	Object.values(scenes).forEach((el) => el?.root.destroy());
	scenes.menu = new SceneMenu(app);
	app.root.addChild(scenes.menu.root);
}

export function getCellView(x: number, y: number): MSCell {
	const idx = state.indexOf(x, y);
	const cell = cellPool[idx];

	if (!cell) {
		throw new Error(`Can't find cell view at ${x},${y}`);
	}

	return cell;
}

export function createCellView(x: number, y: number): MSCell {
	const msCell = new MSCell(app);
	return msCell;
}

export async function firstStart() {
	const user = auth.currentUser;

	let userdata;

	if (user) {
		try {
			const account = await db
				.collection("accounts") //
				.doc(user.uid)
				.get();

			userdata = account.data() as UserData;
		} catch (err) {
			console.log(err);
		}
	}

	if (userdata && userdata.activeGame) {
		showGame(userdata.activeGame);
	} else {
		showMenu();
	}
}

if (window.document.readyState === "loading") {
	window.addEventListener("load", pageLoad);
} else {
	pageLoad();
}

preventContextMenu();
