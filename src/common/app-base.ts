import { Application, Container, LoaderResource, loaders, Texture, utils } from "pixi.js-legacy";
import * as screenfull from "screenfull";

/**
 * Max selectable device pixel ratio.
 */
export const MAX_DPR = 4;

/**
 * General purpose app functionality.
 */
export class AppBase extends Application {
	public dpr: number = 1;
	public width: number = 0;
	public height: number = 0;
	public root: Container = new Container();
	public events: utils.EventEmitter = new utils.EventEmitter();

	/**
	 *
	 */
	public init() {
		this.stage.addChild(this.root);
		this.ticker.add(this.update, this);
		this.resizeRoot(window.innerWidth, window.innerHeight, this.getWindowDpr());
		this.events.emit("init");
	}

	/**
	 *
	 * @param dt
	 */
	private update(dt: number) {
		let currentDpr = this.getWindowDpr();

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
	public async requestFullscreen(): Promise<void> {
		if (screenfull.isEnabled) {
			return screenfull.request(this.view);
		}
	}

	/**
	 *
	 */
	private getWindowDpr() {
		return Math.round(Math.min(window.devicePixelRatio, MAX_DPR));
	}

	/**
	 *
	 */
	private resizeRoot(width: number, height: number, dpr: number) {
		this.width = width;
		this.height = height;
		this.dpr = dpr;

		this.view.style.width = this.width + "px";
		this.view.style.height = this.height + "px";
		this.renderer.resolution = this.dpr;
		this.renderer.plugins.interaction.resolution = this.dpr;
		this.renderer.resize(this.width, this.height);

		// Center root container but this could be made optional.
		this.root.x = (this.renderer.width * (1 / this.dpr)) / 2;
		this.root.y = (this.renderer.height * (1 / this.dpr)) / 2;

		this.events.emit("resize", this.width, this.height);
	}

	/**
	 *
	 * @param atlasName
	 */
	public getAtlas(atlasName: string): LoaderResource {
		let atlas = this.loader.resources[atlasName];

		if (!atlas) {
			throw new Error(`Can't find atlas: "${atlasName}"`);
		}
		if (!atlas.spritesheet) {
			throw new Error(`Not a valid atlas: "${atlasName}"`);
		}

		return atlas;
	}

	/**
	 *
	 * @param atlasName
	 * @param frameName
	 */
	public getFrame(atlasName: string, frameName: string): Texture {
		let atlas = this.getAtlas(atlasName);

		if (!atlas.textures || !(atlas.textures[frameName] instanceof Texture)) {
			throw new Error(`Can't find frame "${frameName}" in atlas "${atlasName}"`);
		}

		return atlas.textures[frameName];
	}

	/**
	 *
	 * @param spineName
	 */
	public getSpine(spineName: string) {
		let spine = this.loader.resources[spineName];

		if (!spine) {
			throw new Error(`Can't find spine: "${spineName}"`);
		}
		if (!spine.spineData) {
			throw new Error(`Not a valid spine: "${spineName}"`);
		}

		return spine.spineData;
	}

	/**
	 *
	 * @param spineName
	 */
	public getJson(jsonName: string) {
		let json = this.loader.resources[jsonName];

		if (!json.data) {
			throw new Error(`Can't find json: "${jsonName}"`);
		}

		return json.data;
	}

	/**
	 * Add a spine asset to the loader.
	 *
	 * @param spineName
	 * @param scale
	 */
	public addSpine(spineName: string, scale: number = this.dpr) {
		let metadata: loaders.IMetadata = {
			spineSkeletonScale: 1 / MAX_DPR,
			spineAtlasFile: spineName + "@" + scale + "x.atlas"
		};

		// Add spine asset with our own compensation scale.
		this.loader.add(spineName, spineName + ".skel", { metadata });
	}

	/**
	 * Add an atlas asset to the loader.
	 *
	 * @param atlasName
	 * @param scale
	 */
	public addAtlas(atlasName: string, scale: number = this.dpr) {
		// Pixi auto detects and compensates scale based on suffix in form `@nx`.
		this.loader.add(atlasName, atlasName + "-0-@" + scale + "x.json");
	}

	/**
	 * Add an JSON asset to the loader.
	 *
	 * @param atlasName
	 * @param scale
	 */
	public addJson(name: string, url: string) {
		this.loader.add(name, url);
	}
}
