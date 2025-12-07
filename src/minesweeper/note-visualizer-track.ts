import * as PIXI from "pixi.js";
import { Component } from "../common/component";
import { MinesweeperApp } from "./minesweeper-app";
import { NoteJSON } from "../common/tone-audio";
import { Ease } from "../common/ease";
import { BmText } from "../common/bm-text";

const NOTE_PIP_POOL_SIZE = 20;
const INSTRUMENT_IMAGE_SIZE = 64;

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
		this.instrumentImage.width = INSTRUMENT_IMAGE_SIZE;
		this.instrumentImage.height = INSTRUMENT_IMAGE_SIZE;
		this.addChild(this.instrumentImage);
	}

	public animateScheduledNote(absoluteScheduledTime: number, noteData: NoteJSON): void {
		const notePip = this.getNextNotePip();

		notePip.text = noteData.name;

		const timeUntilNote = absoluteScheduledTime - this.app.audio.now();

		notePip.y = 2000;
		notePip.scale.set(0.25 + noteData.velocity * 0.75);
		notePip.visible = true;
		notePip.alpha = 0;

		this.tween(notePip)
			.to({ x: 0, y: 0, alpha: 1 }, timeUntilNote * 1000, Ease.linear)
			.call(() => {
				notePip.visible = false;
				this.animateNoteLands();
			});
	}

	private getNextNotePip() {
		const notePip = this.notePipPool[this.notePipIndex];
		this.notePipIndex = (this.notePipIndex + 1) % this.notePipPool.length;
		return notePip;
	}

	private animateNoteLands() {
		this.instrumentImage.width = INSTRUMENT_IMAGE_SIZE + 16;
		this.instrumentImage.height = INSTRUMENT_IMAGE_SIZE + 16;

		this.tween(this.instrumentImage).to(
			{ width: INSTRUMENT_IMAGE_SIZE, height: INSTRUMENT_IMAGE_SIZE },
			500,
			Ease.elasticOut,
		);
	}
}
