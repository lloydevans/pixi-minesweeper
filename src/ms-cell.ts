import { BLEND_MODES, Container, Rectangle, Sprite, Text, TextStyle, Texture, TilingSprite } from "pixi.js-legacy";
import { Ease } from "./common/ease";
import { GameText } from "./common/game-text";
import { Spine } from "./common/spine";
import { Tween } from "./common/tween";
import { MSApp } from "./ms-app";
import type { MSCellState } from "./ms-cell-state";
import type { NumberKey } from "./ms-config";

// Reference size of cell graphics before any scaling.
export const REF_WIDTH = 64;
export const REF_HEIGHT = 64;

/**
 *
 */
export class MSCell extends Container {
	public get ix(): number {
		return this.viewState.x;
	}
	public get iy(): number {
		return this.viewState.y;
	}

	private flag?: Spine;
	private mine?: Spine;
	private app: MSApp;
	private front: TilingSprite;
	private hover: Sprite;
	private feedback: Spine;
	private adjacentText: Text;
	private textureFront: Texture;
	private textureFrontTileSize: number = 32;
	private edges: {
		l: Sprite;
		r: Sprite;
		u: Sprite;
		d: Sprite;
	};
	private state: MSCellState;
	private viewState: MSCellState;

	/**
	 *
	 * @param app
	 * @param cell
	 * @param cellWidth
	 * @param cellHeight
	 */
	constructor(app: MSApp, state: MSCellState) {
		super();

		this.app = app;
		this.state = state;
		this.viewState = {
			x: -1,
			y: -1,
			adjacent: 0,
			covered: true,
			mine: false,
			flag: false
		};
		this.mine = this.createMine();
		this.flag = this.createFlag();

		this.edges = {
			l: this.createEdgeSprite(0),
			r: this.createEdgeSprite(180),
			u: this.createEdgeSprite(90),
			d: this.createEdgeSprite(-90)
		};

		this.textureFront = this.app.getFrame("tiles", "front-0");

		this.hover = Sprite.from(Texture.WHITE);
		this.hover.anchor.set(0.5);
		this.hover.alpha = 0;
		this.hover.width = REF_WIDTH;
		this.hover.height = REF_HEIGHT;
		this.hover.x = REF_WIDTH / 2;
		this.hover.y = REF_HEIGHT / 2;
		this.hover.blendMode = BLEND_MODES.ADD;

		let textStyle = new TextStyle({
			fontWeight: this.app.config.colorNumberWeight,
			fontSize: Math.floor(REF_WIDTH * 0.65)
		});
		this.adjacentText = new GameText(this.app, "", textStyle);
		this.adjacentText.anchor.set(0.5);
		this.adjacentText.x = REF_WIDTH / 2;
		this.adjacentText.y = REF_HEIGHT / 2;

		this.front = new TilingSprite(this.textureFront);
		this.front.scale.set(REF_WIDTH / this.textureFrontTileSize);
		this.front.width = this.textureFrontTileSize;
		this.front.height = this.textureFrontTileSize;
		this.front.visible = true;
		this.front.cacheAsBitmap = true;

		this.feedback = new Spine(this.app.getSpine("feedback"));
		this.feedback.visible = false;
		this.feedback.x = REF_WIDTH / 2;
		this.feedback.y = REF_HEIGHT / 2;

		Object.values(this.edges).forEach((el) => {
			el.position.set(REF_WIDTH / 2, REF_HEIGHT / 2);
			el.width = REF_WIDTH;
			el.height = REF_HEIGHT;
		});

		this.hitArea = new Rectangle(0, 0, REF_WIDTH, REF_HEIGHT);

		this.addChild(this.mine);
		this.addChild(this.adjacentText);
		this.addChild(this.front);
		this.addChild(...Object.values(this.edges));
		this.addChild(this.flag);
		this.addChild(this.feedback);
		this.addChild(this.hover);

		this.on("mouseover", this.animateHoverStart, this);
		this.on("mouseout", this.animateHoverEnd, this);

		// @ts-ignore // Missing type.
		this.tabIndex = this.app.state.indexOf(this.ix, this.iy);
		this.accessibleHint = `cell:${this.ix},${this.iy}`;
	}

	/**
	 *
	 */
	public init() {
		this.updateState();
		this.updateGridPosition();
		this.setInteractiveEnabled(true);
	}

	/**
	 *
	 */
	private createFlag(): Spine {
		let flag = new Spine(this.app.getSpine("flag"));
		flag.stateData.defaultMix = 0.05;
		flag.x = REF_WIDTH / 2 - 2;
		flag.y = REF_HEIGHT - 12;
		flag.visible = false;
		flag.scale.set(0.75);
		this.addChild(flag);
		return flag;
	}

	/**
	 *
	 */
	private createMine(): Spine {
		let mine = new Spine(this.app.getSpine("mine"));
		mine.state.setAnimation(0, "idle", true);
		mine.x = REF_WIDTH / 2;
		mine.y = REF_HEIGHT / 2;
		mine.visible = false;
		this.addChild(mine);
		return mine;
	}

	/**
	 *
	 */
	private updateGridPosition() {
		this.x = this.ix * REF_WIDTH;
		this.y = this.iy * REF_HEIGHT;
		this.front.tilePosition.x = -this.viewState.x * this.textureFrontTileSize;
		this.front.tilePosition.y = -this.viewState.y * this.textureFrontTileSize;
	}

	/**
	 *
	 */
	private createEdgeSprite(angle = 0): Sprite {
		let texture = this.app.getFrame("tiles", "front-edge-0");
		let sprite = new Sprite(texture);
		sprite.alpha = 0.5;
		sprite.anchor.set(0.5);
		sprite.visible = false;
		sprite.width = REF_WIDTH;
		sprite.height = REF_HEIGHT;
		sprite.position.set(REF_WIDTH / 2, REF_HEIGHT / 2);
		sprite.angle = angle;
		return sprite;
	}

	/**
	 *
	 */
	public updateEdgeSprites() {
		Object.values(this.edges).forEach((el) => {
			let frameName = this.viewState.covered ? "front-edge-0" : "back-edge-0";
			el.texture = this.app.getFrame("tiles", frameName);
		});

		if (this.ix - 1 > -1) {
			let l = this.app.state.cellAt(this.ix - 1, this.iy).view!;
			this.edges.l.visible = l.viewState.covered !== this.viewState.covered;
			l.edges.r.visible = l.viewState.covered !== this.viewState.covered;
		} else {
			this.edges.l.visible = true;
		}
		if (this.ix + 1 < this.app.state.width) {
			let r = this.app.state.cellAt(this.ix + 1, this.iy).view!;
			this.edges.r.visible = r.viewState.covered !== this.viewState.covered;
			r.edges.l.visible = r.viewState.covered !== this.viewState.covered;
		} else {
			this.edges.r.visible = true;
		}
		if (this.iy - 1 > -1) {
			let u = this.app.state.cellAt(this.ix, this.iy - 1).view!;
			this.edges.u.visible = u.viewState.covered !== this.viewState.covered;
			u.edges.d.visible = u.viewState.covered !== this.viewState.covered;
		} else {
			this.edges.u.visible = true;
		}
		if (this.iy + 1 < this.app.state.height) {
			let d = this.app.state.cellAt(this.ix, this.iy + 1).view!;
			this.edges.d.visible = d.viewState.covered !== this.viewState.covered;
			d.edges.u.visible = d.viewState.covered !== this.viewState.covered;
		} else {
			this.edges.d.visible = true;
		}
	}

	/**
	 *
	 * @param state
	 */
	public updateState(state: MSCellState = this.state) {
		if (state.flag !== this.viewState.flag) {
			this.setFlagEnabled(state.flag);
		}

		if (state.mine !== this.viewState.mine) {
			this.setMineEnabled(state.mine);
		}

		if (state.covered !== this.viewState.covered) {
			this.setCoveredEnabled(state.covered);
		}

		if (state.adjacent !== 0 && !state.mine) {
			this.setText(state.adjacent);
		} //
		else {
			this.adjacentText.visible = false;
		}

		if (this.viewState.x !== state.x || this.viewState.y !== state.y) {
			this.updateGridPosition();
		}

		this.front.alpha = this.app.state.config.cheatMode ? 0.9 : 1;

		Object.assign(this.viewState, state);

		this.updateEdgeSprites();
	}

	/**
	 *
	 */
	public animateResult() {
		if (this.viewState.mine && this.viewState.flag) {
			this.animateCorrect();
		}

		if (this.viewState.mine && !this.viewState.flag) {
			this.setCoveredEnabled(false);
			this.updateEdgeSprites();
			this.animateIncorrect();
			this.explodeMine();
		}

		if (!this.viewState.mine && this.viewState.flag) {
			this.adjacentText.text = "";
			this.animateIncorrect();
		}
	}

	/**
	 *
	 */
	public animatePress() {
		Tween.get(this.hover).to(
			{
				width: REF_WIDTH - 32,
				height: REF_HEIGHT - 32,
				alpha: 0
			},
			150,
			Ease.sineOut
		);
	}

	/**
	 *
	 */
	public animateHoverStart() {
		Tween.get(this.hover).to({ alpha: 0.25 }, 50);
	}

	/**
	 *
	 */
	public animateHoverEnd() {
		Tween.get(this.hover).to({ alpha: 0 }, 50);
	}

	/**
	 *
	 * @param total
	 */
	private setText(total: number) {
		let key = total.toString() as NumberKey;
		this.adjacentText.style.fill = this.app.config.colorNumbers[key] ?? 0;
		this.adjacentText.visible = true;
		this.adjacentText.text = key;
	}

	/**
	 *
	 * @param enabled
	 */
	public setCoveredEnabled(enabled = true) {
		this.viewState.covered = enabled;
		if (enabled) {
			this.setInteractiveEnabled(true);
			this.feedback.visible = false;
			this.front.visible = true;
		} else {
			this.setInteractiveEnabled(false);
			this.front.visible = false;
		}
	}

	/**
	 *
	 * @param enabled
	 */
	public setInteractiveEnabled(enabled = true) {
		if (!enabled) {
			this.animateHoverEnd();
		}
		this.interactive = enabled;
		this.buttonMode = enabled;
		this.accessible = enabled;
	}

	/**
	 *
	 */
	public setMineEnabled(enabled = true) {
		this.viewState.mine = enabled;
		if (this.mine) {
			if (enabled) {
				this.mine.visible = true;
			} else {
				this.mine.visible = false;
			}
		}
	}

	/**
	 *
	 */
	public setFlagEnabled(enabled = true) {
		this.viewState.flag = enabled;
		if (this.flag) {
			if (enabled) {
				this.flag.state.setAnimation(0, "place-confirm", false);
				this.flag.visible = true;
			} else {
				this.flag.state.setAnimation(0, "destroy", false);
				this.flag.state.addAnimation(0, "hidden", false, 0);
			}
		}
	}

	/**
	 *
	 */
	public animateCorrect() {
		this.feedback.visible = true;
		this.feedback.state.setAnimation(0, "correct", false);
	}

	/**
	 *
	 */
	public animateIncorrect() {
		this.feedback.visible = true;
		this.feedback.state.setAnimation(0, "incorrect", false);
	}

	/**
	 *
	 */
	public explodeMine() {
		this.mine?.state.setAnimation(0, "explode", false);
	}
}
