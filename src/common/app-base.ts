import clamp from "lodash/clamp";
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
	 * @param atlasName
	 */
	public getAtlas(atlasName: string): PIXI.LoaderResource {
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
	public getFrame(atlasName: string, frameName: string): PIXI.Texture {
		let atlas = this.getAtlas(atlasName);

		if (!atlas.textures || !(atlas.textures[frameName] instanceof PIXI.Texture)) {
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
	public addSpine(spineName: string, scale: number = this.getAssetDpr()) {
		let metadata: PIXI.loaders.IMetadata = {
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
	public addAtlas(atlasName: string, scale: number = this.getAssetDpr()) {
		// Pixi auto detects and compensates scale based on suffix in form `@nx`.
		this.loader.add(atlasName, atlasName + "-0-@" + scale + "x.json");
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
