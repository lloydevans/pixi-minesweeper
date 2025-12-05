export interface TweenOptions {
	useTicks?: boolean;
	ignoreGlobalPause?: boolean;
	loop?: number;
	reversed?: boolean;
	bounce?: boolean;
	timeScale?: number;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	pluginData?: any;
	paused?: boolean;
	position?: number;
	override?: boolean;
}
