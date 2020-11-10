import isEqual from "lodash/isEqual";
import { Container, Rectangle, Sprite, Text, TextStyle } from "pixi.js-legacy";
import { GameText } from "./common/game-text";
import { Spine } from "./common/spine";
import { MSApp } from "./ms-app";
import { CELL_STATE_DEFAULT } from "./ms-cell-state";
import type { MSCellState } from "./ms-cell-state";
import type { NumberKey } from "./ms-config";
import { sounds } from "./ms-tone";

// Reference size of cell graphics before any scaling.
export const REF_WIDTH = 64;
export const REF_HEIGHT = 64;

enum AnimTrack {
	FillColor,
	Cover,
	Feedback,
	Mine,
	Flag,
	Hover,
	Dig
}

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
	public get needsUpdate(): boolean {
		return !isEqual(this.state, this.viewState);
	}
	private app: MSApp;
	private anim: Spine;
	private edges: {
		l: Sprite;
		r: Sprite;
		u: Sprite;
		d: Sprite;
	};
	private adjacentText: Text;
	private viewState: MSCellState;
	public state: MSCellState;

	/**
	 *
	 * @param app
	 * @param cell
	 * @param cellWidth
	 * @param cellHeight
	 */
	constructor(app: MSApp) {
		super();

		this.app = app;
		this.state = { ...CELL_STATE_DEFAULT };
		this.viewState = { ...CELL_STATE_DEFAULT };
		this.edges = {
			l: this.createEdgeSprite(0),
			r: this.createEdgeSprite(180),
			u: this.createEdgeSprite(90),
			d: this.createEdgeSprite(-90)
		};

		this.anim = new Spine(this.app.getSpine("grid-square"));
		this.anim.stateData.setMix("flag-hidden", "flag-place-start", 0);
		this.anim.stateData.setMix("flag-destroy", "flag-place-start", 0);
		this.anim.stateData.defaultMix = 0;

		let textStyle = new TextStyle({
			fontWeight: this.app.config.colorNumberWeight,
			fontSize: Math.floor(REF_WIDTH * 0.5)
		});
		this.adjacentText = new GameText(this.app, "", textStyle);
		this.adjacentText.anchor.set(0.5);

		this.addChild(this.adjacentText);
		this.addChild(this.anim);
		this.addChild(...Object.values(this.edges));

		this.hitArea = new Rectangle(-REF_WIDTH / 2, -REF_HEIGHT / 2, REF_WIDTH, REF_HEIGHT);

		this.on("mouseover", this.animateHoverStart, this);
		this.on("mouseout", this.animateHoverEnd, this);
	}

	/**
	 *
	 */
	public init(state: MSCellState) {
		this.state = state;

		// @ts-ignore // Missing type.
		this.tabIndex = this.app.state.indexOf(this.ix, this.iy);
		this.accessibleHint = `cell:${this.ix},${this.iy}`;
		this.reset();
		this.updateViewState();
		this.updateGridPosition();
		this.updateEdgeSprites();
		this.setInteractiveEnabled(true);
	}

	/**
	 *
	 */
	public reset() {
		let coverType = (this.state.x + this.state.y) % 2 === 0 ? "even" : "odd";
		this.anim.state.setAnimation(AnimTrack.FillColor, "fill-" + coverType, false);
		this.anim.state.setAnimation(AnimTrack.Flag, "flag-hidden", false);
		this.anim.state.setAnimation(AnimTrack.Mine, "mine-hidden", false);
		this.anim.state.setAnimation(AnimTrack.Feedback, "feedback-hidden", false);
		this.anim.state.setAnimation(AnimTrack.Hover, "hover-hidden", false);
		this.anim.state.setAnimation(AnimTrack.Dig, "dig-hidden", false);
	}

	/**
	 *
	 */
	private updateGridPosition() {
		this.x = this.ix * REF_WIDTH + REF_WIDTH / 2;
		this.y = this.iy * REF_HEIGHT + REF_HEIGHT / 2;
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
			let l = this.app.getCellView(this.ix - 1, this.iy);
			this.edges.l.visible = l.viewState.covered !== this.viewState.covered;
			l.edges.r.visible = l.viewState.covered !== this.viewState.covered;
		} else {
			this.edges.l.visible = true;
		}
		if (this.ix + 1 < this.app.state.width) {
			let r = this.app.getCellView(this.ix + 1, this.iy);
			this.edges.r.visible = r.viewState.covered !== this.viewState.covered;
			r.edges.l.visible = r.viewState.covered !== this.viewState.covered;
		} else {
			this.edges.r.visible = true;
		}
		if (this.iy - 1 > -1) {
			let u = this.app.getCellView(this.ix, this.iy - 1);
			this.edges.u.visible = u.viewState.covered !== this.viewState.covered;
			u.edges.d.visible = u.viewState.covered !== this.viewState.covered;
		} else {
			this.edges.u.visible = true;
		}
		if (this.iy + 1 < this.app.state.height) {
			let d = this.app.getCellView(this.ix, this.iy + 1);
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
	public updateViewState(state: MSCellState = this.state) {
		if (state.flag !== this.viewState.flag) {
			this.setFlagEnabled(state.flag);
		}

		if (state.mine !== this.viewState.mine) {
			this.setMineEnabled(state.mine);
		}

		if (state.covered !== this.viewState.covered) {
			this.setCoveredEnabled(state.covered);
			if (!state.covered) {
				this.animateDigEnd();
			}
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

		Object.assign(this.viewState, state);
	}

	/**
	 *
	 */
	public animateResult() {
		if (this.state.mine && this.state.flag) {
			this.animateCorrect();
		}

		if (this.state.mine && !this.state.flag) {
			this.setCoveredEnabled(false);
			this.animateIncorrect();
			this.explodeMine();
		}

		if (!this.state.mine && this.state.flag) {
			this.adjacentText.text = "";
			this.animateIncorrect();
		}
	}

	/**
	 *
	 */
	public animatePress() {
		this.anim.state.setAnimation(AnimTrack.Hover, "hover-press", false);
	}

	/**
	 *
	 */
	public animateHoverStart() {
		this.anim.state.setAnimation(AnimTrack.Hover, "hover-over", false);
	}

	/**
	 *
	 */
	public animateHoverEnd() {
		this.anim.state.setAnimation(AnimTrack.Hover, "hover-out", false);
	}

	/**
	 *
	 */
	public animatePlaceFlagStart() {
		this.anim.state.setAnimation(AnimTrack.Flag, "flag-place-start", false);
	}

	/**
	 *
	 */
	public animateDigStart() {
		this.anim.state.setAnimation(AnimTrack.Dig, "dig-start", false);
	}

	/**
	 *
	 */
	public animateDigEnd() {
		this.anim.state.setAnimation(AnimTrack.Dig, "dig-end", false);
	}

	/**
	 *
	 */
	public animateDigCancel() {
		if (this.anim.state.getCurrent(AnimTrack.Dig).animation.name === "dig-start") {
			this.anim.state.setAnimation(AnimTrack.Dig, "dig-cancel", false);
			this.animateHoverEnd();
			sounds.blop.playbackRate = 3;
			sounds.blop.start();
			sounds.drip.start();
		}
	}

	/**
	 *
	 */
	public animatePlaceFlagCancel() {
		if (this.anim.state.getCurrent(AnimTrack.Flag).animation.name === "flag-place-start") {
			this.anim.state.setAnimation(AnimTrack.Flag, "flag-destroy", false);
			this.animateHoverEnd();
			sounds.blop.playbackRate = 3;
			sounds.blop.start();
			sounds.drip.start();
		}
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
			let stateName = this.app.state.config.cheatMode ? "covered-cheat" : "covered";
			this.anim.state.setAnimation(AnimTrack.Cover, stateName, false);
			this.setInteractiveEnabled(true);
		} else {
			this.anim.state.setAnimation(AnimTrack.Cover, "covered-out", false);
			this.setInteractiveEnabled(false);
		}

		this.updateEdgeSprites();
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
		if (enabled) {
			this.anim.state.setAnimation(AnimTrack.Mine, "mine-explode", false);
		} else {
			this.anim.state.setAnimation(AnimTrack.Mine, "mine-hidden", false);
		}
	}

	/**
	 *
	 */
	public setFlagEnabled(enabled = true) {
		this.viewState.flag = enabled;

		if (enabled) {
			this.anim.state.setAnimation(AnimTrack.Flag, "flag-place-end", false);
		} else {
			this.anim.state.setAnimation(AnimTrack.Flag, "flag-destroy", false);
		}
	}

	/**
	 *
	 */
	public animateCorrect() {
		this.anim.state.setAnimation(AnimTrack.Feedback, "feedback-correct", false);
	}

	/**
	 *
	 */
	public animateIncorrect() {
		this.anim.state.setAnimation(AnimTrack.Feedback, "feedback-incorrect", false);
	}

	/**
	 *
	 */
	public explodeMine() {
		this.anim.state.setAnimation(AnimTrack.Mine, "mine-explode", false);
	}
}
