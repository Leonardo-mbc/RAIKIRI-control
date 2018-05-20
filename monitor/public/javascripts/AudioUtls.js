var context = new AudioContext();
var normal_sourceNode = context.createBufferSource();
var reverse_sourceNode = context.createBufferSource();

var gainNode = context.createGain();
var normal_gainNode = context.createGain();
var reverse_gainNode = context.createGain();

var highPassFilterNode = context.createBiquadFilter();
var lowPassFilterNode = context.createBiquadFilter();
var bufferLoader;

$(function() {
    bufferLoader = new BufferLoader(
        context, {
            //n: './sounds/n_ZVZzEZjQYLmz.mp3',
            n: './sounds/vpXiHnD02z8p128.mp3',
            r: './sounds/r_ZVZzEZjQYLmz.mp3',
        },
        finishedLoading
    );

    bufferLoader.load();
    animate();
});

function finishedLoading(bufferList) {
    normal_sourceNode.buffer = bufferList["n"];
    reverse_sourceNode.buffer = bufferList["r"];

    normal_sourceNode.connect(normal_gainNode);
    reverse_sourceNode.connect(reverse_gainNode);

    normal_gainNode.connect(highPassFilterNode);
    reverse_gainNode.connect(highPassFilterNode);

    highPassFilterNode.connect(lowPassFilterNode);
    lowPassFilterNode.connect(gainNode);

    gainNode.connect(context.destination);

    highPassFilterNode.type = "highpass";
    highPassFilterNode.frequency.value = 0;
    lowPassFilterNode.type = "lowpass";
    lowPassFilterNode.frequency.value = 4400;

    normal_gainNode.gain.value = 1.0;
    reverse_gainNode.gain.value = 0.0;
    gainNode.gain.value = 1.0;

    normal_sourceNode.start(0, 5);
    reverse_sourceNode.start(0, 10);

    normal_sourceNode.startTime = normal_sourceNode.context.currentTime;
    reverse_sourceNode.startTime = reverse_sourceNode.context.currentTime;

    $(".turn_table").addClass("enable_turn");
}

function BufferLoader(context, urlList, callback) {
    this.context = context;
    this.urlList = urlList;
    this.onload = callback;
    this.bufferList = new Array();
    this.loadCount = 0;
}

BufferLoader.prototype.loadBuffer = function(url, index) {
    // Load buffer asynchronously
    var request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer";

    var loader = this;

    request.addEventListener("progress", onProgress, false);
    request.addEventListener("load", onLoad, false);
    request.addEventListener("error", onError, false);

    function onLoad(e) {
        // Asynchronously decode the audio file data in request.response
        loader.context.decodeAudioData(
            request.response,
            function(buffer) {
                if (!buffer) {
                    alert('error decoding file data: ' + url);
                    return;
                }
                loader.bufferList[index] = buffer;
                if (++loader.loadCount == Object.keys(loader.urlList).length)
                    loader.onload(loader.bufferList);
            },
            function(error) {
                console.error('decodeAudioData error', error);
            }
        );
    }

    function onProgress(e) {
        $(".loading").find(".value").text((e.loaded / e.total * 100).toFixed(2) +'%');
    }

    function onError() {
        console.error('BufferLoader: XHR error');
    }

    request.send();
};

BufferLoader.prototype.load = function() {
    var tmpBufferLoader = this;
    $.each(tmpBufferLoader.urlList, function(key, value) {
        tmpBufferLoader.loadBuffer(value, key);
    });
};
