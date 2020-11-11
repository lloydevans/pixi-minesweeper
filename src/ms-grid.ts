import * as PIXI from "pixi.js-legacy";
import { MSCell } from "./ms-cell";

export class MSGrid extends PIXI.Container {
	children: MSCell[] = [];
}
