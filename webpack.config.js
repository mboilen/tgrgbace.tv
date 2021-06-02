const path = require('path');
const dotenv = require('dotenv');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const base64url = require('base64url');
const crypto = require('crypto');
const fs = require('fs');
const CryptoJS = require('crypto-js');

const MS_PER_DAY = 60 * 60 * 24 * 1000;

dotenv.config();
const HMAC_KEY = process.env.HMAC_KEY;
const HOSTNAME = process.env.HOSTNAME;

dotenv.config();


function createEncryptedSources() {
    let streamerPolicy = JSON.stringify({"url_expire": Date.now() + (60 * MS_PER_DAY) });
    let viewerPolicy = JSON.stringify({"url_expire": Date.now() + (265 * MS_PER_DAY) });


    let streamerPolicyBase64 = base64url(Buffer.from(streamerPolicy, 'utf8'));
    let viewerPolicyBase64 = base64url(Buffer.from(viewerPolicy, 'utf8'));

    var policies = {};
    makePolicy(policies, 'webrtc', HMAC_KEY, 'wss://' + HOSTNAME + ":3334/tgrgbace/stream", viewerPolicyBase64);
    makePolicy(policies, 'hls', HMAC_KEY, 'https://' + HOSTNAME + ":8090/tgrgbace/stream/playlist.m3u8", viewerPolicyBase64);
    makePolicy(policies, 'dash-ll', HMAC_KEY, 'https://' + HOSTNAME + ":8090/tgrgbace/stream/manifest_ll.mpd", viewerPolicyBase64);

    var streamerPolicies = {};
    makePolicy(streamerPolicies, 'rtmp', HMAC_KEY, 'rtmp://' + HOSTNAME + ":1935/tgrgbace/stream", streamerPolicyBase64);
    makePolicy(streamerPolicies, 'srt', HMAC_KEY, 'srt://' + HOSTNAME + ":9999/tgrgbace/stream", streamerPolicyBase64);

    var sourcesObject = Object.entries(policies).map(function([key, value]) {
        var entry = {
            "type": key,
            "file": value,
            "label": key
        };

        if (key === "webrtc") {
            entry["default"] = true;
        }

        return entry;
    });

    var sourcesString = JSON.stringify(sourcesObject); 
    var sourcesKey = crypto.randomBytes(16).toString('hex');
    var encrypted = CryptoJS.AES.encrypt(sourcesString, sourcesKey).toString();

    console.log('********************************');
    console.log();
    console.log('INFO FOR STREAMERS');
    console.log('==================');
    console.log();
    for (const [key, value] of Object.entries(streamerPolicies)) {
        console.log(key + ' streaming URL: ' + value);
    }
    console.log();
    console.log();
    console.log('INFO FOR VIEWERS');
    console.log('================');
    console.log();
    console.log('Secret player URL: https://' + HOSTNAME + '/tgrgbace/index.html?key=' + sourcesKey);
    console.log('NOTE: This URL contains the shared secret. Only give it to trusted viewers.');
    console.log();
    console.log('********************************');
    console.log();

    return encrypted;
}

function makePolicy(policies, protocol, hmacKey, baseUrl, policyBase64) {
    var policyUrl = baseUrl + '?policy=' + policyBase64;
    var signature = base64url(crypto.createHmac('sha1', hmacKey).update(policyUrl).digest());
    var signedUrl = policyUrl + '&signature=' + signature;
    //srt is real special
    if (protocol == "srt") {
        policies[protocol] = "srt://" + HOSTNAME + ":9999?streamid=" + encodeURIComponent(signedUrl);
    } else {
        policies[protocol] = signedUrl;
    }
}

module.exports = {
    mode: 'production',
    entry: './src/index.js',
    plugins: [
        new webpack.DefinePlugin({
            __SOURCES__: JSON.stringify(createEncryptedSources())
        }),
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
    resolve: {
        fallback: { 'crypto': false }  // Silence crypto polyfill warning.
    },
    performance: {
        hints: false  // Silence size warnings.
    },
};
