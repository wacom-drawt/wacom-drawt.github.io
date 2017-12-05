/**
 * @namespace WILL
 */
var WILL = {
	PAPERS_PATH: "Images/Papers",
	TEXTURES_PATH: "Images/Textures",

	VIEW_AREA: Module.RectTools.create(0, 0, screen.deviceWidth, screen.deviceHeight),

	backgroundColor: Module.Color.WHITE,
	strokes: new Array(),
	images: new Array(),

	rightButtonEraser: false,

	/**
	 * Init of WILL
	 *
	 * @param {WILL.Type} type
	 * @param {int} width canvas width
	 * @param {int} height canvas height
	 */
	init: function(type, width, height) {
		this.type = type;
		// this.model = (type == WILL.Type.VECTOR);
		this.model = true;

		this.initInkEngine(width, height);
		this.init2D();
		this.initEvents();
	},

	initInkEngine: function(width, height) {
		if (width > screen.deviceWidth) width = screen.deviceWidth;
		if (height > screen.deviceHeight) height = screen.deviceHeight;

		this.canvas = new Module.InkCanvas(document.getElementById("canvas"), width, height);

		if (WILL.mode == WILL.Mode["GL"]) {
			this.backgroundLayer = null;
			this.strokesLayer = this.canvas.createLayer();

			// for composite blend modes, like ERASE (magic ink)
			this.strokesAndCurrentStrokeLayer = this.canvas.createLayer();
			// recomposition
			// this.viewCacheLayer = this.canvas.createLayer();
		}

		this.transform = Module.MatTools.create();

		this.tools.init();

		this.writer = new WILL.Writer();
	},

	init2D: function() {
		if (WILL.mode == WILL.Mode["GL"]) return;

		this.canvas.surface.style.position = "absolute";
		this.canvas.surface.style.left = 0;
		this.canvas.surface.style.top = 0;
		this.canvas.surface.style.zIndex = "10";

		this.canvas2D = document.getElementById("canvas2d");
		this.canvas2D.style.display = "";

		this.canvas2D.parentNode.style.backgroundColor = Module.Color.toHex(this.backgroundColor);

		this.canvasImages = document.getElementById("canvas_images");
		this.canvasImages.style.display = "";

		this.canvasTransform = document.getElementById("canvas_transform");
		this.canvasTransform.style.display = "";

		this.canvasImage = document.getElementById("canvas_image");

		this.strokesTransform = new Array();

		this.canvas2D.resize = function(width, height) {
			this.width = WILL.canvasImages.width = WILL.canvasTransform.width = WILL.canvasImage.width = width;
			this.height = WILL.canvasImages.height = WILL.canvasTransform.height = WILL.canvasImage.height = height;
		};

		this.canvas2D.resize(this.canvas.surface.width, this.canvas.surface.height);

		Object.defineProperty(Module.Stroke.prototype, "bezierPath", {
			get: function() {
				if (!this.bezierPathValue) {
					this.bezierPathValue = new Module.BezierPath();
					this.bezierPathValue.setStroke(this, WILL.MAX_SCALE_FACTOR);
					this.bezierPathValue.transform = Module.MatTools.create();
					this.bezierPathValue.currentTransform = Module.MatTools.create();
				}

				return this.bezierPathValue;
			},

			set: function(value) {
				this.bezierPathValue = value;
				this.bezierPathValue.transform = Module.MatTools.create();
				this.bezierPathValue.currentTransform = Module.MatTools.create();

			}
		});

		Module.Stroke.prototype.drawBezierPath = function(ctx) {
			this.bezierPath.draw(ctx);
		}

		Object.extend(Module.Stroke.prototype, {
			transform: function(mat) {
				if (mat) {
					this.bezierPath.transform = Module.MatTools.multiply(mat, this.bezierPath.transform);
					this.bezierPath.currentTransform = Module.MatTools.multiply(mat, this.bezierPath.currentTransform);
				}
				else {
					if (!Module.MatTools.isIdentity(this.bezierPath.currentTransform)) {
						this.super.transform(this.bezierPath.currentTransform);
						this.bezierPath.currentTransform = Module.MatTools.create();
					}
				}
			}
		});
	},

	initEvents: function() {
		let pointerDown = (e) => {
			this.writer.beginStroke(e);
		};

		let pointerMove = (e) => {
			e.preventDefault();

			if (this.writer.keepDrawing) {
				if (!this.writer.keepDrawing.a) this.writer.keepDrawing.a = getOffset({pageX: e.pageX, pageY: e.pageY});
				else if (!this.writer.keepDrawing.b) this.writer.keepDrawing.b = getOffset({pageX: e.pageX, pageY: e.pageY});

				if (this.writer.keepDrawing.b) {
					let eventType = e.type.replace("move", (e.type.contains("touch")?"start":"down"));
					let vector = math.vector(this.writer.keepDrawing.a, this.writer.keepDrawing.b);
					let offset = {x: this.writer.keepDrawing.a.x - vector.x*2, y: this.writer.keepDrawing.a.y - vector.y*2};

					delete this.writer.keepDrawing;

					pointerDown({type: eventType, button: 0, offset: offset, preventDefault: function() {}});
				}
				else
					return;
			}

			this.writer.moveStroke(e);
		};

		let pointerUp = (e, out) => {
			if (!out) delete this.writer.keepDrawing;
			if (!this.writer.context) return;

			this.writer.endStroke(e);
		};

		let surfaceOut = (e) => {
			if (Module.RectTools.containsPoint(WILL.VIEW_AREA, e.offset)) return;

			if (this.writer.context) {
				this.writer.keepDrawing = {};
				pointerUp(e, true);
			}
		};

		let getOffset = (e) => {
			if (e.changedTouches) e = e.changedTouches[0];

			let offsetRect = this.canvas.surface.getBoundingClientRect();
			let pt = Module.MatTools.transformPoint({x: e.pageX - WILL.VIEW_AREA.width / 2 - offsetRect.left, y: e.pageY - WILL.VIEW_AREA.height / 2 - offsetRect.top}, Module.MatTools.invert(WILL.transform));
			pt.x += WILL.VIEW_AREA.width / 2;
			pt.y += WILL.VIEW_AREA.height / 2;

			return pt;
		};

		var type = window.PointerEvent?"pointer":"mouse";

		this.canvas.surface.addEventListener(type + "down", function(e) {WILL.contextMenu.show(e, WILL.contextMenu.Type.PASTE);});

		if (tools.android || tools.iOS) {
			Object.defineProperty(TouchEvent.prototype, "offset", {get: function() {return getOffset(this)}});
			Object.defineProperty(TouchEvent.prototype, "offsetX", {get: function() {return this.offset.x}});
			Object.defineProperty(TouchEvent.prototype, "offsetY", {get: function() {return this.offset.y}});

			this.canvas.surface.addEventListener("touchstart", pointerDown);
			this.canvas.surface.addEventListener("touchmove", pointerMove);
			document.addEventListener("touchmove", surfaceOut);
			document.addEventListener("touchend", pointerUp);
		}
		else {
			if (window.PointerEvent) {
				Object.defineProperty(PointerEvent.prototype, "offset", {get: function() {return getOffset(this)}});

				this.canvas.surface.addEventListener("pointerdown", pointerDown);
				this.canvas.surface.addEventListener("pointermove", pointerMove);
				document.addEventListener("pointermove", surfaceOut);
				document.addEventListener("pointerup", pointerUp);
			}
			else {
				Object.defineProperty(MouseEvent.prototype, "offset", {get: function() {return getOffset(this)}});

				this.canvas.surface.addEventListener("mousedown", pointerDown);
				this.canvas.surface.addEventListener("mousemove", pointerMove);
				document.addEventListener("mousemove", surfaceOut);
				document.addEventListener("mouseup", pointerUp);
			}
		}

		window.addEventListener("orientationchange", function(e) {
			WILL.VIEW_AREA = Module.RectTools.create(0, 0, screen.deviceWidth, screen.deviceHeight);
			$(window).trigger("resize");
		}, false);

		window.addEventListener("unload", () => this.canvas.ctx.getExtension("WEBGL_lose_context").loseContext());
	},

	/**
	 * Prepare canvas with background
	 *
	 * @param {(string | Module.Color)} paperORcolor papers is image name
	 */
	setBackground: function(paperORcolor) {
		if (typeof paperORcolor == "string") {
			var paper = paperORcolor;

			Module.GLTools.prepareTexture(Module.GLTools.createTexture(GLctx.REPEAT, GLctx.LINEAR), WILL.PAPERS_PATH + "/" + paper + ".jpg", function(texture) {
				if (this.backgroundLayer) this.backgroundLayer.delete();

				this.backgroundLayer = this.canvas.createLayer({texture: texture});
				this.refresh(WILL.VIEW_AREA);
			}, this);
		}
		else {
			var color = paperORcolor;

			this.backgroundColor = color;
			this.refresh(WILL.VIEW_AREA);
		}
	},

	/**
	 * Redraw canvas with modified layers data
	 *
	 * @param {Module.Rectangle} [dirtyArea=WILL.VIEW_AREA] canvas area to refresh
	 */
	redraw: function(dirtyArea) {
		if (!dirtyArea) return;

		if (WILL.mode == WILL.Mode["2D"]) {
			this.refresh(dirtyArea);
			return;
		}

		this.strokesLayer.clear(dirtyArea);

		WILL.strokes.forEach(function(stroke) {
			var affectedArea = Module.RectTools.intersect(stroke.bounds, dirtyArea);

			if (affectedArea) {
				WILL.writer.strokeRenderer.draw(stroke);
				WILL.writer.strokeRenderer.blendStroke(this.strokesLayer, stroke.blendMode, affectedArea);
			}
		}, this);

		this.refresh(dirtyArea);
	},
/*
	queryStrokeSegments: function(rect) {
		var result = new Array();

		this.strokes.forEach(function(stroke) {
			if (Module.RectTools.intersect(stroke.bounds, rect)) {
				var indices = new Array();

				for (var i = 0; i < stroke.segments.length; i++) {
					if (utils.intersect(rect, stroke.segments[i]))
						indices.push(i);
				}

				if (indices.length > 0) {
					var subset = {stroke: stroke, indices: indices};
					result.push(subset);
				}
			}
		}, this);

		return result;
	},

	redrawSubsets: function(subsets, dirtyArea) {
		dirtyArea = this.ensureVisibleArea(dirtyArea);
		if (!dirtyArea) return;

		this.strokesLayer.clear(dirtyArea);

		if (subsets) {
			var points = new Float32Array(4);

			subsets.forEach(function(subset) {
				var stroke = subset.stroke;
				var indices = subset.indices;

				for (var i = 0; i < indices.length; i++) {
					var first = indices[i] == 0;
					var last = indices[i] == stroke.points.length - 4;

					points[0] = stroke.segments[i].left;
					points[1] = stroke.segments[i].top;
					points[2] = stroke.segments[i].width;
					points[3] = stroke.segments[i].height;

					var path = Module.PathBuilder.createPath(points, stroke.path.stride);
					this.strokesLayer.drawStroke(stroke.brush, path, stroke.width, stroke.color, first, last, (first?stroke.ts:0), (last?stroke.tf:1), null);
				}
			}, this);
		}

		this.refresh(dirtyArea);
	},
*/
	/**
	 * Refresh canvas with modified layers data
	 *
	 * @param {Module.Rectangle} dirtyArea canvas area to refresh
	 */
	refresh: function(dirtyArea) {
		if (!dirtyArea) return;

		if (!this.writer.context && WILL.mode == WILL.Mode["2D"]) {
			this.refresh2D(dirtyArea);
			return;
		}

		var strokesLayer = this.strokesLayer;
		var transformArea = Module.MatTools.transformRect(dirtyArea, this.transform);

		// this.canvas.fillPath(Module.RectTools.getPath(dirtyArea), Module.Color.GREEN, false);
		// this.canvas.fillPath(Module.RectTools.getPath(transformArea), Module.Color.RED, false);

		if (this.writer.context && this.writer.tool.type != WILL.Tool.Type.ERASER) {
			strokesLayer = this.strokesAndCurrentStrokeLayer;

			this.strokesAndCurrentStrokeLayer.blend(this.strokesLayer, {mode: Module.BlendMode.NONE, rect: dirtyArea});

			if (this.writer.context.inputPhase == Module.InputPhase.Move) {
				// this.writer.strokeRenderer.color = Module.Color.RED;
				// this.writer.strokeRenderer.color.alpha = NaN;
				this.writer.strokeRenderer.drawPreliminary(this.writer.context.preliminaryPathPart);
				// this.writer.strokeRenderer.color = this.writer.color;
				// this.writer.strokeRenderer.color.alpha = NaN;
			}

			this.writer.strokeRenderer.blendUpdatedArea(this.strokesAndCurrentStrokeLayer);
		}

		if (this.backgroundLayer)
			this.canvas.blend(this.backgroundLayer, {mode: Module.BlendMode.NONE, rect: transformArea});
		else
			this.canvas.clear(transformArea, this.backgroundColor);

		this.canvas.blend(strokesLayer, {sourceRect: dirtyArea, destinationRect: transformArea});

		if (this.selection.layer)
			this.canvas.blend(this.selection.layer, {transform: this.selection.originTransform});

		// this.canvas.blend(this.viewCacheLayer, {mode: Module.BlendMode.NONE, rect: dirtyArea});
		// this.canvas.blendWithRectTransform(this.viewCacheLayer, dirtyArea, this.selection.makeScaleAtPoint((window.devicePixelRatio > 1)?window.devicePixelRatio:1 / window.devicePixelRatio, 0, 0), Module.BlendMode.NONE);
	},

	refresh2D: function(dirtyArea) {
		dirtyArea = this.ensureVisibleArea(dirtyArea);
		if (!dirtyArea) return;

		var transformedArea = this.viewToModel(dirtyArea);

		var ctx = this.canvas2D.getContext("2d");

		ctx.save();

		ctx.beginPath();
		ctx.rect(dirtyArea.left, dirtyArea.top, dirtyArea.width, dirtyArea.height);
		ctx.clip();
		ctx.clearCanvas();
		// ctx.clearRect(dirtyArea.left, dirtyArea.top, dirtyArea.width, dirtyArea.height);

		this.strokes.forEach(function(stroke) {
			var affectedArea = Module.RectTools.intersect(stroke.bounds, transformedArea);

			if (affectedArea)
				stroke.drawBezierPath(ctx);
		}, this);

		if (this.incomplete) {
			for (var strokeID in this.incomplete) {
				var stroke = this.incomplete[strokeID];

				if (stroke.bezierPaths && stroke.bezierPaths.length > 0) {
					var affectedArea = Module.RectTools.intersect(stroke.bounds, transformedArea);

					if (affectedArea) {
						var bezierPathCtx = Module.BezierPath.getContext(ctx);

						bezierPathCtx.beginPath();

						stroke.bezierPaths.forEach(function(bezierPath) {
							affectedArea = Module.RectTools.intersect(bezierPath.bounds, transformedArea);
							if (affectedArea) bezierPathCtx.drawSegment(bezierPath);
						});

						bezierPathCtx.completePath();
					}
				}
			}
		}

		ctx.restore();
	},

	refreshImages: function() {
		var ctx = this.canvasImages.getContext("2d");
		ctx.clearCanvas();

		var images = new Array();

		var topCache = new Object();
		var topSort = new Array();

		this.images.forEach(function(image) {
			if (image && image != WILL.selection.image) {
				if (image.top) {
					topSort.push(image.top);
					topCache[image.top] = image;
				}
				else
					images.push(image);
			}
		}, this);

		topSort.sort(function(a, b) {
			return a - b;
		});

		topSort.forEach(function(timestamp) {
			images.push(topCache[timestamp]);
		}, this);

		images.forEach(function(image) {
			var affectedArea = Module.RectTools.intersect(this.modelToView(image.bounds), WILL.VIEW_AREA);

			if (affectedArea)
				this.refreshImage(ctx, image);
		}, this);
	},

	refreshImage: function(ctx, image) {
		var transform = Module.MatTools.multiply(this.transform, image.data.transform);

		ctx.setTransform(transform.a, transform.b, transform.c, transform.d, transform.tx, transform.ty);
		ctx.drawImage(image, 0, 0);
		ctx.setTransform(1, 0, 0, 1, 0, 0);
	},

	refreshTransform: function() {
		var ctx = this.canvasTransform.getContext("2d");
		ctx.clearCanvas();

		this.strokesTransform.forEach(function(stroke) {
			var affectedArea = Module.RectTools.intersect(this.modelToView(stroke.bounds), WILL.VIEW_AREA);

			if (affectedArea)
				stroke.drawBezierPath(ctx);
		}, this);
	},

	modelToView: function(modelRect) {
		if (Module.MatTools.isIdentity(this.transform))
			return modelRect;
		else
			return Module.MatTools.transformRect(modelRect, this.transform);
	},

	viewToModel: function(viewRect) {
		if (Module.MatTools.isIdentity(this.transform))
			return viewRect;
		else
			return Module.MatTools.transformRect(viewRect, Module.MatTools.invert(this.transform));
	},

	ensureVisibleArea: function(dirtyArea) {
		dirtyArea = Module.RectTools.intersect(dirtyArea, this.canvas.bounds);
		dirtyArea = Module.RectTools.ceil(dirtyArea);

		return dirtyArea;
	},

	/**
	 * Tool setter for primary writer in canvas
	 *
	 * @see WILL.Writer#setTool
	 * @param {*} tool check WILL.Writer#setTool for details
	 */
	setTool: function(tool) {
		this.writer.setTool(tool);
	},

	/**
	 * Color setter for primary writer in canvas
	 *
	 * @see WILL.Writer#setColor
	 * @param {*} color check WILL.Writer#setColor for details
	 */
	setColor: function(color) {
		this.writer.setColor(color);
	},

	/**
	 * UNDO for primary writer in canvas
	 *
	 * @see WILL.history.undo
	 */
	undo: function() {
		this.history.undo();
	},

	/**
	 * REDO for primary writer in canvas
	 *
	 * @see WILL.history.redo
	 */
	redo: function() {
		this.history.redo();
	},

	/**
	 * Clears canvas content
	 */
	clear: function() {
		this.history.add(WILL.VIEW_AREA);
		this.selection.hide();

		this.strokes = new Array();
		this.images = new Array();

		if (WILL.mode == WILL.Mode["GL"]) {
			this.strokesLayer.clear();
			this.refresh(WILL.VIEW_AREA);
		}
		else {
			this.redraw(WILL.VIEW_AREA, true);
			this.refreshImages();
		}
	},

	zoom: function(scale) {
		this.transform.a = scale;
		this.transform.d = scale;

		this.canvas.clear();
		this.refresh(WILL.VIEW_AREA);
	},

	pan: function(dx, dy) {
		this.transform.tx += dx;
		this.transform.ty += dy;

		this.canvas.clear();
		this.refresh(WILL.VIEW_AREA);
	},

	/**
	 * Resize HTML canvas and all related layers
	 *
	 * @param {int} width
	 * @param {int} height
	 */
	resize: function(width, height) {
		if (width > screen.deviceWidth) width = screen.deviceWidth;
		if (height > screen.deviceHeight) height = screen.deviceHeight;

		this.canvas.resize(width, height);
		if (WILL.mode == WILL.Mode["2D"]) this.canvas2D.resize(width, height);

		this.refresh(WILL.VIEW_AREA);

		if (WILL.mode == WILL.Mode["2D"]) {
			this.refresh2D(WILL.VIEW_AREA);
			this.refreshImages();
			this.selection.refreshImage();
		}
	},

	/**
	 * Creates 2d contexed canvas, which contains pixels data from layer.
	 * When selection available, params not needed.
	 *
	 * @param {Module.Layer} layer data layer
	 * @param {Module.Rectangle} rect area to read from
	 * @return {HTMLCanvas} canvas as image container
	 */
	getImageCanvas: function(layer, rect) {
		var canvas = document.createElement("canvas");
		var context = canvas.getContext("2d");

		if (this.selection.visible()) {
			layer = layer = WILL.strokesLayer;
			rect = WILL.selection.selection.toRect();

			rect = Module.RectTools.ceil(rect);
		}
		else if (!layer) {
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

	resizeCanvas: function(canvas, scaleFactor) {
		var result = document.createElement("canvas");
		var context = result.getContext("2d");

		result.width = canvas.width * scaleFactor;
		result.height = canvas.height * scaleFactor;

		context.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, result.width, result.height);

		return result;
	},

	importImage: function(obj, confirmed, callback) {
		if (!obj) obj = "ImageLibrary/Image1.jpg";

		if (obj instanceof Event) {
			var input = obj.currentTarget;

			var list = input.files;
			var file = list[0];

			if (file.name.match(/\.(jpg|jpeg|png|gif)$/)) {
				var reader = new FileReader();

				reader.onload = function(e) {
					var buffer = e.target.result;
					var bytes = new Uint8Array(buffer);
					var ext = file.name.split(".").last;

					Image.fromBytes(bytes, function() {
						WILL.initImage(this, confirmed);
						if (callback) callback(this);
					}, ext);
				};

				reader.readAsArrayBuffer(file);
			}
			else
				alert("Only images allowed!");
		}
		else {
			var data = obj.src?obj:null;
			var src = obj.src?obj.src:obj;

			var image = new Image();

			image.onload = function() {
				WILL.initImage(this, data, confirmed);
				if (callback) callback(this);
			};

			image.data = {src: src};
			// image.src = "ImageLibrary/Image" + src + ".jpg";
			image.src = src;
		}
	},

	initImage: function(image, data, confirmed) {
		if (data)
			image.data = data;
		else {
			var scale = 1;

			var wRect = Module.RectTools.create(0, 0, $(window).width(), $(window).height());
			wRect = Module.MatTools.transformRect(wRect, Module.MatTools.invert(this.transform));

			if (image.width >= wRect.width || image.height >= wRect.height) {
				if (image.width > image.height) {
					scale = (wRect.width / image.width) * 0.8;

					if (image.height * scale >= wRect.height)
						scale = (wRect.height / image.height) * 0.8;
				}
				else
					scale = (wRect.height / image.height) * 0.8;
			}

			var tx = Math.floor(wRect.width / 2 - (image.width * scale) / 2) + wRect.left;
			var ty = Math.floor(wRect.height / 2 - (image.height * scale) / 2) + wRect.top;

			image.data.transform = Module.MatTools.create({a: scale, d: scale, tx: tx, ty: ty});
		}

		Object.defineProperty(image, "origin", {
			get: function() {
				return Module.RectTools.create(-this.width / 2, -this.height / 2, this.width, this.height);
			}
		});

		Object.defineProperty(image, "bounds", {
			get: function() {
				var rect = Module.RectTools.create(0, 0, this.width, this.height);
				rect = Module.MatTools.transformRect(rect, this.data.transform);

				return rect;
			}
		});

		if (!WILL.rtc) {
			this.images.push(image);

			this.refreshImages();

			this.selection.create(image);
			this.selection.show();
		}
	},

	/**
	 * Export canvas as PNG
	 */
	exportPNG: function() {
		this.getImageCanvas().toBlob(function(blob) {
			WILL.selection.hide();
			tools.saveAs(blob, "export.png");
		});
	},

	/**
	 * Export canvas or selection area in proper WILL format
	 */
	export: function() {
		if (this.selection.visible()) {
			this.save(true);
			this.selection.hide();
		}
		else
			alert("Selection not available yet!");
	},

	/**
	 * Import canvas data
	 *
	 * @param {Event} change event on file input to achieve control over file reading
	 */
	import: function(e) {
		this.load(e, true, WILL.contextMenu.pos);
	},

	/**
	 * Saves canvas data in proper WILL format
	 *
	 * @param {boolean} selection using selection strokes or all strokes from canvas
	 */
	save: function(selection) {
		var data = this.io.serializeWithFileFormat(selection);
		// var data = this.io.serialize(selection);
		tools.saveAs(data, "export" + WILL.io.getExtension(), "image/" + WILL.io.getExtension().substring(1));
	},

	/**
	 * Loads canvas data from proper WILL format
	 *
	 * @param {Event} e change event on file input to achieve control over file reading
	 * @param {boolean} selection to create selection or to override canvas data
	 * @param {Object} pos when selection needed, x & y for it
	 */
	load: function(e, selection, pos) {
		var input = e.currentTarget;

		var list = input.files;
		var file = list[0];

		if (file.name.endsWith(this.io.getExtension())) {
			var reader = new FileReader();

			reader.onload = function(e) {
				var buffer = e.target.result;
				if (!selection) WILL.clear();
				WILL.io.restoreFromFile(buffer, selection, pos);
			};

			reader.readAsArrayBuffer(file);
		}
		else
			alert("Unsupported file type selected. Supported extension is " + this.io.getExtension() + "!");
	},

	saveStrokes: function() {
		var data = this.io.serializeStrokes();
		tools.saveAs([data], "strokes.txt", "plain/txt");
	},

	loadStrokes: function(e) {
		var input = e.currentTarget;
		var list = input.files;
		var file = list[0];
		var reader = new FileReader();

		reader.onload = function(e) {
			var data = e.target.result;

			WILL.clear();
			WILL.io.deserializeStrokes(data);

			WILL.redraw(WILL.VIEW_AREA);
		};

		reader.readAsText(file);
	},

	calculateBounds: function() {
		var bounds;

		this.strokes.forEach(function(stroke) {
			bounds = Module.RectTools.union(bounds, stroke.bounds);
		});

		this.images.forEach(function (image) {
			if (image)
				bounds = Module.RectTools.union(bounds, image.bounds);
		});

		return bounds;
	}
};

/**
 * Enum for WILL Type
 *
 * @readonly
 * @enum {Object}
 * @typedef {Object} WILL.Type
 * @property {Object} VECTOR writer draws vector graphics, strokes model available
 * @property {Object} RASTER writer draws raster graphics, strokes model not available
 */
Function.prototype.createEnum.call(WILL, "Type", ["VECTOR", "RASTER"]);
Function.prototype.createEnum.call(WILL, "Mode", ["GL", "2D"]);
