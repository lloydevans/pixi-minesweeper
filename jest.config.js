/**
 * @type {import("@jest/types").Config.InitialOptions}
 */
const config = {
	verbose: true,

	preset: "jest-puppeteer",

	transform: { "^.+\\.tsx?$": "ts-jest" },

	setupFiles: ["jest-canvas-mock", "./src/index-test.ts"],

	testEnvironment: "jsdom",

	testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$",

	testPathIgnorePatterns: ["/lib/", "/node_modules/"],

	moduleFileExtensions: ["ts", "tsx", "js", "json"],

	collectCoverageFrom: [
		"src/minesweeper/ms-state.ts",
		"src/minesweeper/ms-state.spec.ts",
		"src/common/core/events/event-channel.spec.ts",
		"src/common/core/events/event-channel.ts",
	],

	coverageDirectory: "coverage",

	collectCoverage: true,
};

module.exports = config;
