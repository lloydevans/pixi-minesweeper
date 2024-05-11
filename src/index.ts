/**
 * Production entry file.
 */

// Polyfills
import "core-js";

import "./firebase";

// Pixi imports
import "pixi.js";
import "pixi-spine";

// CreateJS lib imports.
import "tweenjs/lib/tweenjs";
import "../libs/tween-group";
createjs.Ticker.timingMode = createjs.Ticker.RAF;
createjs.Ticker.maxDelta = 100;

import { MSApp } from "./ms-app";
import { Assets } from "pixi.js";
export * from "@pixi-spine/loader-uni";

import * as PixiSpine from "pixi-spine";
(window as any).PixiSpine = PixiSpine;

async function start() {
	window.document.body.style.background = "black";
	window.document.body.style.overflow = "hidden";
	window.document.body.style.margin = "0px";
	window.document.body.style.padding = "0px";
	window.document.body.style.border = "0px";

	const app = new MSApp();
	// await app.init({});
	// (window as any).app = app;

	window.document.body.appendChild(app.view as unknown as Element);

	app.gameInit();


	(window as any).Assets = Assets;
}

if (window.document.readyState === "loading") {
	window.addEventListener("load", start);
} else {
	start();
}
