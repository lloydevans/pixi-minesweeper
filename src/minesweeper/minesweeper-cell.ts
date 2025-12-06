import clamp from "lodash-es/clamp";
import isEqual from "lodash-es/isEqual";
import * as PIXI from "pixi.js";
import { hexToNum } from "../common/color";
import { Component } from "../common/component";
import { BmText } from "../common/bm-text";
import { Spine } from "../common/spine";
import { MinesweeperApp } from "./minesweeper-app";
import { CELL_STATE_DEFAULT } from "./minesweeper-cell-state";
import type { MinesweeperCellState } from "./minesweeper-cell-state";
import type { NumberKey } from "./minesweeper-config";

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

enum AnimState {
	// Flag states
	FlagHidden = "flag-hidden",
	FlagPlaceStart = "flag-place-start",
	FlagPlaceEnd = "flag-place-end",
	FlagDestroy = "flag-destroy",

	// Mine states
	MineHidden = "mine-hidden",
	MineExplode = "mine-explode",

	// Feedback states
	FeedbackHidden = "feedback-hidden",
	FeedbackCorrect = "feedback-correct",
	FeedbackIncorrect = "feedback-incorrect",

	// Hover states
	HoverHidden = "hover-hidden",
	HoverOver = "hover-over",
	HoverOut = "hover-out",
	HoverPress = "hover-press",

	// Dig states
	DigHidden = "dig-hidden",
	DigStart = "dig-start",
	DigEnd = "dig-end",
	DigCancel = "dig-cancel",

	// Edge states
	EdgeLHidden = "edge-l-hidden",
	EdgeLVisible = "edge-l-visible",
	EdgeRHidden = "edge-r-hidden",
	EdgeRVisible = "edge-r-visible",
	EdgeUHidden = "edge-u-hidden",
	EdgeUVisible = "edge-u-visible",
	EdgeDHidden = "edge-d-hidden",
	EdgeDVisible = "edge-d-visible",

	// Fill states
	FillEven = "fill-even",
	FillOdd = "fill-odd",

	// Cover states
	Covered = "covered",
	CoveredCheat = "covered-cheat",
	CoveredOut = "covered-out",
}

enum SkinName {
	Front = "front",
	Back = "back",
}

type EdgeID = "l" | "r" | "u" | "d";

export const REF_WIDTH = 64;
export const REF_HEIGHT = 64;

const EDGE_STATES_HIDDEN = {
	l: AnimState.EdgeLHidden,
	r: AnimState.EdgeRHidden,
	u: AnimState.EdgeUHidden,
	d: AnimState.EdgeDHidden,
};

const EDGE_STATES_VISIBLE = {
	l: AnimState.EdgeLVisible,
	r: AnimState.EdgeRVisible,
	u: AnimState.EdgeUVisible,
	d: AnimState.EdgeDVisible,
};

export class MinesweeperCell extends Component<MinesweeperApp> {
	public get ix(): number {
		return this.viewState.x;
	}
	public get iy(): number {
		return this.viewState.y;
	}

	private animation: Spine;
	private state: MinesweeperCellState;
	private viewState: MinesweeperCellState;
	private adjacentMineCounterText: BmText;

	constructor(app: MinesweeperApp) {
		super(app);

		this.state = { ...CELL_STATE_DEFAULT };
		this.viewState = { ...CELL_STATE_DEFAULT };

		this.animation = new Spine(this.app.getSpine("grid-square@1x"));
		this.animation.stateData.setMix(AnimState.FlagHidden, AnimState.FlagPlaceStart, 0);
		this.animation.stateData.setMix(AnimState.FlagDestroy, AnimState.FlagPlaceStart, 0);
		this.animation.stateData.defaultMix = 0;

		this.adjacentMineCounterText = new BmText(this.app, { fontName: "bmfont", fontSize: 38 });
		this.adjacentMineCounterText.anchor.set(0.5);

		this.addChild(this.adjacentMineCounterText);
		this.addChild(this.animation);

		this.hitArea = new PIXI.Rectangle(-REF_WIDTH / 2, -REF_HEIGHT / 2, REF_WIDTH, REF_HEIGHT);

		this.on("mouseover", this.animateHoverStart, this);
		this.on("mouseout", this.animateHoverEnd, this);
	}

	public setState(state: MinesweeperCellState) {
		this.state = state;

		this.reset();
		this.updateViewState();
		this.updateGridPosition();
		this.updateEdgeSprites();
		this.setInteractiveEnabled(true);
	}

	public reset() {
		// Clear tracks instead of hidden states?
		const fillState = (this.state.x + this.state.y) % 2 === 0 ? AnimState.FillEven : AnimState.FillOdd;
		this.animation.state.setAnimation(AnimTrack.FillColor, fillState, false);
		this.animation.state.setAnimation(AnimTrack.Flag, AnimState.FlagHidden, false);
		this.animation.state.setAnimation(AnimTrack.Mine, AnimState.MineHidden, false);
		this.animation.state.setAnimation(AnimTrack.Feedback, AnimState.FeedbackHidden, false);
		this.animation.state.setAnimation(AnimTrack.Hover, AnimState.HoverHidden, false);
		this.animation.state.setAnimation(AnimTrack.Dig, AnimState.DigHidden, false);
		this.animation.state.setAnimation(AnimTrack.EdgeL, AnimState.EdgeLHidden, false);
		this.animation.state.setAnimation(AnimTrack.EdgeR, AnimState.EdgeRHidden, false);
		this.animation.state.setAnimation(AnimTrack.EdgeU, AnimState.EdgeUHidden, false);
		this.animation.state.setAnimation(AnimTrack.EdgeD, AnimState.EdgeDHidden, false);
	}

	public setEdgeVisible(edge: EdgeID, visible: boolean) {
		const edgeStateMap = visible ? EDGE_STATES_VISIBLE : EDGE_STATES_HIDDEN;
		const animTrackKey = ("Edge" + edge.toUpperCase()) as keyof typeof AnimTrack;
		this.animation.state.setAnimation(AnimTrack[animTrackKey], edgeStateMap[edge], false);
	}

	public needsUpdate(): boolean {
		return !isEqual(this.state, this.viewState);
	}

	private updateGridPosition() {
		this.x = this.ix * REF_WIDTH + REF_WIDTH / 2;
		this.y = this.iy * REF_HEIGHT + REF_HEIGHT / 2;
	}

	public updateEdgeSprites() {
		this.animation.setSkinByName(this.viewState.covered ? SkinName.Front : SkinName.Back);

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

	public updateViewState(state: MinesweeperCellState = this.state) {
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
			this.adjacentMineCounterText.visible = false;
		}

		if (this.viewState.x !== state.x || this.viewState.y !== state.y) {
			this.updateGridPosition();
		}

		Object.assign(this.viewState, state);
	}

	private setText(total: number) {
		total = Math.floor(clamp(total, 0, 8));
		const key = total.toString() as NumberKey;
		this.adjacentMineCounterText.tint = hexToNum(this.app.config.colorNumbers[key]);
		this.adjacentMineCounterText.visible = true;
		this.adjacentMineCounterText.text = key;
	}

	public setCoveredEnabled(enabled = true) {
		this.viewState.covered = enabled;
		if (enabled) {
			const coverState = this.app.state.config.cheatMode ? AnimState.CoveredCheat : AnimState.Covered;
			this.animation.state.setAnimation(AnimTrack.Cover, coverState, false);
			this.setInteractiveEnabled(true);
		} else {
			this.animation.state.clearTrack(AnimTrack.FillColor);
			this.animation.state.setAnimation(AnimTrack.Cover, AnimState.CoveredOut, false);
			this.setInteractiveEnabled(false);
		}

		this.updateEdgeSprites();
	}

	public setInteractiveEnabled(enabled = true) {
		if (!enabled) {
			this.animateHoverEnd();
		}

		this.eventMode = enabled ? "static" : "none";
	}

	public setMineEnabled(enabled = true) {
		this.viewState.mine = enabled;
		if (enabled) {
			this.animation.state.setAnimation(AnimTrack.Mine, AnimState.MineExplode, false);
		} else {
			this.animation.state.setAnimation(AnimTrack.Mine, AnimState.MineHidden, false);
		}
	}

	public setFlagEnabled(enabled = true) {
		this.viewState.flag = enabled;

		if (enabled) {
			this.animation.state.setAnimation(AnimTrack.Flag, AnimState.FlagPlaceEnd, false);
		} else {
			this.animation.state.setAnimation(AnimTrack.Flag, AnimState.FlagDestroy, false);
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
			this.adjacentMineCounterText.text = "";
			this.animateIncorrect();
		}
	}

	public animatePress() {
		this.animation.state.setAnimation(AnimTrack.Hover, AnimState.HoverPress, false);
	}

	public animateHoverStart() {
		this.animation.state.setAnimation(AnimTrack.Hover, AnimState.HoverOver, false);
	}

	public animateHoverEnd() {
		this.animation.state.setAnimation(AnimTrack.Hover, AnimState.HoverOut, false);
	}

	public animatePlaceFlagStart() {
		this.animation.state.setAnimation(AnimTrack.Flag, AnimState.FlagPlaceStart, false);
	}

	public animateDigStart() {
		this.animation.state.setAnimation(AnimTrack.Dig, AnimState.DigStart, false);
	}

	public animateDigEnd() {
		this.animation.state.setAnimation(AnimTrack.Dig, AnimState.DigEnd, false);
	}

	public animateDigCancel() {
		// getCurrent does seem to be there, just a type issue
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		if ((this.animation.state as any).getCurrent(AnimTrack.Dig).animation.name === AnimState.DigStart) {
			this.animation.state.setAnimation(AnimTrack.Dig, AnimState.DigCancel, false);
			this.app.audio.play("blop", { transpose: 24 });
			this.app.audio.play("drip", { delay: 0.1 });
			this.animateHoverEnd();
		}
	}

	public animatePlaceFlagCancel() {
		// getCurrent does seem to be there, just a type issue
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		if ((this.animation.state as any).getCurrent(AnimTrack.Flag).animation.name === AnimState.FlagPlaceStart) {
			this.animation.state.setAnimation(AnimTrack.Flag, AnimState.FlagDestroy, false);
			this.app.audio.play("blop", { transpose: 24 });
			this.app.audio.play("drip", { delay: 0.1 });
			this.animateHoverEnd();
		}
	}

	public animateCorrect() {
		this.animation.state.setAnimation(AnimTrack.Feedback, AnimState.FeedbackCorrect, false);
	}

	public animateIncorrect() {
		this.animation.state.setAnimation(AnimTrack.Feedback, AnimState.FeedbackIncorrect, false);
	}

	public explodeMine() {
		this.animation.state.setAnimation(AnimTrack.Mine, AnimState.MineExplode, false);
	}
}
