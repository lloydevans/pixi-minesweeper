import clamp from "lodash-es/clamp";
import * as PIXI from "pixi.js-legacy";
import * as screenfull from "screenfull";
import { lerp } from "../maths/lerp";
import { ToneAudio } from "./tone-audio";
import { Tween } from "./tween";
import { TweenGroup } from "./tween-group";
import { TweenOptions } from "./tween-props";
import { UiElement } from "./ui-element";

export const MAX_DPR = 4;
export const MIN_DPR = 0.5;

export interface AppReferenceSize {
	width: number;
	height: number;
	blend: number;
}

/**
 * General purpose app functionality.
 */
export class AppBase extends PIXI.Application {
	/**
	 * Global event emitter.
	 *
	 * "init" () => void
	 *
	 * "ready" () => void
	 *
	 * "update" (dt: number) => void
	 *
	 * "resize" (width: number, height: number) => void
	 */
	public readonly events = new PIXI.utils.EventEmitter();

	/**
	 * App audio manager reference
	 */
	public readonly audio = new ToneAudio();

	/**
	 * Reference size of the app. If this is not defined, no root scaling is applied.
	 */
	public referenceSize?: AppReferenceSize;

	/**
	 * Current app ready state. Modified via setReady,
	 */
	public get ready() {
		return this._ready;
	}
	private _ready = false;

	/**
	 * Renderer pixel ratio. Use resizeRoot to modify.
	 */
	public get dpr() {
		return this._dpr;
	}
	private _dpr = 1;

	/**
	 * Renderer virtual width. Use resizeRoot to modify.
	 */
	public get width() {
		return this._width;
	}
	private _width = 0;

	/**
	 * Renderer virtual height. Use resizeRoot to modify.
	 */
	public get height() {
		return this._height;
	}
	private _height = 0;

	/**
	 * Global app tween group.
	 */
	protected readonly tweenGroup = new TweenGroup(false, 1);

	/**
	 * Root container.
	 */
	protected readonly root = new PIXI.Container();

	/**
	 * List of all UI elements currently added to app instance.
	 */
	protected readonly uiElements: UiElement[] = [];

	private initialized = false;

	/**
	 * Initialize the app
	 */
	public init() {
		if (!this.initialized) {
			this.initialized = true;
			this.stage.addChild(this.root);
			this.ticker.add(this.update, this);
			this.ticker.add(this.audio.update, this.audio);
			this.loader.use(ToneAudio.configLoader);
			this.events.emit("init");
		} else {
			throw new Error("App already initialized!");
		}
	}

	/**
	 * Update function callback for app ticker.
	 *
	 * @param dt - Delta time.
	 */
	private update(dt: number) {
		const currentDpr = this.getWindowDpr();

		if (
			window.innerWidth !== this.width || //
			window.innerHeight !== this.height ||
			this.dpr !== currentDpr
		) {
			this.resizeRoot(window.innerWidth, window.innerHeight, currentDpr);
		}

		this.events.emit("update", dt);
	}

	/**
	 *
	 * @param args
	 */
	public log(...args: any[]) {
		console.log(...args);
	}

	/**
	 *
	 */
	public tween<T>(target: T, options?: TweenOptions): Tween<T> {
		const tween = this.tweenGroup.get(target, options);
		return tween;
	}

	/**
	 *
	 */
	public delay(time: number) {
		return new Promise((resolve) => this.tween(this).wait(time).call(resolve));
	}

	/**
	 * This is a rough way for components to be able to wait until required resources
	 * are loaded before running initialization logic.
	 */
	public setReady() {
		if (!this.ready) {
			this._ready = true;
			this.events.emit("ready");
		}
	}

	/**
	 *
	 */
	public requestFullscreen(): Promise<void> {
		if (screenfull.isEnabled) {
			return screenfull.request(this.view);
		} else {
			return Promise.resolve();
		}
	}

	/**
	 *
	 */
	private getWindowDpr(): number {
		let dpr = clamp(window.devicePixelRatio, MIN_DPR, MAX_DPR);

		if (PIXI.utils.isMobile.amazon.device) {
			dpr = 1;
		}

		return dpr;
	}

	/**
	 *
	 */
	private getTextureDpr(): number {
		return this.getWindowDpr() | 0;
	}

	/**
	 *
	 */
	private resizeRoot(width: number, height: number, dpr: number) {
		this._width = width;
		this._height = height;
		this._dpr = dpr;

		this.view.style.width = this.width + "px";
		this.view.style.height = this.height + "px";
		this.renderer.resolution = this.dpr;
		this.renderer.plugins.interaction.resolution = this.dpr;
		this.renderer.resize(this.width, this.height);

		// Center root container but this could be made optional.
		this.root.x = this.renderer.width / this.dpr / 2;
		this.root.y = this.renderer.height / this.dpr / 2;

		if (this.referenceSize) {
			let refSize = lerp(this.referenceSize.width, this.referenceSize.height, this.referenceSize.blend);
			let refWindow = lerp(width, height, this.referenceSize.blend);
			let r = refSize / refWindow;
			this.root.scale.set(1 / r);
			this._width *= r;
			this._height *= r;
		}

		this.events.emit("resize", this.width, this.height);
	}

	/**
	 * Make a request. If it fails, wait for an amount of delayed retries.
	 *
	 * @param action - Action to perform.
	 * @param delay - Delay in seconds between retries.
	 * @param maxTries - Max tries before giving up.
	 */
	public async persistentRequest<T>(action: () => Promise<T>, delay = 1, maxTries = 10): Promise<T> {
		let tries = 0;
		let result;

		while (!result) {
			let error;

			try {
				result = await action();
			} catch (err) {
				error = err;
				await this.delay(delay * 1000);
			}

			tries++;

			if (error && tries > maxTries) {
				throw error;
			}
		}

		return result;
	}

	/**
	 *
	 * @param element
	 */
	public registerUiElement(element: UiElement) {
		if (this.uiElements.indexOf(element) !== -1) {
			throw new Error("Element already registered");
		}

		this.uiElements.push(element);
	}

	/**
	 *
	 * @param element
	 */
	public unregisterUiElement(element: UiElement) {
		const idx = this.uiElements.indexOf(element);
		if (idx === -1) {
			throw new Error("Element doesn't exist");
		}

		this.uiElements.splice(idx, 1);
	}

	/**
	 *
	 * @param element
	 */
	public blurAllUiElements() {
		for (let i = 0; i < this.uiElements.length; i++) {
			const el = this.uiElements[i];
			if (el.focused) {
				el.focused = false;
			}
		}
	}

	/**
	 *
	 * @param element
	 */
	public setAllUiElementsActive(active: boolean) {
		for (let i = 0; i < this.uiElements.length; i++) {
			const el = this.uiElements[i];
			el.active = active;
		}
	}

	/**
	 *
	 * @param atlasPath
	 */
	public getAtlas(atlasPath: string): PIXI.LoaderResource {
		const atlas = this.loader.resources[atlasPath];

		if (!atlas) {
			throw new Error(`Can't find atlas: "${atlasPath}"`);
		}
		if (!atlas.spritesheet) {
			throw new Error(`Not a valid atlas: "${atlasPath}"`);
		}

		return atlas;
	}

	/**
	 *
	 * @param atlasPath
	 * @param frameName
	 */
	public getFrame(atlasPath: string, frameName: string): PIXI.Texture {
		const atlas = this.getAtlas(atlasPath);

		if (!atlas.textures || !(atlas.textures[frameName] instanceof PIXI.Texture)) {
			throw new Error(`Can't find frame "${frameName}" in atlas "${atlasPath}"`);
		}

		return atlas.textures[frameName];
	}

	/**
	 *
	 * @param spinePath
	 */
	public getSpine(spinePath: string): PIXI.spine.core.SkeletonData {
		const spine = this.loader.resources[spinePath];

		if (!spine) {
			throw new Error(`Can't find spine: "${spinePath}"`);
		}
		if (!spine.spineData) {
			throw new Error(`Not a valid spine: "${spinePath}"`);
		}

		return spine.spineData;
	}

	/**
	 *
	 * @param spineName
	 */
	public getJson(name: string): unknown {
		const resource = this.loader.resources[name];

		if (!resource.data) {
			throw new Error(`Can't find json: "${name}"`);
		}

		return resource.data;
	}

	/**
	 * Add a spine asset to the loader.
	 *
	 * @param spinePath
	 * @param scale
	 */
	public addSpine(spinePath: string, scale: number = this.getTextureDpr()) {
		const metadata: PIXI.loaders.IMetadata = {
			spineSkeletonScale: 1 / MAX_DPR,
			spineAtlasFile: spinePath + "@" + scale + "x.atlas",
		};

		// Add spine asset with our own compensation scale.
		this.loader.add(spinePath, spinePath + ".skel", { metadata });
	}

	/**
	 * Add an atlas asset to the loader.
	 *
	 * @param atlasPath
	 * @param scale
	 */
	public addAtlas(atlasPath: string, scale: number = this.getTextureDpr()) {
		// Pixi auto detects and compensates scale based on suffix in form `@nx`.
		this.loader.add(atlasPath, atlasPath + "@" + scale + "x.json");
	}

	/**
	 * Add an atlas asset to the loader.
	 *
	 * @param assetPath
	 * @param scale
	 */
	public addBitmapFont(assetPath: string, scale: number = this.getTextureDpr()) {
		this.loader.add(assetPath, assetPath + "@" + scale + "x.fnt");
	}

	/**
	 * Add an JSON asset to the loader.
	 *
	 * @param jsonName
	 * @param scale
	 */
	public addJson(jsonName: string, url: string) {
		this.loader.add(jsonName, url);
	}
}
