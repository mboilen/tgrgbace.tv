const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    mode: 'development',
    entry: './src/index.js',
    plugins: [
        new HtmlWebpackPlugin({
            title: 'TGRGBACE Live!',
            template: 'src/index.html'
        }),
        new CopyWebpackPlugin({
            patterns: [
                { from: 'node_modules/ovenplayer/dist/*.js',
                    to: 'ovenplayer/[name][ext]' },
                { from: 'node_modules/hls.js/dist/hls.min.js',
                    to: 'deps/[name][ext]' },
                { from: 'node_modules/dashjs/dist/dash.all.min.js',
                    to: 'deps/[name][ext]' }
            ]
        }),
    ],
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'dist'),
        clean: true,
    },
};
