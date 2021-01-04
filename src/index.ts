/**
 * Production entry file.
 */

// Polyfills
import "core-js";

import "./firebase";

// Pixi imports
import "pixi.js-legacy";
import "pixi-spine";

// CreateJS lib imports.
import "tweenjs/lib/tweenjs";
import "../libs/tween-group";
createjs.Ticker.timingMode = createjs.Ticker.RAF;
createjs.Ticker.maxDelta = 100;

import { MSApp } from "./ms-app";

function start() {
	window.document.body.style.background = "black";
	window.document.body.style.overflow = "hidden";
	window.document.body.style.margin = "0px";
	window.document.body.style.padding = "0px";
	window.document.body.style.border = "0px";

	const app = new MSApp();

	app.init();

	// TODO: Loading bar
	app.loader.onComplete.once(() => {
		window.document.body.appendChild(app.view);
	});
}

if (window.document.readyState === "loading") {
	window.addEventListener("load", start);
} else {
	start();
}
