import clamp from "lodash-es/clamp";
import isEqual from "lodash-es/isEqual";
import * as PIXI from "pixi.js";
import { hexToNum } from "./common/color";
import { Component } from "./common/component";
import { BmText } from "./common/bm-text";
import { Spine } from "./common/spine";
import { MSApp } from "./ms-app";
import { CELL_STATE_DEFAULT } from "./ms-cell-state";
import type { MSCellState } from "./ms-cell-state";
import type { NumberKey } from "./ms-config";

export const REF_WIDTH = 64;
export const REF_HEIGHT = 64;

enum AnimTrack {
	Cover,
	FillColor,
	Feedback,
	Mine,
	Flag,
	Hover,
	Dig,
	EdgeL,
	EdgeR,
	EdgeU,
	EdgeD,
}

export class MSCell extends Component<MSApp> {
	public get ix(): number {
		return this.viewState.x;
	}
	public get iy(): number {
		return this.viewState.y;
	}

	private anim: Spine;
	private state: MSCellState;
	private viewState: MSCellState;
	private adjacentText: BmText;

	constructor(app: MSApp) {
		super(app);

		this.state = { ...CELL_STATE_DEFAULT };
		this.viewState = { ...CELL_STATE_DEFAULT };

		this.anim = new Spine(this.app.getSpine("grid-square@1x"));
		this.anim.stateData.setMix("flag-hidden", "flag-place-start", 0);
		this.anim.stateData.setMix("flag-destroy", "flag-place-start", 0);
		this.anim.stateData.defaultMix = 0;

		this.adjacentText = new BmText(this.app, {
			text: "",
			fontName: "bmfont",
			fontSize: 38,
		});
		this.adjacentText.anchor.set(0.5);

		this.addChild(this.adjacentText);
		this.addChild(this.anim);

		this.hitArea = new PIXI.Rectangle(-REF_WIDTH / 2, -REF_HEIGHT / 2, REF_WIDTH, REF_HEIGHT);

		this.on("mouseover", this.animateHoverStart, this);
		this.on("mouseout", this.animateHoverEnd, this);
	}

	public setState(state: MSCellState) {
		this.state = state;

		// this.tabIndex = this.app.state.indexOf(this.ix, this.iy);
		// this.accessibleHint = `cell:${this.ix},${this.iy}`;

		this.reset();
		this.updateViewState();
		this.updateGridPosition();
		this.updateEdgeSprites();
		this.setInteractiveEnabled(true);
	}

	public reset() {
		// Clear tracks instead of hidden states?
		const coverType = (this.state.x + this.state.y) % 2 === 0 ? "even" : "odd";
		this.anim.state.setAnimation(AnimTrack.FillColor, "fill-" + coverType, false);
		this.anim.state.setAnimation(AnimTrack.Flag, "flag-hidden", false);
		this.anim.state.setAnimation(AnimTrack.Mine, "mine-hidden", false);
		this.anim.state.setAnimation(AnimTrack.Feedback, "feedback-hidden", false);
		this.anim.state.setAnimation(AnimTrack.Hover, "hover-hidden", false);
		this.anim.state.setAnimation(AnimTrack.Dig, "dig-hidden", false);
		this.anim.state.setAnimation(AnimTrack.EdgeL, "edge-l-hidden", false);
		this.anim.state.setAnimation(AnimTrack.EdgeR, "edge-r-hidden", false);
		this.anim.state.setAnimation(AnimTrack.EdgeU, "edge-u-hidden", false);
		this.anim.state.setAnimation(AnimTrack.EdgeD, "edge-d-hidden", false);
	}

	public setEdgeVisible(edge: "l" | "r" | "u" | "d", visible: boolean) {
		const stateName = "edge-" + edge + "-" + (visible ? "visible" : "hidden");
		const animTrackKey = ("Edge" + edge.toUpperCase()) as keyof typeof AnimTrack;
		this.anim.state.setAnimation(AnimTrack[animTrackKey], stateName, false);
	}

	public needsUpdate(): boolean {
		return !isEqual(this.state, this.viewState);
	}

	private updateGridPosition() {
		this.x = this.ix * REF_WIDTH + REF_WIDTH / 2;
		this.y = this.iy * REF_HEIGHT + REF_HEIGHT / 2;
	}

	public updateEdgeSprites() {
		this.anim.setSkinByName(this.viewState.covered ? "front" : "back");

		if (this.ix - 1 > -1) {
			const l = this.app.getCellView(this.ix - 1, this.iy);
			const visible = l.viewState.covered !== this.viewState.covered;
			this.setEdgeVisible("l", visible);
			l.setEdgeVisible("r", visible);
		} else {
			this.setEdgeVisible("l", true);
		}
		if (this.ix + 1 < this.app.state.width) {
			const r = this.app.getCellView(this.ix + 1, this.iy);
			const visible = r.viewState.covered !== this.viewState.covered;
			this.setEdgeVisible("r", visible);
			r.setEdgeVisible("l", visible);
		} else {
			this.setEdgeVisible("r", true);
		}
		if (this.iy - 1 > -1) {
			const u = this.app.getCellView(this.ix, this.iy - 1);
			const visible = u.viewState.covered !== this.viewState.covered;
			this.setEdgeVisible("u", visible);
			u.setEdgeVisible("d", visible);
		} else {
			this.setEdgeVisible("u", true);
		}
		if (this.iy + 1 < this.app.state.height) {
			const d = this.app.getCellView(this.ix, this.iy + 1);
			const visible = d.viewState.covered !== this.viewState.covered;
			this.setEdgeVisible("d", visible);
			d.setEdgeVisible("u", visible);
		} else {
			this.setEdgeVisible("d", true);
		}
	}

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

	private setText(total: number) {
		total = Math.floor(clamp(total, 0, 8));
		const key = total.toString() as NumberKey;
		this.adjacentText.tint = hexToNum(this.app.config.colorNumbers[key]);
		this.adjacentText.visible = true;
		this.adjacentText.text = key;
	}

	public setCoveredEnabled(enabled = true) {
		this.viewState.covered = enabled;
		if (enabled) {
			const stateName = this.app.state.config.cheatMode ? "covered-cheat" : "covered";
			this.anim.state.setAnimation(AnimTrack.Cover, stateName, false);
			this.setInteractiveEnabled(true);
		} else {
			this.anim.state.clearTrack(AnimTrack.FillColor);
			this.anim.state.setAnimation(AnimTrack.Cover, "covered-out", false);
			this.setInteractiveEnabled(false);
		}

		this.updateEdgeSprites();
	}

	public setInteractiveEnabled(enabled = true) {
		if (!enabled) {
			this.animateHoverEnd();
		}

		this.eventMode = enabled ? "static" : "none";
		// this.accessible = enabled;
	}

	public setMineEnabled(enabled = true) {
		this.viewState.mine = enabled;
		if (enabled) {
			this.anim.state.setAnimation(AnimTrack.Mine, "mine-explode", false);
		} else {
			this.anim.state.setAnimation(AnimTrack.Mine, "mine-hidden", false);
		}
	}

	public setFlagEnabled(enabled = true) {
		this.viewState.flag = enabled;

		if (enabled) {
			this.anim.state.setAnimation(AnimTrack.Flag, "flag-place-end", false);
		} else {
			this.anim.state.setAnimation(AnimTrack.Flag, "flag-destroy", false);
		}
	}

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

	public animatePress() {
		this.anim.state.setAnimation(AnimTrack.Hover, "hover-press", false);
	}

	public animateHoverStart() {
		this.anim.state.setAnimation(AnimTrack.Hover, "hover-over", false);
	}

	public animateHoverEnd() {
		this.anim.state.setAnimation(AnimTrack.Hover, "hover-out", false);
	}

	public animatePlaceFlagStart() {
		this.anim.state.setAnimation(AnimTrack.Flag, "flag-place-start", false);
	}

	public animateDigStart() {
		this.anim.state.setAnimation(AnimTrack.Dig, "dig-start", false);
	}

	public animateDigEnd() {
		this.anim.state.setAnimation(AnimTrack.Dig, "dig-end", false);
	}

	public animateDigCancel() {
		// getCurrent does seem to be there, just a type issue
		if ((this.anim.state as any).getCurrent(AnimTrack.Dig).animation.name === "dig-start") {
			this.anim.state.setAnimation(AnimTrack.Dig, "dig-cancel", false);
			this.app.audio.play("blop", { transpose: 24 });
			this.app.audio.play("drip", { delay: 0.1 });
			this.animateHoverEnd();
		}
	}

	public animatePlaceFlagCancel() {
		// getCurrent does seem to be there, just a type issue
		if ((this.anim.state as any).getCurrent(AnimTrack.Flag).animation.name === "flag-place-start") {
			this.anim.state.setAnimation(AnimTrack.Flag, "flag-destroy", false);
			this.app.audio.play("blop", { transpose: 24 });
			this.app.audio.play("drip", { delay: 0.1 });
			this.animateHoverEnd();
		}
	}

	public animateCorrect() {
		this.anim.state.setAnimation(AnimTrack.Feedback, "feedback-correct", false);
	}

	public animateIncorrect() {
		this.anim.state.setAnimation(AnimTrack.Feedback, "feedback-incorrect", false);
	}

	public explodeMine() {
		this.anim.state.setAnimation(AnimTrack.Mine, "mine-explode", false);
	}
}
