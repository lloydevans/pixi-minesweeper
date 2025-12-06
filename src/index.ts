import "./firebase";

// CreateJS lib imports.
import "tweenjs/lib/tweenjs";
import "../libs/tween-group";
// this is the only package that uses global namespaces due to legacy support.
createjs.Ticker.timingMode = createjs.Ticker.RAF;
createjs.Ticker.maxDelta = 100;

import { ToneAudioConfig } from "./common/tone-audio";
import { MinesweeperApp } from "./minesweeper/minesweeper-app";

async function start() {
	window.document.body.style.background = "black";
	window.document.body.style.overflow = "hidden";
	window.document.body.style.margin = "0px";
	window.document.body.style.padding = "0px";
	window.document.body.style.border = "0px";

	const minesweeper = new MinesweeperApp();
	await minesweeper.init({
		backgroundColor: 0x000000,
		preference: "webgpu",
	});

	minesweeper.startApp();

	await Promise.allSettled([
		minesweeper.addSpine("grid-square"),
		minesweeper.addAtlas("textures"),
		minesweeper.addAtlas("tiles"),
		minesweeper.addAtlas("bg", 1),
		minesweeper.addBitmapFont("bmfont", 1),
		minesweeper.addJson("config", "config.json"),
		minesweeper.addJson("audio", "audio.json"),
	]);

	await minesweeper.audio.init(minesweeper.getJson("audio") as ToneAudioConfig);

	minesweeper.setReady();

	window.document.body.appendChild(minesweeper.canvas as HTMLCanvasElement);
}

if (window.document.readyState === "loading") {
	window.addEventListener("load", start);
} else {
	start();
}
