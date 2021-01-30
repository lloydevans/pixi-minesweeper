import { Entity } from "../entity/entity";
import { App } from "../app/app";

export class Scene {
	public root: Entity;
	protected app: App;

	constructor(app: App) {
		this.app = app;
		this.root = new Entity(app);
	}
}
