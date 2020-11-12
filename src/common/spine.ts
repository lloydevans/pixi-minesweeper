/**
 * This serves as an alias to the namespaced Spine class.
 */
export class Spine extends PIXI.spine.Spine {
	public setSkinByName(skinName: string) {
		(this.skeleton.setSkin as any)(null);
		this.skeleton.setSkinByName(skinName);
	}
}
