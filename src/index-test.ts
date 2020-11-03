/**
 * Entry file for Jest.
 */

import "core-js";

// PixiJS lib imports.
import * as PIXI from "pixi.js-legacy";
window.PIXI = PIXI;
import "pixi-spine";

// Prevent console log in testing output.
PIXI.utils.skipHello();
