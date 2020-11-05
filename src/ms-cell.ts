import { BLEND_MODES, Container, Rectangle, Sprite, Text, TextStyle, Texture, TilingSprite } from "pixi.js-legacy";
import { GameText } from "./common/game-text";
import { Spine } from "./common/spine";
import { Tween } from "./common/tween";
import { Ease } from "./common/ease";
import { MSApp } from "./ms-app";
import type { NumberKey } from "./ms-config";
import type { MSCellState } from "./ms-cell-state";

// Reference size of cell graphics before any scaling.
export const REF_WIDTH = 64;
export const REF_HEIGHT = 64;

/**
 *
 */
export class MSCell extends Container {
	public cellWidth: number;
	public cellHeight: number;
	public get ix(): number {
		return this.viewState.x;
	}
	public get iy(): number {
		return this.viewState.y;
	}

	private app: MSApp;
	private flag: Spine;
	private mine: Spine;
	private back: TilingSprite;
	private front: TilingSprite;
	private hover: Sprite;
	private feedback: Spine;
	private text: Text;
	private textureBack: Texture;
	private textureFront: Texture;
	private textureBackTileSize: number = 32;
	private textureFrontTileSize: number = 32;
	private edges: {
		l: Sprite;
		r: Sprite;
		u: Sprite;
		d: Sprite;
	};
	private viewState: MSCellState = {
		x: -1,
		y: -1,
		adjacent: 0,
		covered: true,
		mine: false,
		flag: false
	};

	/**
	 *
	 * @param app
	 * @param cell
	 * @param cellWidth
	 * @param cellHeight
	 */
	constructor(app: MSApp, cellWidth: number, cellHeight: number) {
		super();

		this.app = app;
		this.cellWidth = cellWidth;
		this.cellHeight = cellHeight;

		this.mine = this.createMine();
		this.flag = this.createFlag();

		this.edges = {
			l: this.createEdgeSprite(0),
			r: this.createEdgeSprite(180),
			u: this.createEdgeSprite(90),
			d: this.createEdgeSprite(-90)
		};

		this.textureFront = this.app.getFrame("tiles", "front-0");
		this.textureBack = this.app.getFrame("tiles", "back-0");

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
		this.text = new GameText(this.app, "", textStyle);
		this.text.anchor.set(0.5);
		this.text.x = REF_WIDTH / 2;
		this.text.y = REF_HEIGHT / 2;

		this.front = new TilingSprite(this.textureFront);
		this.front.scale.set(REF_WIDTH / this.textureFrontTileSize);
		this.front.width = this.textureFrontTileSize;
		this.front.height = this.textureFrontTileSize;
		this.front.visible = true;

		this.back = new TilingSprite(this.textureBack);
		this.back.width = this.textureBackTileSize;
		this.back.height = this.textureBackTileSize;
		this.back.scale.set(REF_WIDTH / this.textureBackTileSize);
		this.back.visible = false;

		this.feedback = new Spine(this.app.getSpine("feedback"));
		this.feedback.state.setAnimation(0, "idle", true);
		this.feedback.x = REF_WIDTH / 2;
		this.feedback.y = REF_HEIGHT / 2;

		Object.values(this.edges).forEach((el) => {
			el.position.set(REF_WIDTH / 2, REF_HEIGHT / 2);
			el.width = REF_WIDTH;
			el.height = REF_HEIGHT;
		});

		this.hitArea = new Rectangle(0, 0, REF_WIDTH, REF_HEIGHT);

		this.addChild(this.back);
		this.addChild(this.mine);
		this.addChild(this.text);
		this.addChild(this.front);
		this.addChild(this.flag);
		this.addChild(this.feedback);
		this.addChild(this.hover);
		this.addChild(...Object.values(this.edges));

		this.on("mouseover", this.animateHoverStart, this);
		this.on("mouseout", this.animateHoverEnd, this);

		// @ts-ignore // Missing type.
		this.tabIndex = this.app.state.indexOf(this.ix, this.iy);
		this.accessibleHint = `cell:${this.ix},${this.iy}`;
		this.updateCellSize(cellWidth, cellHeight);
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
	 * @param cellWidth
	 * @param cellHeight
	 */
	public updateCellSize(cellWidth: number, cellHeight: number) {
		this.cellWidth = cellWidth;
		this.cellHeight = cellHeight;
		this.scale.set(cellWidth / REF_WIDTH);
		this.updateGridPosition(cellWidth, cellHeight);
	}

	/**
	 *
	 * @param ix
	 * @param iy
	 */
	private updateGridPosition(cellWidth: number, cellHeight: number) {
		this.x = this.ix * cellWidth;
		this.y = this.iy * cellHeight;
		this.back.tilePosition.x = -this.viewState.x * this.textureBackTileSize;
		this.back.tilePosition.y = -this.viewState.y * this.textureBackTileSize;
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
		sprite.width = this.cellWidth;
		sprite.height = this.cellHeight;
		sprite.position.set(this.cellWidth / 2, this.cellHeight / 2);
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

		this.edges.l.visible =
			this.ix - 1 < 0 || //
			this.app.state.cellAt(this.ix - 1, this.iy).covered !== this.viewState.covered;

		this.edges.r.visible =
			this.ix + 1 >= this.app.state.width ||
			this.app.state.cellAt(this.ix + 1, this.iy).covered !== this.viewState.covered;

		this.edges.u.visible =
			this.iy - 1 < 0 || //
			this.app.state.cellAt(this.ix, this.iy - 1).covered !== this.viewState.covered;

		this.edges.d.visible =
			this.iy + 1 >= this.app.state.height ||
			this.app.state.cellAt(this.ix, this.iy + 1).covered !== this.viewState.covered;
	}

	/**
	 *
	 * @param state
	 */
	public updateState(state: MSCellState) {
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
			this.text.visible = false;
		}

		if (this.viewState.x !== state.x || this.viewState.y !== state.y) {
			this.updateGridPosition(state.x, state.y);
		}

		this.front.alpha = this.app.state.config.cheatMode ? 0.9 : 1;

		Object.assign(this.viewState, state);

		this.updateEdgeSprites();
	}

	/**
	 *
	 */
	public animatePress() {
		Tween.get(this.hover).to(
			{
				width: this.cellWidth - 32,
				height: this.cellHeight - 32,
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
	 */
	public showResult() {
		this.setInteractiveEnabled(false);

		let cellState = this.app.state.cellAt(this.ix, this.iy);

		if (cellState.mine && !cellState.flag) {
			this.app.state.cellAt(this.ix, this.iy).covered = false;
			this.setCoveredEnabled(false);
			this.animateIncorrect();
			this.explodeMine();
		}

		if (cellState.mine && cellState.flag) {
			this.animateCorrect();
		}

		if (!cellState.mine && cellState.flag) {
			this.animateIncorrect();
		}
	}

	/**
	 *
	 * @param total
	 */
	private setText(total: number) {
		let key = total.toString() as NumberKey;
		this.text.style.fill = this.app.config.colorNumbers[key] ?? 0;
		this.text.visible = true;
		this.text.text = key;
	}

	/**
	 *
	 * @param enabled
	 */
	public setCoveredEnabled(enabled = true) {
		if (enabled) {
			this.setInteractiveEnabled(true);
			this.front.visible = true;
			this.back.visible = false;
		} else {
			this.setInteractiveEnabled(false);
			this.front.visible = false;
			this.back.visible = true;
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
		if (enabled) {
			this.mine.visible = true;
		} else {
			this.mine.visible = false;
		}
	}

	/**
	 *
	 */
	public setFlagEnabled(enabled = true) {
		if (this.flag) {
			if (enabled) {
				this.placeFlag();
			} else {
				this.clearFlag();
			}
		}
	}

	/**
	 *
	 */
	public animateCorrect() {
		this.feedback.state.setAnimation(0, "correct", false);
	}

	/**
	 *
	 */
	public animateIncorrect() {
		this.feedback.state.setAnimation(0, "incorrect", false);
	}

	/**
	 *
	 */
	public explodeMine() {
		this.mine.state.setAnimation(0, "explode", false);
	}

	/**
	 *
	 */
	public placeFlagStart() {
		this.flag.state.setAnimation(0, "place-start", false);
		this.flag.visible = true;
	}

	/**
	 *
	 */
	public placeFlag() {
		this.flag.state.setAnimation(0, "place-confirm", false);
		this.flag.visible = true;
	}

	/**
	 *
	 */
	public clearFlagStart() {
		if (this.flag) {
			this.flag.state.setAnimation(0, "destroy-start", false);
		}
	}

	/**
	 *
	 */
	public clearFlag() {
		if (this.flag) {
			this.flag.state.setAnimation(0, "destroy", false);
			this.flag.state.addAnimation(0, "hidden", false, 0);
		}
	}
}
