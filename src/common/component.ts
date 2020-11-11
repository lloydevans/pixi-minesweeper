import * as PIXI from "pixi.js-legacy";
import { AppBase } from "./app-base";

/**
 * The start of a core component class.
 */
export class Component<T extends AppBase> extends PIXI.Container {
	public app: T;

	/**
	 *
	 *
	 * @param app - Pixi application reference.
	 */
	constructor(app: T) {
		super();

		this.app = app;
	}
}
