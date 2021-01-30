import { Entity } from "../entity/entity";

export class Component {
	public entity: Entity;

	public constructor(entity: Entity) {
		this.entity = entity;
	}
}
