import { App } from "../app/app";
import { Entity } from "../entity/entity";

/** */
export class Scene {
	/** */
	public root: Entity;

	/** */
	protected app: App;

	/** */
	public constructor(app: App) {
		this.app = app;

		this.root = new Entity(app);
	}
}
