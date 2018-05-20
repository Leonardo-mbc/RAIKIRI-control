var socket;

$(function() {
    socket = io();

    socket.on('speed_emit', function(data) {
        var speed = data.speed;
        console.log(speed);
        db.putSpeedIndicator({ x: -speed.x, y: -speed.y, z: -speed.z });
    });

    socket.on('dj_emit', function(data) {
        var speed = data.speed;
        console.log(speed);

        /*if(0 < speed.y) {
            normal_gainNode.gain.value = 1;
            reverse_gainNode.gain.value = 0;
            normal_sourceNode.playbackRate.value = 1.0 + -speed.y / 3;
        }/* else {
            normal_gainNode.gain.value = 0;
            reverse_gainNode.gain.value = 1;
            reverse_sourceNode.playbackRate.value = 1.0 - speed.x / 3;
        }*/

        if(0 < speed.y) {
            lowPassFilterNode.frequency.value = 4400 * (1 - speed.y / 3);
        } else {
            highPassFilterNode.frequency.value = 4400 * (-speed.y / 3);
        }
    });

    socket.on('acclr_emit', function(data) {
        var acclr = data.acclr;
        console.log(acclr);

        /*if(0 < acclr.y) {
            normal_gainNode.gain.value = 1;
            reverse_gainNode.gain.value = 0;
            normal_sourceNode.playbackRate.value = 1.0 + acclr.y / 3;
        }/* else {
            normal_gainNode.gain.value = 0;
            reverse_gainNode.gain.value = 1;
            reverse_sourceNode.playbackRate.value = 1.0 - speed.x / 3;
        }*/

        if(0 < acclr.x) {
            lowPassFilterNode.frequency.value = 4400 * (1 - acclr.x / 9);
        } else {
            highPassFilterNode.frequency.value = 4400 * (-acclr.x / 9);
        }
        //db.putSpeedIndicator({ x: -acclr.x, y: -acclr.y, z: -acclr.z });
    });

    socket.on('rotation_emit', function(data) {
        var rotation = data.rotation;
        db.putRotateIndicator({ r: rotation.roll, p: rotation.pitch, y: rotation.yaw });
    });

    socket.on('sign_emit', function(data) {
        var sign = data.sign;
        db.putAbortMarker();
    });
});
