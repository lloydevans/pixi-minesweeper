import "./firebase";

// Pixi imports
import "pixi.js";
import "pixi-spine";

// CreateJS lib imports.
import "tweenjs/lib/tweenjs";
import "../libs/tween-group";
createjs.Ticker.timingMode = createjs.Ticker.RAF;
createjs.Ticker.maxDelta = 100;

import { ToneAudioConfig } from "./common/tone-audio";
import { MSApp } from "./ms-app";

async function start() {
	window.document.body.style.background = "black";
	window.document.body.style.overflow = "hidden";
	window.document.body.style.margin = "0px";
	window.document.body.style.padding = "0px";
	window.document.body.style.border = "0px";

	const app = new MSApp();

	await app.addSpine("grid-square@1x");
	await app.addSpine("timer@1x");
	await app.addAtlas("textures");
	await app.addAtlas("tiles");
	await app.addAtlas("bg", 1);
	await app.addBitmapFont("bmfont");
	await app.addJson("config", "config.json");
	await app.addJson("audio", "audio.json");
	await app.audio.init(app.getJson("audio") as ToneAudioConfig);

	(window as any).app = app;

	app.onLoad();
	app.init();

	window.document.body.appendChild(app.view as HTMLCanvasElement);
}

if (window.document.readyState === "loading") {
	window.addEventListener("load", start);
} else {
	start();
}
