var CryptoJS = require("crypto-js");
function component() {
    var key = new URLSearchParams(window.location.search).get('key');
    var sourcesString = __SOURCES__;
    var decrypted = CryptoJS.AES.decrypt(sourcesString, key).toString(CryptoJS.enc.Utf8);
    var sourcesList = JSON.parse(decrypted);
    var player = OvenPlayer.create("player", {
        sources: sourcesList
    });
}
component();
