const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env = {}) => {
    /**
     * Build options.
     */
    env = { ...{ prod: false, modern: false }, ...env };

    /**
     * @type {import("webpack").Configuration}
     */
    let config = {
        entry: './src/index.ts',

        output: {
            filename: 'bundle.js',
            path: path.join(__dirname, 'build'),
        },

        devtool: 'source-map',

        module: {
            rules: [
                {
                    test: /\.css$/i,
                    use: ['style-loader', 'css-loader'],
                },
                {
                    test: /\.tsx?$/,
                    loader: 'ts-loader',
                    options: {
                        compilerOptions: {
                            target: env.modern ? 'ES2019' : 'ES5',
                        },
                    },
                },
            ],
        },

        resolve: {
            extensions: ['.tsx', '.ts', '.js', '.css'],
        },

        plugins: [
            // Auto generate HTML
            new HtmlWebpackPlugin(),
        ],

        mode: env.prod ? 'production' : 'development',
    };

    return config;
};
