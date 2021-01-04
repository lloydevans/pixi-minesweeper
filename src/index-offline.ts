/**
 * Offline version of the game.
 */

// Polyfills
import "core-js";

// PixiJS lib imports.
import * as PIXI from "pixi.js-legacy";
import "pixi-spine";

// Put PIXI on window for console debugging.
window.PIXI = PIXI;

// CreateJS lib imports.
import "tweenjs/lib/tweenjs";
createjs.Ticker.timingMode = createjs.Ticker.RAF;
createjs.Ticker.maxDelta = 100;

import { MSApp } from "./ms-app";

function start() {
	const app = new MSApp();

	app.init();

	window.document.body.style.background = "black";
	window.document.body.style.overflow = "hidden";
	window.document.body.style.margin = "0px";
	window.document.body.style.padding = "0px";
	window.document.body.style.border = "0px";
	window.document.body.appendChild(app.view);
}

if (window.document.readyState === "loading") {
	window.addEventListener("load", start);
} else {
	start();
}
