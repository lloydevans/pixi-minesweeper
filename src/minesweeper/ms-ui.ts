import * as PIXI from "pixi.js-legacy";
import { BmText } from "../common/core/internal/bm-text";
import { Button } from "../common/core/components/ui/button";
import { Entity } from "../common/core/entity/entity";
import { Spine } from "../common/spine";
import { state } from "./ms-entry";

/**
 */
const MAX_TIME = 999;

/**
 * Class handle UI elements.
 */
export class MSUi extends Entity {
	private buttonRestart!: Button;
	private buttonCross!: Button;
	private flagsEntity!: PIXI.Container;
	private flagsGraphic!: Spine;
	private flagsCount!: BmText;
	private timeEntity!: PIXI.Container;
	private timeGraphic!: Spine;
	private timeCount!: BmText;

	/**
	 * Initialization must be called after assets are loaded.
	 */
	protected init() {
		this.flagsEntity = new Entity(this.app);
		this.flagsEntity.y = -8;

		this.flagsGraphic = new Spine(this.app.getSpine("grid-square"));
		this.flagsGraphic.state.setAnimation(0, "flag-idle", false);
		this.flagsGraphic.y = -24;

		this.flagsCount = new BmText(this.app, { fontName: "bmfont", fontSize: 38 });
		this.flagsCount._anchor.set(0, 0.5);
		this.flagsCount.x = 38;
		this.flagsCount.y = -24;

		this.timeEntity = new Entity(this.app);
		this.timeEntity.y = -8;

		this.timeGraphic = new Spine(this.app.getSpine("timer"));
		this.timeGraphic.scale.set(0.75);
		this.timeGraphic.y = -22;

		this.timeCount = new BmText(this.app, { fontName: "bmfont", fontSize: 38 });
		this.timeCount._anchor.set(0, 0.5);
		this.timeCount.x = 38;
		this.timeCount.y = -24;

		this.buttonCross = new Entity(this.app).add(Button);
		this.buttonRestart = new Entity(this.app).add(Button);

		this.timeEntity.addChild(this.timeGraphic);
		this.timeEntity.addChild(this.timeCount);

		this.flagsEntity.addChild(this.flagsGraphic);
		this.flagsEntity.addChild(this.flagsCount);

		this.addChild(this.timeEntity);
		this.addChild(this.flagsEntity);
		this.addChild(this.buttonRestart.entity);
		this.addChild(this.buttonCross.entity);

		this.buttonCross.on("pointertap", () => this.emit("close"));
		this.buttonRestart.on("pointertap", () => this.emit("restart"));
	}

	/**
	 * Update callback.
	 *
	 * @param dt
	 */
	protected update(dt: number) {
		const flagCount = state.flagCount.toString();
		if (flagCount !== this.flagsCount.text) {
			this.flagsCount.text = flagCount;
		}
	}

	/**
	 * Resize callback.
	 */
	protected resize(width: number, height: number) {
		this.buttonCross.entity.x = width / 2 - 48;
		this.buttonCross.entity.y = -height / 2 + 42;
		this.buttonRestart.entity.x = width / 2 - 128;
		this.buttonRestart.entity.y = -height / 2 + 42;
		this.flagsEntity.x = -width / 2 + 32;
		this.flagsEntity.y = -height / 2 + 64;
		this.timeEntity.x = -width / 2 + 170;
		this.timeEntity.y = -height / 2 + 64;
	}
}
