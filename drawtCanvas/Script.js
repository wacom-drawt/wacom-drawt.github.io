
var WILL = {
    backgroundColor: Module.Color.WHITE,
    color: Module.Color.from(0, 0, 0),

    strokes: new Array(),

    init: function(width, height) {
        this.initInkEngine(width, height);
        this.initEvents();
    },

    initInkEngine: function(width, height) {
        this.canvas = new Module.InkCanvas(document.getElementById("canvas"), width, height);
        this.canvas.clear(this.backgroundColor);

        this.brush = new Module.DirectBrush();

        this.speedPathBuilder = new Module.SpeedPathBuilder();
        this.speedPathBuilder.setNormalizationConfig(182, 3547);
        this.speedPathBuilder.setPropertyConfig(Module.PropertyName.Width, 2.05, 34.53, 0.72, NaN, Module.PropertyFunction.Power, 1.19, false);

        if (window.PointerEvent) {
            this.pressurePathBuilder = new Module.PressurePathBuilder();
            this.pressurePathBuilder.setNormalizationConfig(0.195, 0.88);
            this.pressurePathBuilder.setPropertyConfig(Module.PropertyName.Width, 2.05, 34.53, 0.72, NaN, Module.PropertyFunction.Power, 1.19, false);
        }

        this.strokeRenderer = new Module.StrokeRenderer(this.canvas, this.canvas);
        this.strokeRenderer.configure({brush: this.brush, color: this.color});
    },

    initEvents: function() {
        var self = this;

        if (window.PointerEvent) {
            Module.canvas.addEventListener("pointerdown", function(e) {self.beginStroke(e);});
            Module.canvas.addEventListener("pointermove", function(e) {self.moveStroke(e);});
            document.addEventListener("pointerup", function(e) {self.endStroke(e);});
        }
        else {
            Module.canvas.addEventListener("mousedown", function(e) {self.beginStroke(e);});
            Module.canvas.addEventListener("mousemove", function(e) {self.moveStroke(e);});
            document.addEventListener("mouseup", function(e) {self.endStroke(e);});

            if (window.TouchEvent) {
                Module.canvas.addEventListener("touchstart", function(e) {self.beginStroke(e);});
                Module.canvas.addEventListener("touchmove", function(e) {self.moveStroke(e);});
                document.addEventListener("touchend", function(e) {self.endStroke(e);});
            }
        }
    },

    getPressure: function(e) {
        return (window.PointerEvent && e instanceof PointerEvent && e.pressure !== 0.5)?e.pressure:NaN;
    },

    beginStroke: function(e) {
        if (["mousedown", "mouseup"].contains(e.type) && e.button != 0) return;
        if (e.changedTouches) e = e.changedTouches[0];

        this.inputPhase = Module.InputPhase.Begin;
        this.pressure = this.getPressure(e);
        this.pathBuilder = isNaN(this.pressure)?this.speedPathBuilder:this.pressurePathBuilder;

        this.buildPath({x: e.clientX, y: e.clientY});
        this.drawPath();
    },

    moveStroke: function(e) {
        if (!this.inputPhase) return;
        if (e.changedTouches) e = e.changedTouches[0];

        this.inputPhase = Module.InputPhase.Move;
        this.pointerPos = {x: e.clientX, y: e.clientY};
        this.pressure = this.getPressure(e);

        if (WILL.frameID != WILL.canvas.frameID) {
            var self = this;

            WILL.frameID = WILL.canvas.requestAnimationFrame(function() {
                if (self.inputPhase && self.inputPhase == Module.InputPhase.Move) {
                    self.buildPath(self.pointerPos);
                    self.drawPath();
                }
            }, true);
        }
    },

    endStroke: function(e) {
        if (!this.inputPhase) return;
        if (e.changedTouches) e = e.changedTouches[0];

        this.inputPhase = Module.InputPhase.End;
        this.pressure = this.getPressure(e);

        this.buildPath({x: e.clientX, y: e.clientY});
        this.drawPath();

        var stroke = new Module.Stroke(this.brush, this.path, NaN, this.color, 0, 1);
		this.strokes.push(stroke);

        delete this.inputPhase;
    },

    buildPath: function(pos) {
        var pathBuilderValue = isNaN(this.pressure)?Date.now() / 1000:this.pressure;

        var pathPart = this.pathBuilder.addPoint(this.inputPhase, pos, pathBuilderValue);
        var pathContext = this.pathBuilder.addPathPart(pathPart);

        this.pathPart = pathContext.getPathPart();
        this.path = pathContext.getPath();
    },

    drawPath: function() {
        this.strokeRenderer.draw(this.pathPart, this.inputPhase == Module.InputPhase.End);
    },

    clear: function() {
        this.canvas.clear(this.backgroundColor);
    },

    changeColor: function() {
    	if (this.color == Module.Color.WHITE) {
    		this.color = Module.Color.BLACK;
    	}
    	else {
    		this.color = Module.Color.WHITE;
    	}
    	this.strokeRenderer.configure({brush: this.brush, color: this.color});
    }
};

Module.addPostScript(function() {
    WILL.init(1600, 1000);
    WILL.color = Module.Color.WHITE;
});


function changeDrawColor() {
	WILL.changeColor();
}

function saveDrawingToPng() {
	var canvas = document.getElementById("canvas");
	// var img    = canvas.toDataURL("image/png");
	var dataURL    = canvas.toDataURL();
	$.ajax({
	type: "POST",
	url: "https://drawtwacom.herokuapp.com/submit",
	data: { 
	 imgBase64: dataURL,
	 nodeId: "IDString"
	}
	}).done(function(o) {
	console.log('saved'); 
	// If you want the file to be visible in the browser 
	// - please modify the callback in javascript. All you
	// need is to return the url to the file, you just saved 
	// and than put the image in your browser.
	});

}

