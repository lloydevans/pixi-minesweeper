import * as PIXI from "pixi.js-legacy";
import { Component } from "./common/component";
import { MSApp } from "./ms-app";

export class MSBg extends Component<MSApp> {
	private layers: PIXI.Container[] = [];

	constructor(app: MSApp) {
		super(app);

		this.layers.push;
	}
}
