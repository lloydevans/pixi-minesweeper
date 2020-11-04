/**
 * Entry file for Jest.
 * Note, anything which requires a Webpack loader won't work here!
 */

// Polyfills
import "core-js";

// PixiJS lib imports.
import * as PIXI from "pixi.js-legacy";

// Put PIXI on window for pixi-spine.
window.PIXI = PIXI;
import "pixi-spine";

// Prevent console log in testing output.
PIXI.utils.skipHello();
