const pkg = require("./package.json");
const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = (env = {}) => {
	env = {
		...{
			prod: false,
			modern: true,
			editor: false,
		},
		...env,
	};

	/** @type {import("webpack").Configuration} */
	let config = {
		entry: "./src/index.ts",

		devtool: "source-map",

		stats: {
			assets: false,
		},

		optimization: {
			concatenateModules: true,
		},

		devServer: {
			host: "0.0.0.0",
			port: 3000,
			hot: false,
			open: false,
			compress: true,
		},

		output: {
			filename: "bundle.js",
			path: path.join(__dirname, "build"),
			chunkFormat: false,
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
							jsx: "react",
							jsxFactory: "h",
							jsxFragmentFactory: "Fragment",
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
			new webpack.DefinePlugin({
				ENV_VERSION: JSON.stringify(pkg.version),
				ENV_PROD: JSON.stringify(!!env.prod),
			}),
		],

		mode: env.prod ? "production" : "development",
	};

	return config;
};
