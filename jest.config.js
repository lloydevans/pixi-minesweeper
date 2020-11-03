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

	collectCoverageFrom: ["src/ms-state.ts", "src/ms-state.spec.ts"],

	coverageDirectory: "coverage",

	collectCoverage: true
};

module.exports = config;
