var AnimeUtls = function(width, height) {
    this.width = width || screen.width;
    this.height = height || screen.height;
    this.dummy = {
        i_o: 1.0,
        o_i: 0.0,
    };
    this.dummy_backup = $.extend(true, {}, this.dummy);
    this.trans_value = 0.0;

    if(this.width < this.height) {
        var tmp = this.height;
        this.height = this.width;
        this.width = tmp;
    }

    this.scene = new THREE.Scene();
    //this.scene.fog = new THREE.FogExp2(0xf5deb3, 0.0015);
    this.scene.fog = new THREE.FogExp2(0x000000, 0.0015);

    this.projector = new THREE.Projector();

    this.camera = new THREE.PerspectiveCamera(75, this.width / this.height, 0.1, 1000);
    this.cameraBasePositions = { x: 0, y: 0, z: 50 };
    this.camera.position.set(this.cameraBasePositions.x, this.cameraBasePositions.y, this.cameraBasePositions.z);

    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setSize(this.width, this.height);
    //this.renderer.setClearColor(0xf5deb3, 1);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.shadowMapEnabled = false;

    this.dpi = 2;
    this.renderTarget = new THREE.WebGLRenderTarget(this.width * this.dpi, this.height * this.dpi, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        stencilBuffer: false,
    });

    this.composer = new THREE.EffectComposer(this.renderer, this.renderTarget);
    this.composer.addPass(new THREE.RenderPass(this.scene, this.camera));
    this.composer.setSize(this.width * this.dpi, this.height * this.dpi);

    /**** shaders -> ****/
    this.fxaa = new THREE.ShaderPass(THREE.FXAAShader);
    this.fxaa.uniforms['resolution'].value.set(1 / (this.width * this.dpi), 1 / (this.height * this.dpi));
    //this.fxaa.renderToScreen = true;
    this.composer.addPass(this.fxaa);

    this.toScreen = new THREE.ShaderPass(THREE.CopyShader);
    this.toScreen.renderToScreen = true;
    this.composer.addPass(this.toScreen);

};

window.requestAnimFrame = (function() {
    return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
        function(callback) {
            window.setTimeout(callback, 1000 / 60);
        };
})();
