import * as PIXI from "pixi.js";
import { Component } from "../common/component";
import { MinesweeperApp } from "./minesweeper-app";
import { NoteJSON } from "../common/tone-audio";
import { Ease } from "../common/ease";
import { BmText } from "../common/bm-text";
import { velocityToColor } from "../common/color";
import { Tween } from "../common/tween";

const NOTE_PIP_POOL_SIZE = 20;
const INSTRUMENT_IMAGE_SCALE = 0.5;

export interface NoteVisualizerTrackConfig {
	instrumentFrameID: string;
	instrumentImageTint: number;
}

export class NoteVisualizerTrack extends Component<MinesweeperApp> {
	private instrumentImage = new PIXI.Sprite(PIXI.Texture.WHITE);

	private notePipPool = new Array(NOTE_PIP_POOL_SIZE).fill(null).map(() => {
		const notePip = new BmText(this.app, {
			style: {
				fontFamily: "bmfont",
				fontSize: 32,
			},
		});
		notePip.anchor.set(0.5);
		this.addChild(notePip);
		return notePip;
	});

	private notePipIndex = 0;

	constructor(
		app: MinesweeperApp,
		private readonly config: NoteVisualizerTrackConfig,
	) {
		super(app);

		this.instrumentImage.anchor.set(0.5);
		this.instrumentImage.texture = this.app.getFrame("textures", this.config.instrumentFrameID);
		this.instrumentImage.tint = this.config.instrumentImageTint;
	}

	protected init() {
		this.instrumentImage.scale.set(INSTRUMENT_IMAGE_SCALE);
		this.addChild(this.instrumentImage);
	}

	public animateScheduledNote(absoluteScheduledTime: number, noteData: NoteJSON): void {
		const notePip = this.getNextNotePip();

		notePip.text = noteData.name;

		const timeUntilNote = absoluteScheduledTime - this.app.audio.now();

		const velocityColor = velocityToColor(noteData.velocity);

		notePip.y = 2000;
		notePip.tint = velocityColor;
		notePip.scale.set(0.25 + noteData.velocity * 0.75);
		notePip.visible = true;
		notePip.alpha = 0;

		this.tween(notePip)
			.to({ x: 0, y: 0, alpha: 1 }, timeUntilNote * 1000, Ease.linear)
			.call(() => {
				notePip.visible = false;
				this.animateNoteLands(velocityColor, noteData.duration);
			});
	}

	private getNextNotePip() {
		const notePip = this.notePipPool[this.notePipIndex];
		this.notePipIndex = (this.notePipIndex + 1) % this.notePipPool.length;
		return notePip;
	}

	private animateNoteLands(velocityColor: number, noteDuration: number) {
		this.instrumentImage.tint = velocityColor;

		const tweenDuration = Math.max(noteDuration * 1000, 500);

		this.tween(this.instrumentImage.scale)
			.to({ x: 0.6, y: 0.6 }, 100, Ease.circOut)
			.to({ x: INSTRUMENT_IMAGE_SCALE, y: INSTRUMENT_IMAGE_SCALE }, tweenDuration - 100, Ease.elasticOut);

		Tween.removeTweens(this.instrumentImage);
		this.tween(this.instrumentImage)
			.wait(tweenDuration)
			.call(() => (this.instrumentImage.tint = 0xffffff));
	}
}
