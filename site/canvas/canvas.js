WILL = {
	backgroundColor: Module.Color.WHITE,
	color: Module.Color.from(0, 0, 0),

	strokes: new Array(),

	init: function (width, height, image) {
		this.oldImage = image;
		this.initInkEngine(width, height);
		this.initEvents();
	},

	initInkEngine: function (width, height) {
		this.canvas = new Module.InkCanvas(document.getElementById("canvas"), width, height);
		this.canvas.clear(this.backgroundColor);

		this.initImageLayer();

		this.brush = new Module.DirectBrush();

		this.speedPathBuilder = new Module.SpeedPathBuilder();
		this.speedPathBuilder.setNormalizationConfig(182, 3547);
		this.speedPathBuilder.setPropertyConfig(Module.PropertyName.Width, 2.05, 34.53, 0.72, NaN, Module.PropertyFunction.Power, 1.19, false);

		this.smoothener = new Module.MultiChannelSmoothener(this.speedPathBuilder.stride);

		if (window.PointerEvent) {
			this.pressurePathBuilder = new Module.PressurePathBuilder();
			this.pressurePathBuilder.setNormalizationConfig(0.195, 0.88);
			this.pressurePathBuilder.setPropertyConfig(Module.PropertyName.Width, 2.05, 34.53, 0.72, NaN, Module.PropertyFunction.Power, 1.19, false);
		}

		this.color = Module.Color.BLACK;
		this.strokeRenderer = new Module.StrokeRenderer(this.canvas, this.canvas);
		this.strokeRenderer.configure({brush: this.brush, color: this.color});
	},

	initImageLayer: function () {
		var url = this.oldImage;
		this.imageLayer = this.canvas.createLayer({width: this.canvas.width, height: this.canvas.height});

		Module.GLTools.prepareTexture(
			this.imageLayer.texture,
			url,
			function (texture) {
				this.canvas.blend(this.imageLayer, {mode: Module.BlendMode.NONE});
			},
			this
		);
	},

	initEvents: function () {
		var self = this;

		if (window.PointerEvent) {
			Module.canvas.addEventListener("pointerdown", function (e) {
				self.beginStroke(e);
			});
			Module.canvas.addEventListener("pointermove", function (e) {
				self.moveStroke(e);
			});
			document.addEventListener("pointerup", function (e) {
				self.endStroke(e);
			});
		}
		else {
			Module.canvas.addEventListener("mousedown", function (e) {
				self.beginStroke(e);
			});
			Module.canvas.addEventListener("mousemove", function (e) {
				self.moveStroke(e);
			});
			document.addEventListener("mouseup", function (e) {
				self.endStroke(e);
			});

			if (window.TouchEvent) {
				Module.canvas.addEventListener("touchstart", function (e) {
					self.beginStroke(e);
				});
				Module.canvas.addEventListener("touchmove", function (e) {
					self.moveStroke(e);
				});
				document.addEventListener("touchend", function (e) {
					self.endStroke(e);
				});
			}
		}
	},

	getPressure: function (e) {
		return (window.PointerEvent && e instanceof PointerEvent && e.pressure !== 0.5) ? e.pressure : NaN;
	},

	beginStroke: function (e) {
		if (["mousedown", "mouseup"].contains(e.type) && e.button != 0) return;
		if (e.changedTouches) e = e.changedTouches[0];

		this.inputPhase = Module.InputPhase.Begin;
		this.pressure = this.getPressure(e);
		this.pathBuilder = isNaN(this.pressure) ? this.speedPathBuilder : this.pressurePathBuilder;
		var x = e.pageX - $('canvas').offset().left;
		var y = e.pageY - $('canvas').offset().top;
		this.buildPath({x: x, y: y});
		this.drawPath();
	},

	moveStroke: function (e) {
		if (!this.inputPhase) return;
		if (e.changedTouches) e = e.changedTouches[0];

		this.inputPhase = Module.InputPhase.Move;

		var x = e.pageX - $('canvas').offset().left;
		var y = e.pageY - $('canvas').offset().top;


		this.pointerPos = {x: x, y: y};
		this.pressure = this.getPressure(e);

		if (WILL.frameID != WILL.canvas.frameID) {
			var self = this;

			WILL.frameID = WILL.canvas.requestAnimationFrame(function () {
				if (self.inputPhase && self.inputPhase == Module.InputPhase.Move) {
					self.buildPath(self.pointerPos);
					self.drawPath();
				}
			}, true);
		}
	},

	endStroke: function (e) {
		if (!this.inputPhase) return;
		if (e.changedTouches) e = e.changedTouches[0];

		this.inputPhase = Module.InputPhase.End;
		this.pressure = this.getPressure(e);
		var x = e.pageX - $('canvas').offset().left;
		var y = e.pageY - $('canvas').offset().top;
		this.buildPath({x: x, y: y});
		this.drawPath();

		var stroke = new Module.Stroke(this.brush, this.path, NaN, this.color, 0, 1);
		this.strokes.push(stroke);

		delete this.inputPhase;
	},

	buildPath: function (pos) {


		if (this.inputPhase == Module.InputPhase.Begin)
			this.smoothener.reset();

		var pathBuilderValue = isNaN(this.pressure) ? Date.now() / 1000 : this.pressure;

		var pathPart = this.pathBuilder.addPoint(this.inputPhase, pos, pathBuilderValue);
		var smoothedPathPart = this.smoothener.smooth(pathPart, this.inputPhase == Module.InputPhase.End);
		var pathContext = this.pathBuilder.addPathPart(smoothedPathPart);

		this.pathPart = pathContext.getPathPart();
		this.path = pathContext.getPath();

	},

	drawPath: function () {
		this.strokeRenderer.draw(this.pathPart, this.inputPhase == Module.InputPhase.End);
	},

	clear: function () {

		// this.canvas.clear(this.backgroundColor);
	},

	changeColor: function (newColor) {
		this.color = newColor;
		this.strokeRenderer.configure({brush: this.brush, color: this.color});
	},

	getImageCanvas: function (layer, rect) {
		var canvas = document.createElement("canvas");
		var context = canvas.getContext("2d");
		if (!layer) {
			layer = this.canvas;
			rect = this.canvas.bounds;
		}

		canvas.width = rect.width;
		canvas.height = rect.height;
		console.log("rect w: " + rect.width + ", h: " + rect.height);

		var pixels = layer.readPixels(rect);

		// Copy the pixels to a 2D canvas
		var imageData = context.createImageData(rect.width, rect.height);
		imageData.data.set(pixels);
		context.putImageData(imageData, 0, 0);
		return canvas;
	},

	getImage: function () {
		var rect = {
			left: 0,
			top: 0,
			right: Math.floor(this.canvas.width),
			bottom: Math.floor(this.canvas.height),
			width: Math.floor(this.canvas.width),
			height: Math.floor(this.canvas.height)
		};
		const capturedImage = this.getImageCanvas(this.canvas, rect).toDataURL();

		// console.log(capturedImage);
		return capturedImage;
	}
};

Module.addPostScript(function () {
	WILL.init(1600, 1000);
	WILL.color = Module.Color.WHITE;
});


function useBrush() {
	WILL.changeColor(Module.Color.BLACK);
}

function useEraser() {
	WILL.changeColor(Module.Color.WHITE);
}

function saveDrawingToPng() {

	var api = api || new ApiService();
	var dataURL = WILL.getImage();
	var parentId = window.newNodesParent.node_id; //TODO: save global vars somewhere else!!!! godammit
	$('#editor').fadeOut();
	$('#loaderContainer').fadeIn();

	var newNode = {
		//"id": 'child_of_'+parentId,
		"node_id": 'child_of_'+parentId,
		"user_id": "0000", //TODO: get real user id
		"state": "done", //TODO: what is the difference between state and is_finished?
		"parent_node_id": parentId,
		"drawing": dataURL,
		"is_finished": false,
		"children": [],
		"children_node_ids": []
	};
	addNodeToTree(newNode, parentId);
	$('#loaderContainer').fadeOut();
	modalOpener.toggleModalElement();
}



