import * as Tone from "tone";
import { delay } from "./common/delay";

export interface MidiNote {
	name: string;
	duration: number;
	time: number;
	velocity: number;
}

export interface MidiMusicConfig {
	midi: MidiData;

	tracks: {
		trackName: string;
		sampler: {
			urls: { [key: string]: string };
			volume: number;
		};
	}[];
}

export interface MidiTrack {
	notes: MidiNote[];
}

export interface MidiData {
	tracks: MidiTrack[];
}

const DURATION = 122.879;
const MAX_QUEUE = 64;
const OVERLAP = 1;
const BUFFER = 3;

let playIdx = 0;

let isPlaying = false;

let samplers: Tone.Sampler[] = [];

/**
 * Quick MIDI music player with much help from ToneJS.
 *
 * This is very prototypey and randomly all in this async function for fun
 * but eventually I'll build this into a class which handles some cool midi based
 * music / sfx.
 *
 * @param config
 */
export async function playMidi(config: MidiMusicConfig) {
	// Temporary
	if (playIdx !== 0) return;

	// return;

	playIdx++;

	isPlaying = true;

	while (Tone.context.state !== "running") {
		await delay(500);
	}

	let tracks = config.midi.tracks.map((el) => [...el.notes]);

	let loops: number[] = config.midi.tracks.map((el) => 0);

	for (let i = 0; i < config.tracks.length; i++) {
		const el = config.tracks[i];
		let sampler = new Tone.Sampler(el.sampler).toDestination();
		samplers.push(sampler);
	}

	while (samplers.filter((el) => !el.loaded).length > 0) {
		await delay(500);
	}

	let start = Tone.now() + 0.5;

	while (isPlaying) {
		let now = Tone.now();

		let totalQueued = 0;

		for (let i = 0; i < config.tracks.length; i++) {
			//
			let sampler = samplers[i];

			while (tracks[i][0].time + start + DURATION * loops[i] < now + BUFFER) {
				let note = tracks[i].shift()!;

				// Loop note array.
				if (tracks[i].length === 0) {
					tracks[i] = tracks[i].concat(config.midi.tracks[i].notes);
					loops[i]++;
				}

				// Skip past notes.
				if (note.time + start + DURATION * loops[i] < now) {
					continue;
				}

				// Skip too many notes.
				if (totalQueued > MAX_QUEUE) {
					continue;
				}

				totalQueued++;

				let loopOffset = DURATION * loops[i];

				try {
					sampler.triggerAttackRelease(
						//
						note.name,
						note.duration,
						note.time + start + loopOffset,
						note.velocity
					);
				} catch (err) {
					console.log(err);
				}
			}
		}

		if (!isPlaying) {
			break;
		}

		await delay(BUFFER * 1000 - OVERLAP * 1000);
	}
}

export function stopMidi() {
	isPlaying = false;
}

let unlock = async () => {
	document.body.removeEventListener("click", unlock);
	document.body.removeEventListener("touchend", unlock);

	try {
		await Tone.start();
	} catch (err) {
		console.log(err);
	}
};
document.body.addEventListener("click", unlock);
document.body.addEventListener("touchend", unlock);
