import { Spine as PixiSpine, ISkeleton, ISkeletonData, IAnimationState, IAnimationStateData } from "pixi-spine";

/** This serves as an alias to the namespaced Spine class. */
export class Spine extends PixiSpine {
	public setSkinByName(skinName: string) {
		// (this.skeleton as any).setSkin(null);
		// this.skeleton.setSkinByName(skinName);
	}
}
