import clamp from "lodash-es/clamp";
import defaults from "lodash-es/defaults";
import * as PIXI from "pixi.js-legacy";
import * as Tone from "tone";
import { Dict } from "./types";
import { Midi } from "@tonejs/midi";

const CENTER = "A3";
const MAX_QUEUE = 64;
const BUFFER = 3;

export interface NoteJSON {
	time: number;
	midi: number;
	name: string;
	velocity: number;
	duration: number;
	ticks: number;
	durationTicks: number;
}

export interface PlayOptions {
	type: "attack-release" | "attack" | "release";
	delay: number;
	transpose: number;
	duration: number;
	volume: number;
}

export const DEFAULT_PLAY_OPTIONS: PlayOptions = {
	type: "attack-release",
	delay: 0,
	transpose: 0,
	duration: 0,
	volume: 1,
};

export interface SourceConfig {
	name: string;
	url: string;
	volume?: number;
}

export interface SourceEntry extends SourceConfig {
	duration: number;
}

export interface ToneAudioConfig {
	masterVolume?: number;
	sources: Dict<SourceConfig>;
}

export interface MidiPlaybackData {
	tracks: ReadonlyArray<MidiPlaybackTrackData>;
	duration: number;
	start: number;
}

export interface MidiPlaybackTrackData {
	name: string;
	notes: NoteJSON[];
	original: NoteJSON[];
	loops: number;
}

/**
 *
 */
export class ToneAudio {
	private static buffers: Dict<Tone.ToneAudioBuffer> = {};

	/**
	 *
	 * @param config
	 */
	private static async loadBuffers(config: ToneAudioConfig) {
		let entries = Object.entries(config.sources);

		let requests = [];

		try {
			for (let i = 0; i < entries.length; i++) {
				const el = entries[i][1];

				if (!ToneAudio.buffers[el.url]) {
					ToneAudio.buffers[el.url] = new Tone.Buffer();
					requests.push(ToneAudio.buffers[el.url].load(el.url));
				}
			}

			await Promise.all(requests);
		} catch (err) {
			console.log(err);
		}
	}

	/**
	 * Middleware handles async loading required for audio config JSON.
	 *
	 * @param resource - resource reference.
	 * @param next - Continue loader.
	 */
	public static async configLoader(this: PIXI.Loader, resource: PIXI.LoaderResource, next: () => any) {
		if (!resource.data?.toneAudioConfig) {
			return next();
		}

		let config = resource.data as ToneAudioConfig;

		await ToneAudio.loadBuffers(config);

		next();
	}

	/**
	 *
	 * @param semitones
	 */
	public static semitoneToRate(semitones: number): number {
		return Math.exp((semitones * Math.log(2)) / 12);
	}

	private samplers: Dict<Tone.Sampler> = {};
	private players: Dict<Tone.Player> = {};
	private sources: Dict<SourceEntry> = {};
	private currentMidiPlayback?: MidiPlaybackData;
	private currentMidiData?: Midi;
	private config!: ToneAudioConfig;

	/**
	 * Set current
	 */
	public async init(config: ToneAudioConfig) {
		if (this.config) {
			throw new Error("Already initialized");
		}

		this.config = config;

		await ToneAudio.loadBuffers(config);

		this.initInstruments(config);
	}

	/**
	 *
	 */
	public update() {
		if (Tone.context.state !== "running") {
			return;
		}

		if (this.currentMidiPlayback) {
			this.updateMusic(this.currentMidiPlayback);
		}
	}

	/**
	 *
	 */
	private initPlayers(options: ToneAudioConfig) {
		let sources = Object.entries(options.sources);

		for (let i = 0; i < sources.length; i++) {
			const entry = sources[i];
			let key = entry[0];
			let el = entry[1];
			let buffer = ToneAudio.buffers[el.url];
			let player = new Tone.Player(buffer).toDestination();

			let duration = player.buffer.duration;

			this.sources[key] = { ...el, ...{ duration } };

			this.players[key] = player;
		}
	}

	/**
	 *
	 */
	private initInstruments(options: ToneAudioConfig) {
		let sources = Object.entries(options.sources);

		for (let i = 0; i < sources.length; i++) {
			const entry = sources[i];
			let key = entry[0];
			let el = entry[1];

			let buffer = ToneAudio.buffers[el.url];

			let duration = buffer.duration;

			this.sources[key] = { ...el, ...{ duration } };

			let sampler = new Tone.Sampler({
				urls: { [CENTER]: buffer },
				volume: el.volume ?? 0,
			}).toDestination();

			this.samplers[key] = sampler;
		}
	}

	/**
	 *
	 * @param name
	 */
	public play(name: string, options: Partial<PlayOptions> = {}) {
		let source = this.sources[name];

		if (!source) {
			throw new Error(`Can't find sound with name "${name}"`);
		}

		options.duration = options.duration ?? source.duration;

		let { type, delay, transpose, volume, duration } = defaults(options, DEFAULT_PLAY_OPTIONS);

		let sampler = this.samplers[name];

		let note = CENTER;

		let time = Tone.now();

		if (transpose > 0) {
			options.transpose = clamp(transpose, -48, 48);
			note = Tone.Midi(note).transpose(options.transpose).toNote();
		}

		if (delay > 0) {
			time += delay;
		}

		switch (type) {
			case "attack":
				sampler.triggerAttack(note, time, volume);
				break;

			case "release":
				sampler.triggerRelease(note, time);
				break;

			case "attack-release":
				sampler.triggerAttackRelease(note, duration, time, volume);
				break;
		}
	}

	/**
	 *
	 * @param config
	 */
	public async playMidi(midiUrl: string) {
		if (this.currentMidiData) {
			return;
		}

		let midi = await Midi.fromUrl(midiUrl);

		this.currentMidiData = midi;

		this.currentMidiPlayback = {
			duration: midi.duration,
			start: Tone.now() + 0.5,
			tracks: midi.tracks.map((el) => {
				return {
					name: el.name,
					original: [...el.notes],
					notes: [...el.notes],
					loops: 0,
				};
			}),
		};
	}

	/**
	 *
	 */
	private updateMusic(midi: MidiPlaybackData) {
		let { tracks, start, duration } = midi;

		let now = Tone.now();

		for (let i = 0; i < tracks.length; i++) {
			let track = tracks[i];

			let totalQueued = 0;

			let sampler = this.samplers[track.name];

			if (track.notes.length === 0) continue;

			while (track.notes[0].time + start + duration * track.loops < now + BUFFER) {
				let note = track.notes.shift()!;

				// Loop note array.
				if (track.notes.length === 0) {
					track.notes = track.notes.concat(track.original);
					track.loops++;
				}

				// Skip past notes.
				if (note.time + start + duration * track.loops < now) {
					continue;
				}

				// Skip too many notes.
				if (totalQueued > MAX_QUEUE) {
					continue;
				}

				totalQueued++;

				let loopOffset = duration * track.loops;

				try {
					sampler.triggerAttackRelease(
						//
						note.name,
						note.duration,
						note.time + start + loopOffset,
						note.velocity * 0.333 // TODO: config
					);
				} catch (err) {
					console.log(err);
				}
			}
		}
	}
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
