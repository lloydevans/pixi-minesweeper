const pkg = require("./package.json");
const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = (env = {}) => {
	/**
	 * Build options.
	 */
	env = {
		...{
			prod: false,
			modern: false,
			editor: false,
		},
		...env,
	};

	/**
	 * @type {import("webpack").Configuration}
	 */
	let config = {
		entry: env.editor ? "./src/index-editor.ts" : "./src/index.ts",

		devtool: "source-map",

		stats: {
			assets: false,
		},

		devServer: {
			clientLogLevel: "none",
			host: "0.0.0.0",
			port: 3000,
			hot: false,
			open: false,
			inline: false,
			compress: true,
		},

		output: {
			filename: "bundle.js",
			path: path.join(__dirname, "build")
		},

		module: {
			rules: [
				{
					test: /\.css$/i,
					use: ["style-loader", "css-loader"],
				},
				{
					test: /\.tsx?$/,
					loader: "ts-loader",
					options: {
						compilerOptions: {
							target: env.modern ? "ES2019" : "ES5",
						},
					},
				},
				{
					test: require.resolve("tweenjs/lib/tweenjs"),
					use: "imports-loader?wrapper=window",
				},
				{
					test: require.resolve("./libs/tween-group.js"),
					use: "imports-loader?wrapper=window",
				},
			],
		},

		resolve: {
			extensions: [".tsx", ".ts", ".js", ".css"],
		},

		plugins: [
			new HtmlWebpackPlugin({ template: "src/index.html", hash: true }),
			new CopyWebpackPlugin({ patterns: [{ from: "static" }] }),
			new webpack.ProvidePlugin({ PIXI: "pixi.js-legacy" }),
			new webpack.DefinePlugin({
				ENV_VERSION: JSON.stringify(pkg.version),
				ENV_PROD: JSON.stringify(!!env.prod),
			}),
		],

		mode: env.prod ? "production" : "development",
	};

	return config;
};
