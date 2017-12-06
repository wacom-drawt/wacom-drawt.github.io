WILL = {
	backgroundColor: Module.Color.WHITE,
	color: Module.Color.from(0, 0, 0),

	strokes: new Array(),

	init: function (width, height, image) {
		console.log(image);
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

		if (window.PointerEvent) {
			this.pressurePathBuilder = new Module.PressurePathBuilder();
			this.pressurePathBuilder.setNormalizationConfig(0.195, 0.88);
			this.pressurePathBuilder.setPropertyConfig(Module.PropertyName.Width, 2.05, 34.53, 0.72, NaN, Module.PropertyFunction.Power, 1.19, false);
		}

		this.strokeRenderer = new Module.StrokeRenderer(this.canvas, this.canvas);
		this.strokeRenderer.configure({brush: this.brush, color: this.color});
	},

	initImageLayer: function () {
		console.log('setting canvas bg image');
		var url = this.oldImage;
		// var url = location.toString();
		// url = url.substring(0, url.lastIndexOf("/")) + "/image.jpg";

		this.imageLayer = this.canvas.createLayer({width: 750, height: 600});

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

		this.buildPath({x: e.clientX - 130, y: e.clientY - 30});
		this.drawPath();
	},

	moveStroke: function (e) {
		if (!this.inputPhase) return;
		if (e.changedTouches) e = e.changedTouches[0];

		this.inputPhase = Module.InputPhase.Move;
		this.pointerPos = {x: e.clientX - 130, y: e.clientY - 30};
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

		this.buildPath({x: e.clientX - 130, y: e.clientY - 30});
		this.drawPath();

		var stroke = new Module.Stroke(this.brush, this.path, NaN, this.color, 0, 1);
		this.strokes.push(stroke);

		delete this.inputPhase;
	},

	buildPath: function (pos) {
		var pathBuilderValue = isNaN(this.pressure) ? Date.now() / 1000 : this.pressure;

		var pathPart = this.pathBuilder.addPoint(this.inputPhase, pos, pathBuilderValue);
		var pathContext = this.pathBuilder.addPathPart(pathPart);

		this.pathPart = pathContext.getPathPart();
		this.path = pathContext.getPath();
	},

	drawPath: function () {
		this.strokeRenderer.draw(this.pathPart, this.inputPhase == Module.InputPhase.End);
	},

	clear: function () {

		// this.canvas.clear(this.backgroundColor);
	},

	changeColor: function () {
		if (this.color == Module.Color.WHITE) {
			this.color = Module.Color.BLACK;
		}
		else {
			this.color = Module.Color.WHITE;
		}
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
			right: this.canvas.width,
			bottom: this.canvas.height,
			width: this.canvas.width,
			height: this.canvas.height
		}
		const capturedImage = this.getImageCanvas(this.canvas, rect).toDataURL();

		// console.log(capturedImage);
		return capturedImage;
	}
};

Module.addPostScript(function () {
	WILL.init(1600, 1000);
	WILL.color = Module.Color.WHITE;
});


function changeDrawColor() {
	// var property = document.getElementById(button);
	//     if (count == 0) {
	//         property.style.backgroundColor = "#3f3f3f"
	//         count = 1;
	//     }
	//     else {
	//         property.style.backgroundColor = "#ffffff"
	//         count = 0;
	//     }
	WILL.changeColor();
}

function saveDrawingToPng() {
	
	console.log('in submit"s onclick');

	var api = api || new ApiService();
	var dataURL = WILL.getImage();
	
	var id = window.newNodeId;
	var parentId = window.newNodesParent.node_id;
	api.submitDrawing(id, dataURL, function (resp) {
		var newNode = {
			"node_id": id,
			"user_id": 2,
			"state": "done",
			"parent_node_id": parentId,
			"drawing": dataURL,
			"is_finished": true,
			"children": []
		};
	$('#theModal').modal('toggle');
		init();
	}, function () {
		console.log('failed adding new picture..');
	});

	//
	// var canvas = document.getElementById("canvas");
	// var img = canvas.toDataURL("image/png");

	// console.log(dataURL);
	// $.ajax({
	//    type: "POST",
	//    url: "https://drawtwacom.herokuapp.com/submit",
	//    data: {
	//     drawing: dataURL,
	//     //drawing: "dataURL",
	//     node_id: "0"
	//    }
	// }).done(function(o) {
	// console.log('saved');
	// // If you want the file to be visible in the browser
	// // - please modify the callback in javascript. All you
	// // need is to return the url to the file, you just saved
	// // and than put the image in your browser.
	// });
}



