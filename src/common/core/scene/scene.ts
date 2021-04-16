import { Component } from "../components/component";
import { Entity } from "../entity/entity";

/** */
export class Scene extends Component {
	public constructor() {
		super(new Entity());
	}

	public init(): void {}
}
