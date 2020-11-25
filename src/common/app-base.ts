import clamp from "lodash-es/clamp";
import * as PIXI from "pixi.js-legacy";
import * as screenfull from "screenfull";
import { lerp } from "../maths/lerp";
import { ToneAudio } from "./tone-audio";
import { Tween } from "./tween";
import { TweenGroup } from "./tween-group";
import { TweenProps } from "./tween-props";
import { UiElement } from "./ui-element";

export const MAX_DPR = 4;
export const MIN_DPR = 0.5;

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
	 *
	 */
	public readonly audio = new ToneAudio();

	/**
	 *
	 */
	public referenceSize?: {
		width: number;
		height: number;
		blend: number;
	};

	/**
	 * Current app ready state. Modified via setReady,
	 */
	public get ready() {
		return this._ready;
	}

	/**
	 * Renderer pixel ratio. Use resizeRoot to modify.
	 */
	public get dpr() {
		return this._dpr;
	}

	/**
	 * Renderer virtual width. Use resizeRoot to modify.
	 */
	public get width() {
		return this._width;
	}

	/**
	 * Renderer virtual height. Use resizeRoot to modify.
	 */
	public get height() {
		return this._height;
	}

	/**
	 * Global app tween group.
	 */
	protected readonly tweenGroup = new TweenGroup(false, 1);

	/**
	 * Root container.
	 */
	protected readonly root = new PIXI.Container();

	/**
	 *
	 */
	protected readonly uiElements: UiElement[] = [];

	private _dpr = 1;
	private _width = 0;
	private _height = 0;
	private _ready = false;

	/**
	 *
	 */
	public init() {
		this.stage.addChild(this.root);
		this.ticker.add(this.update, this);
		this.ticker.add(this.audio.update, this.audio);
		this.loader.use(ToneAudio.configLoader);
		this.events.emit("init");
	}

	/**
	 *
	 * @param dt
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
	 */
	public tween<T>(target: T, options?: TweenProps): Tween<T> {
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
	 * are loaded before running initiailisation logic.
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
	 * @param atlasName
	 * @param scale
	 */
	public addBitmapFont(assetPath: string, scale: number = this.getTextureDpr()) {
		this.loader.add(assetPath, assetPath + "@" + scale + "x.fnt");
	}

	/**
	 * Add an JSON asset to the loader.
	 *
	 * @param atlasName
	 * @param scale
	 */
	public addJson(jsonName: string, url: string) {
		this.loader.add(jsonName, url);
	}
}
