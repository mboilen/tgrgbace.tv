import _ from 'ovenplayer'
function component() {
    var player = OvenPlayer.create("player", {
        sources: getSources(new URLSearchParams(window.location.search).get('key'))
    });
}
