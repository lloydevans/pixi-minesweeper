// These are copied from the Container inline type.
export type DestroyOptions = {
	/**
	 * Recurscively destroy children?
	 */
	children?: boolean;

	/**
	 * Destroy texture instances?
	 */
	texture?: boolean;

	/**
	 * Destroy base-texture instances?
	 */
	baseTexture?: boolean;
};
