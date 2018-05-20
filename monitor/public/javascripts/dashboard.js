var DashBoard = function() {
    var canvas = $(".dashBoard").get(0);
	this.ctx = canvas.getContext("2d");
    this.width = 720;
    this.height = 400;
    this.obj = new Object();

    this.graph = new Object();
    var self = this;
    ['x', 'y', 'z'].forEach(function(element, index) {
        self.graph[element] = new Array();
        for(var i=0; i<self.width - (20 * 2); i++) {
            self.graph[element].push(0);
        }
    });

    this.params = {
        x: { color: 'rgba(65, 156, 255, 1)', x: 120, y: 100, gOfs: 280 - 20 },
        y: { color: 'rgba(156, 255, 65, 1)', x: 360, y: 100, gOfs: 340 - 20 },
        z: { color: 'rgba(255, 65, 156, 1)', x: 600, y: 100, gOfs: 400 - 20 },
    };

    this.dummy = {
        i_o: 1.0,
        o_i: 0.0,
    };
    this.dummy_backup = $.extend(true, {}, this.dummy);
};

DashBoard.prototype.makeSpeedIndicator = function() {
    var self = this;

    var tween = new TWEEN.Tween(self.dummy)
        .to({ i_o: 0.0, o_i: 1.0 }, 1000)
        .easing(TWEEN.Easing.Cubic.InOut).onUpdate(function() {
            self.ctx.clearRect(0, 0, self.width, self.height);

            ['x', 'y', 'z'].forEach(function(element, index) {
                self.drawSpeedIndicatorFrame(element, self.dummy.o_i);
                self.drawSpeedIndicator(element, self.dummy.i_o);
                self.drawSpeedIndicatorValue(element, 0);
            });
        })
        .onComplete(function(){
            self.dummy = $.extend(true, {}, self.dummy_backup);
        }).start();
};

DashBoard.prototype.putSpeedIndicator = function(value) {
    var self = this;
    self.ctx.clearRect(0, 0, self.width, self.height);

    ['x', 'y', 'z'].forEach(function(element, index) {
        //if(value[element] < 0) value[element] = 0;

        self.drawSpeedIndicatorFrame(element);
        self.drawSpeedIndicator(element);
        self.drawSpeedIndicatorValue(element, value[element]);
        self.putSpeedGraph({ axis: element, value: value[element]});
    });

    self.drawSpeedGraphPoint();
};

DashBoard.prototype.drawSpeedIndicator = function(axis, tween) {
    this.ctx.beginPath();
    this.ctx.fillStyle = this.params[axis].color;
    if(tween == undefined) {
        this.ctx.arc(this.params[axis].x, this.params[axis].y, 80, 0, 2*Math.PI, false);
    } else {
        this.ctx.arc(this.params[axis].x, this.params[axis].y, 80, -Math.PI/2 - 0.000001, 2*Math.PI * tween - Math.PI/2, true);
    }
    this.ctx.lineTo(this.params[axis].x, this.params[axis].y);
    this.ctx.fill();
};

DashBoard.prototype.drawSpeedIndicatorFrame = function(axis, tween) {
    this.ctx.beginPath();
    this.ctx.fillStyle = 'rgba(71, 86, 102, 1)';
    if(tween == undefined) {
        this.ctx.arc(this.params[axis].x, this.params[axis].y, 100, 0, 2*Math.PI, false);
    } else {
        this.ctx.arc(this.params[axis].x, this.params[axis].y, 100, -Math.PI/2, 2*Math.PI * tween - Math.PI/2, false);
    }
    this.ctx.lineTo(this.params[axis].x, this.params[axis].y);
    this.ctx.fill();
};

DashBoard.prototype.drawSpeedIndicatorValue = function(axis, value) {
    var tween = value / 10.0;

    this.ctx.beginPath();
    if(value < 0) {
        this.ctx.fillStyle = 'rgba(156, 65, 255, 1)';
        this.ctx.arc(this.params[axis].x, this.params[axis].y, 50, -Math.PI/2 - 0.000001, 2*Math.PI * tween - Math.PI/2, true);
    } else {
        this.ctx.fillStyle = 'rgba(255, 156, 65, 1)';
        this.ctx.arc(this.params[axis].x, this.params[axis].y, 50, -Math.PI/2 - 0.000001, 2*Math.PI * tween - Math.PI/2, false);
    }
    this.ctx.lineTo(this.params[axis].x, this.params[axis].y);
    this.ctx.fill();

    this.ctx.font= 'bold 50px Century Gothic';
    this.ctx.lineWidth = 4;
    this.ctx.textAlign = "center";
    this.ctx.lineJoin = 'round';
    this.ctx.fillStyle = '#fff';
    this.ctx.fillText(value, this.params[axis].x, this.params[axis].y + 20 - 3);
};

DashBoard.prototype.makeSpeedGraph = function() {
    this.drawSpeedGraphPoint();
};

DashBoard.prototype.putSpeedGraph = function(data) {
    var self = this;

    this.graph[data.axis].shift();
    this.graph[data.axis].push(data.value);
};

DashBoard.prototype.drawSpeedGraphPoint = function(data) {
    var self = this;

    self.drawSpeedGraphFrame();
    ['x', 'y', 'z'].forEach(function(element, index) {
        self.ctx.beginPath();
        self.ctx.strokeStyle = self.params[element].color;

        self.graph[element].forEach(function(v, k) {
            self.ctx.lineTo(20 + k, self.params[element].gOfs - (v * 2));
        });

        self.ctx.stroke();
    });
}

DashBoard.prototype.drawSpeedGraphFrame = function(data) {
    var self = this;

    ['x', 'y', 'z'].forEach(function(element, index) {
        self.ctx.font= 'bold 10px Century Gothic';
        self.ctx.lineWidth = 4;
        self.ctx.textAlign = "right";
        self.ctx.lineJoin = 'round';
        self.ctx.fillStyle = '#808080';
        self.ctx.fillText("0", 15 + 3, self.params[element].gOfs + 4);

        self.ctx.font= 'bold 10px Century Gothic';
        self.ctx.lineWidth = 4;
        self.ctx.textAlign = "center";
        self.ctx.lineJoin = 'round';
        self.ctx.fillStyle = '#808080';
        self.ctx.fillText("-5", 15 - 2, self.params[element].gOfs + (5 * 2) + 4);

        self.ctx.font= 'bold 10px Century Gothic';
        self.ctx.lineWidth = 4;
        self.ctx.textAlign = "center";
        self.ctx.lineJoin = 'round';
        self.ctx.fillStyle = '#808080';
        self.ctx.fillText("+5", 15 - 3, self.params[element].gOfs - (5 * 2) + 4);

        self.ctx.beginPath();
        self.ctx.lineWidth = 1;
        self.ctx.strokeStyle = "rgb(128, 128, 128)";
        self.ctx.lineTo(20, self.params[element].gOfs);
        self.ctx.lineTo(self.width - 20, self.params[element].gOfs);
        self.ctx.stroke();

        self.ctx.beginPath();
        self.ctx.lineWidth = 1;
        self.ctx.strokeStyle = "rgb(128, 128, 128)";
        self.ctx.lineTo(20, self.params[element].gOfs + (5 * 2));
        self.ctx.lineTo(self.width - 20, self.params[element].gOfs + (5 * 2));
        self.ctx.stroke();

        self.ctx.beginPath();
        self.ctx.lineWidth = 1;
        self.ctx.strokeStyle = "rgb(128, 128, 128)";
        self.ctx.lineTo(20, self.params[element].gOfs - (5 * 2));
        self.ctx.lineTo(self.width - 20, self.params[element].gOfs - (5 * 2));
        self.ctx.stroke();
    });
}

DashBoard.prototype.makeRotateIndicator = function() {
    var geometry;
    var material;

    var geometry = new THREE.SphereGeometry(26, 30, 30);
    var material = new THREE.PointCloudMaterial({ size: 2, color:0x448866 })
    this.obj.particles = new THREE.PointCloud(geometry, material);
    Anime.scene.add(this.obj.particles);

    geometry = new THREE.CircleGeometry(22, 32);
    material = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    //this.obj.circle1 = new THREE.Mesh(geometry, material);
    //Anime.scene.add(this.obj.circle1);

    geometry = new THREE.CircleGeometry(22, 32);
    material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    //this.obj.circle2 = new THREE.Mesh(geometry, material);
    //Anime.scene.add(this.obj.circle2);
};

DashBoard.prototype.putRotateIndicator = function(value) {
    $.each(this.obj, function(k, v) {
        var ofs = 0;
        if(k == "circle1") ofs = Math.PI / 2;
        v.rotation.set(Math.PI * 0.05 * value.r, 0, Math.PI * 0.05 * value.p);
    });
};

DashBoard.prototype.putAbortMarker = function() {
    console.log("abort");
};
