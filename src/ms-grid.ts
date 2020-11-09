import { Container } from "pixi.js-legacy";
import { MSCell } from "./ms-cell";

export class MSGrid extends Container {
	children: MSCell[] = [];
}
