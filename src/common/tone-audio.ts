import clamp from "lodash-es/clamp";
import * as Tone from "tone";
import * as PIXI from "pixi.js-legacy";
import { Dict } from "./types";
import { AppBase } from "./app-base";

const CENTER = "A2";

export interface PlayOptions {
	delay: number;
	offset: number;
	transpose: number;
	duration: number;
}

export const DEFAULT_PLAY_OPTIONS: PlayOptions = {
	delay: 0,
	offset: 0,
	transpose: 0,
	duration: 0,
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

		for (let i = 0; i < entries.length; i++) {
			const el = entries[i][1];

			if (!ToneAudio.buffers[el.url]) {
				ToneAudio.buffers[el.url] = new Tone.Buffer();
				try {
					await ToneAudio.buffers[el.url].load(el.url);
				} catch (err) {
					console.log("Error loading audio resource: ", err);
				}
			}
		}
	}

	/**
	 * Middleware handles async loading required for audio config JSON.
	 *
	 * @param resource - resource reference.
	 * @param next - Continue loader.
	 */
	public static async configLoader(this: PIXI.Loader, resource: PIXI.LoaderResource, next: () => any) {
		if (!resource.data || !resource.data.toneAudioConfig) {
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

	/**
	 *
	 */
	private samplers: Dict<Tone.Sampler> = {};

	/**
	 *
	 */
	private players: Dict<Tone.Player> = {};

	/**
	 *
	 */
	private sources: Dict<SourceEntry> = {};

	/**
	 *
	 */
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

		let delay = options.delay ?? 0;

		let transpose = options.transpose ?? 0;

		let duration = options.duration ?? source.duration;

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

		sampler.triggerAttackRelease(note, duration, time, 1);
	}
}
