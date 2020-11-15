import { MidiMusicConfig } from "./common/tone-audio";
import midi from "../static/theme.json";

let volume = -19;

export const MIDI_CONFIG_THEME: MidiMusicConfig = {
	midi,
	tracks: [
		{
			trackName: "rimba",
			sampler: {
				urls: { A2: "rimba.m4a" },
				volume,
			},
		},
		{
			trackName: "drum-0",
			sampler: {
				urls: { A2: "drum-0.m4a" },
				volume,
			},
		},
		{
			trackName: "pitchy-drum",
			sampler: {
				urls: { A2: "pitchy-drum.m4a" },
				volume,
			},
		},
		{
			trackName: "shaker",
			sampler: {
				urls: { A2: "shaker.m4a" },
				volume,
			},
		},
		{
			trackName: "dull",
			sampler: {
				urls: { A2: "dull.m4a" },
				volume,
			},
		},
		{
			trackName: "steel",
			sampler: {
				urls: { A2: "steel.m4a" },
				volume,
			},
		},
		{
			trackName: "celeste",
			sampler: {
				urls: { A2: "celeste.m4a" },
				volume,
			},
		},
	],
};
