import { ResizeEventData } from "../common/app-base";
import { Component } from "../common/component";
import { MidiStartedEventData, NoteScheduledEventData } from "../common/tone-audio";
import { Dict } from "../common/types";
import { MinesweeperApp } from "./minesweeper-app";
import { NoteVisualizerTrack, NoteVisualizerTrackConfig } from "./note-visualizer-track";

const TRACK_CONFIGS: Dict<NoteVisualizerTrackConfig> = {
	["rimba"]: {
		instrumentFrameID: "instrument_rimba",
		instrumentImageTint: 0xffffff,
	},
	["steel"]: {
		instrumentFrameID: "instrument_steel",
		instrumentImageTint: 0xffffff,
	},
	["celeste"]: {
		instrumentFrameID: "instrument_chimes",
		instrumentImageTint: 0xffffff,
	},
	["timpani"]: {
		instrumentFrameID: "instrument_timpani",
		instrumentImageTint: 0xffffff,
	},
	["ahh"]: {
		instrumentFrameID: "instrument_ahh",
		instrumentImageTint: 0xffffff,
	},
	["violin-pizz"]: {
		instrumentFrameID: "instrument_pizz",
		instrumentImageTint: 0xffffff,
	},
	["guzheng"]: {
		instrumentFrameID: "instrument_guzheng",
		instrumentImageTint: 0xffffff,
	},
	["vibraphone"]: {
		instrumentFrameID: "instrument_vibraphone",
		instrumentImageTint: 0xffffff,
	},
	["kick"]: {
		instrumentFrameID: "instrument_kick",
		instrumentImageTint: 0xffffff,
	},
	["clap"]: {
		instrumentFrameID: "instrument_clap",
		instrumentImageTint: 0xffffff,
	},
	["snare"]: {
		instrumentFrameID: "instrument_snare",
		instrumentImageTint: 0xffffff,
	},
	["rim"]: {
		instrumentFrameID: "instrument_rim",
		instrumentImageTint: 0xffffff,
	},
	["hat"]: {
		instrumentFrameID: "intrument_hat",
		instrumentImageTint: 0xffffff,
	},
	["hat-open"]: {
		instrumentFrameID: "instrument_hatopen",
		instrumentImageTint: 0xffffff,
	},
	["boom"]: {
		instrumentFrameID: "instrument_boom",
		instrumentImageTint: 0xffffff,
	},
	["shaker"]: {
		instrumentFrameID: "instrument_shaker",
		instrumentImageTint: 0xffffff,
	},
	["dull"]: {
		instrumentFrameID: "instrument_dull",
		instrumentImageTint: 0xffffff,
	},
	["pitchy-drum"]: {
		instrumentFrameID: "instrument_pitchydrum",
		instrumentImageTint: 0xffffff,
	},
};

export class NoteVisualizer extends Component<MinesweeperApp> {
	private visualizerTracks: Dict<NoteVisualizerTrack> = {};

	protected init() {
		this.app.audio.onMidiStarted.on(this.handleMidiStarted, this);
		this.app.audio.onNoteScheduled.on(this.handleNoteScheduled, this);
	}

	protected resize({ width, height }: ResizeEventData = this.app) {
		const totalRowWidth = width * 0.9;
		const visualizerTracks = Object.entries(this.visualizerTracks);
		for (let i = 0; i < visualizerTracks.length; i++) {
			const track = visualizerTracks[i][1];
			const increment = totalRowWidth / visualizerTracks.length;
			const position = i * increment;
			track.x = -totalRowWidth / 2 + position + increment / 2;
			track.y = -height / 2 + 300;
		}
	}

	private handleMidiStarted({ midi }: MidiStartedEventData) {
		// Clear existing tracks if they exist.
		Object.values(this.visualizerTracks).forEach((el) => el.destroy());

		for (let i = 0; i < midi.tracks.length; i++) {
			const track = midi.tracks[i];

			if (!TRACK_CONFIGS[track.name]) {
				console.error(`Can't find note visualizer config for track ${track.name}`);
				continue;
			}

			const visualizerTrack = new NoteVisualizerTrack(this.app, TRACK_CONFIGS[track.name]);
			this.visualizerTracks[track.name] = visualizerTrack;

			this.addChild(visualizerTrack);
		}

		this.resize();
	}

	private handleNoteScheduled({ trackName, noteData, absoluteScheduledTime }: NoteScheduledEventData) {
		const visualizerTrack = this.visualizerTracks[trackName];

		if (visualizerTrack) {
			visualizerTrack.animateScheduledNote(absoluteScheduledTime, noteData);
		}
	}
}
