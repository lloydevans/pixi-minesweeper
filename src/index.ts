import "core-js";

import "./firebase";

import * as PIXI from "pixi.js-legacy";
import "pixi-spine";

window.PIXI = PIXI;

import "tweenjs/lib/tweenjs";
import "../libs/tween-group";
createjs.Ticker.timingMode = createjs.Ticker.RAF;
createjs.Ticker.maxDelta = 100;

import "./minesweeper/ms-entry";
