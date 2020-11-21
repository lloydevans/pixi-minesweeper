/**
 * Entry file for a basic editor mode, used for development.
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

// Import dat.gui for quick debug UI.
import * as dat from "dat.gui";
const gui = new dat.GUI();
gui.open();

import { MSApp } from "./ms-app";

/**
 *
 */
function start() {
	const app = new MSApp();

	app.init();

	window.document.body.style.background = "black";
	window.document.body.style.overflow = "hidden";
	window.document.body.style.margin = "0px";
	window.document.body.style.padding = "0px";
	window.document.body.style.border = "0px";
	window.document.body.appendChild(app.view);

	const guiParams = {
		startMines: 64,
		gridWidth: 16,
		gridHeight: 16,
		cheatMode: false,
		start: () => app.newGame({ ...guiParams }),
	};

	gui.add(guiParams, "start");
	gui.add(guiParams, "cheatMode").onFinishChange(guiParams.start).updateDisplay();
	gui.add(guiParams, "gridWidth").min(4).max(32).step(1).onFinishChange(guiParams.start).updateDisplay();
	gui.add(guiParams, "gridHeight").min(4).max(32).step(1).onFinishChange(guiParams.start).updateDisplay();
	gui.add(guiParams, "startMines").min(1).max(64).step(1).onFinishChange(guiParams.start).updateDisplay();
}

if (window.document.readyState === "loading") {
	window.addEventListener("load", start);
} else {
	start();
}
