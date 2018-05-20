var DiscJockey = function() {
    var canvas = $(".turn_table").get(0);
    this.ctx = canvas.getContext("2d");
    this.width = 400;
    this.height = 400;
    this.obj = new Object();
    this.disc = new Array();
    this.kaoss_animetion;

    this.params = { color: 'rgba(65, 255, 156, 1)', x: 200, y: 200, r: 160, fr: 170, ir: 130, irb: 60, gOfs: 280 - 20 };

    this.dummy = {
        i_o: 1.0,
        o_i: 0.0,
    };
    this.dummy_backup = $.extend(true, {}, this.dummy);
};

DiscJockey.prototype.makeDisc = function() {
    var self = this;

    var tween = new TWEEN.Tween(self.dummy)
        .to({ i_o: 0.0, o_i: 1.0 }, 1000)
        .easing(TWEEN.Easing.Cubic.InOut).onUpdate(function() {
            self.ctx.clearRect(0, 0, self.width, self.height);

            self.drawDiscFrame(self.dummy.o_i);
            self.drawDiscIndicator(self.dummy.i_o);
        })
        .onComplete(function(){
            self.dummy = $.extend(true, {}, self.dummy_backup);
        }).start();
};

DiscJockey.prototype.drawDiscIndicator = function(tween) {
    this.ctx.beginPath();
    this.ctx.fillStyle = this.params.color;
    if(tween == undefined) {
        this.ctx.arc(this.params.x, this.params.y, this.params.ir, Math.PI, Math.PI / 2 + Math.PI / 2, false);
    } else {
        this.ctx.arc(this.params.x, this.params.y, this.params.ir, Math.PI , Math.PI / 2 * tween + Math.PI / 2, true);
    }
    this.ctx.lineTo(this.params.x, this.params.y);
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.fillStyle = 'rgba(65, 156, 255, 1)';
    if(tween == undefined) {
        this.ctx.arc(this.params.x, this.params.y, this.params.irb, Math.PI, Math.PI / 2 + Math.PI / 4 + 0.001, false);
    } else {
        this.ctx.arc(this.params.x, this.params.y, this.params.irb, Math.PI , Math.PI / 2 * tween + Math.PI / 4 - 0.01, true);
    }
    this.ctx.lineTo(this.params.x, this.params.y);
    this.ctx.fill();
};

DiscJockey.prototype.drawDiscFrame = function(tween) {
    this.ctx.beginPath(); // Frame
    this.ctx.fillStyle = 'rgba(71, 86, 102, 1)';
    if(tween == undefined) {
        this.ctx.arc(this.params.x, this.params.y, this.params.fr, 0, 2 * Math.PI, false);
    } else {
        this.ctx.arc(this.params.x, this.params.y, this.params.fr, -Math.PI/2, 2 * Math.PI * tween - Math.PI / 2, false);
    }
    this.ctx.lineTo(this.params.x, this.params.y);
    this.ctx.fill();

    this.ctx.beginPath(); // Body
    this.ctx.fillStyle = 'rgba(65, 156, 255, 1)';
    if(tween == undefined) {
        this.ctx.arc(this.params.x, this.params.y, this.params.r, 0, 2 * Math.PI, false);
    } else {
        this.ctx.arc(this.params.x, this.params.y, this.params.r, -Math.PI / 2 - 0.000001, 2 * Math.PI * (1 - tween) - Math.PI / 2, true);
    }
    this.ctx.lineTo(this.params.x, this.params.y);
    this.ctx.fill();
};

DiscJockey.prototype.enable_kaosspad = function() {
    $(".kaosspad").on("mousemove", function() {
        var width = $(this).width();
        var height = $(this).height();
        var pos = {
            x: (event.clientX - $(this).offset().left) / width,
            y: -1 * (event.clientY - $(this).offset().top - $(window).scrollTop() + 38) / height
        };

        highPassFilterNode.frequency.value = (pos.x) * 4400;
        lowPassFilterNode.frequency.value = (1 - pos.y) * 4400;
    });

    $(".kaosspad").on("mouseout", function() {
        highPassFilterNode.frequency.value = 0;
        lowPassFilterNode.frequency.value = 4400;
    });
}

DiscJockey.prototype.enable_cross_fader = function() {
    $(".pick").draggable({
        axis: 'x',
        containment: "parent",

        drag: function(e, ui) {
            cueCheck();
        },

        stop: function() {
            cueCheck();
        }
    });

    var cueCheck = function() {
        var fader = $(".fader");
        var picker = $(fader).find(".pick");
        var movable_width = $(fader).width() - $(picker).outerWidth();

        var pick_left = $(picker).css("left");
        if(pick_left == "auto") pick_left = 0;
            else pick_left = parseInt(pick_left);

        var volumeB = (pick_left / movable_width);
        var volumeA = 1 - volumeB;

        normal_gainNode.gain.value = volumeA;
        reverse_gainNode.gain.value = volumeB;
    }
}

DiscJockey.prototype.enable_turntable = function() {
    var ofs = $(".turn_table").offset();
    var padding = { x: 0, y: 0 };

    $(".turn_table").on("mousedown", function() {
        $(this).css({ "animation-play-state": "paused" });
        var width = $(this).width();
        var height = $(this).height();

        var picked = {
            x: (event.clientX - ofs.left - padding.x) / width,
            y: (event.clientY - (ofs.top - $(window).scrollTop()) - padding.y) / height
        }

        $(this).on("mousemove", function() {
            var pos = {
                x: (event.clientX - ofs.left - padding.x) / width,
                y: (event.clientY - (ofs.top - $(window).scrollTop()) - padding.y) / height
            };


            var diff = { x: picked.x - pos.x, y: picked.y - pos.y };
            if(0.5 < pos.x) change_playRate(diff.y);
                else change_playRate(-diff.y);

            if(0.5 < pos.y) change_playRate(-diff.x);
                else change_playRate(diff.x);


            picked = {
                x: (event.clientX - ofs.left - padding.x) / width,
                y: (event.clientY - (ofs.top - $(window).scrollTop()) - padding.y) / height
            }
        });

        $(this).on("mouseup", function() {
            $(this).off("mousemove");
            $(this).css({ "animation-play-state": "running" });
        });
    });

    $(".turn_table").on("mouseout", function() {
        $(this).css({ "animation-play-state": "running" });
    });

    var change_playRate = function(diff_value) {
        normal_sourceNode.playbackRate.value += diff_value;
    }
}
