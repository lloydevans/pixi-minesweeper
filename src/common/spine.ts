import { Spine as PixiSpine, ISkeletonData } from "pixi-spine";

/** This serves as an alias to the namespaced Spine class. */
export class Spine extends PixiSpine {
	constructor(spineData: ISkeletonData) {
		super(spineData);

		// Temporarily hard-coded scale variant
		this.scale.set(0.25);
	}

	public setSkinByName(skinName: string) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(this.skeleton as any).setSkin(null);
		this.skeleton.setSkinByName(skinName);
	}
}
