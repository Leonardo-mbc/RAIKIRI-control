var Controls = function() {
    this.enable = true;
};

Controls.prototype.makeButton = function() {
    $("[name='use-control']").bootstrapSwitch({
        size: "mini",
        onColor: "success"
    });
};

Controls.prototype.moterSignal = function(dir) {
    if(dir == 1) var sgn = 'F';
    if(dir == -1) var sgn = 'B';
    socket.emit('moterSignal', { sgn: sgn });
};
