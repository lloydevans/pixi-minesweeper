import clamp from "lodash-es/clamp";
import * as PIXI from "pixi.js-legacy";
import * as screenfull from "screenfull";

export const MAX_DPR = 4;
export const MIN_DPR = 0.5;

/**
 * General purpose app functionality.
 */
export class AppBase extends PIXI.Application {
	public events = new PIXI.utils.EventEmitter();
	public width = 0;
	public height = 0;
	public dpr = 1;

	protected root = new PIXI.Container();

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
		return clamp(window.devicePixelRatio, MIN_DPR, MAX_DPR);
	}

	/**
	 *
	 */
	private getAssetDpr() {
		return Math.round(clamp(window.devicePixelRatio, 1, MAX_DPR));
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
		this.root.x = this.renderer.width / this.dpr / 2;
		this.root.y = this.renderer.height / this.dpr / 2;

		this.events.emit("resize", this.width, this.height);
	}

	/**
	 *
	 * @param atlasPath
	 */
	public getAtlas(atlasPath: string): PIXI.LoaderResource {
		let atlas = this.loader.resources[atlasPath];

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
		let atlas = this.getAtlas(atlasPath);

		if (!atlas.textures || !(atlas.textures[frameName] instanceof PIXI.Texture)) {
			throw new Error(`Can't find frame "${frameName}" in atlas "${atlasPath}"`);
		}

		return atlas.textures[frameName];
	}

	/**
	 *
	 * @param spinePath
	 */
	public getSpine(spinePath: string) {
		let spine = this.loader.resources[spinePath];

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
	public getJson(jsonPath: string) {
		let json = this.loader.resources[jsonPath];

		if (!json.data) {
			throw new Error(`Can't find json: "${jsonPath}"`);
		}

		return json.data;
	}

	/**
	 * Add a spine asset to the loader.
	 *
	 * @param spinePath
	 * @param scale
	 */
	public addSpine(spinePath: string, scale: number = this.getAssetDpr()) {
		let metadata: PIXI.loaders.IMetadata = {
			spineSkeletonScale: 1 / MAX_DPR,
			spineAtlasFile: spinePath + "@" + scale + "x.atlas"
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
	public addAtlas(atlasPath: string, scale: number = this.getAssetDpr()) {
		// Pixi auto detects and compensates scale based on suffix in form `@nx`.
		this.loader.add(atlasPath, atlasPath + "@" + scale + "x.json");
	}

	/**
	 * Add an atlas asset to the loader.
	 *
	 * @param atlasName
	 * @param scale
	 */
	public addBitmapFont(assetPath: string, scale: number = this.getAssetDpr()) {
		// Pixi auto detects and compensates scale based on suffix in form `@nx`.
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
