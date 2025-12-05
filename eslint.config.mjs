import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";

export default tseslint.config(
	eslint.configs.recommended,
	...tseslint.configs.strict,
	prettierConfig,
	{
		files: ["src/**/*.ts"],
		languageOptions: {
			parserOptions: {
				project: "./tsconfig.json",
			},
		},
	},
	{
		rules: {
			"no-console": ["warn", { allow: ["warn", "error"] }],
		},
	},
	{
		ignores: [
			"node_modules/**",
			"build/**",
			"dist/**",
			"dts/**",
			"static/**",
			"libs/**",
			"builder/**",
			"webpack.config.js",
			"jest.config.js",
		],
	},
);
