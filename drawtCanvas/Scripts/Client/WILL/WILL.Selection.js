/**
 * @namespace WILL.selection
 */
WILL.selection = {
	minWidth: 80,
	minHeight: 80,
	strokeWidth: 1,

	transformed: false,
	strokes: null,
	stroke: null,
	rect: null,
	path: null,
	layer: null,
	maskLayer: null,
	clipboard: null,

	splits: null,

	/**
	 * Configures new selection
	 */
	create: function(image) {
		this.transformed = false;
		this.strokes = new Array();
		this.splits = new Array();

		delete this.selector;

		this.image = image;
		this.refreshImage(true);

		if (!this.selection) {
			this.selection = document.querySelector(".Selection");

			this.selection.onmousedown = function() {
				this.style.cursor = "move";
			};

			this.selection.onmouseup = function() {
				this.style.cursor = "";
			};

			this.selection.querySelector(".DragHandle").style.display = "none";

			Transformer.addTranslate(this.selection);
			Transformer.addScale(this.selection, {KeepRatio: true});
			// Transformer.addScale(this.selection, {ExcludeRotation: true});

			Transformer.addRotate(this.selection, {
				Handles: [this.selection.querySelector(".RotateHandle.Top"), this.selection.querySelector(".RotateHandle.Bottom")]
			});

			this.selection.addEventListener("TransformStart", function(e) {
				this.transform = WILL.transform;
			});

			this.selection.addEventListener("Transform", function(e) {
				WILL.selection.transform(e.detail);
			}, false);
		}
	},

	/**
	 * Initilalise type, rect & path
	 * Initilalise origin & originTransform when RASTER selection
	 */
	init: function() {
		var origin;
		var path;
		var transform;

		if (this.image) {
			origin = this.image.origin;
			transform = this.image.data.transform;
		}
		else  {
			if (this.selector) {
				origin = Module.RectTools.ceil(this.selector.bounds, true);
				path = this.selector.path;
			}
			else {
				this.strokes.forEach(function(stroke) {
					origin = Module.RectTools.union(origin, stroke.bounds);
				}, this);

				origin = Module.RectTools.ceil(origin);
			}

			transform = Module.MatTools.makeTranslate(origin.left, origin.top);
		}

		var center = {x: origin.width / 2, y: origin.height / 2};
		var translate = Module.MatTools.makeTranslate(center.x, center.y);
		transform = Module.MatTools.multiply(transform, translate);
		transform = Module.MatTools.multiply(WILL.transform, transform);

		this.rect = Module.RectTools.create(-origin.width / 2, -origin.height / 2, origin.width, origin.height);
		this.rect = Module.RectTools.ceil(this.rect, true);

		this.path = new Array();
		this.type = path?"Path":"Rect";

		if (!path) {
			var width = Math.max(this.minWidth, this.rect.width);
			var height = Math.max(this.minHeight, this.rect.height);
			var frame = Module.RectTools.create(this.rect.left, this.rect.top, width, height);

			path = Module.RectTools.getPath(frame);
		}

		for (var i = path.stride; i < path.points.length - path.stride; i += path.stride) {
			var point = {x: path.points[i], y: path.points[i+1]};

			if (this.selector) {
				point.x -= center.x + origin.left;
				point.y -= center.y + origin.top;
			}

			this.path.push(point.x + "," + point.y);
		}

		if (WILL.type == WILL.Type.RASTER) {
			this.origin = Module.MatTools.transformRect(this.rect, transform);
			this.originTransform = Module.MatTools.create();
		}

		return transform;
	},

	/**
	 * Display selection over canvas
	 *
	 * @param {boolean} paste is paste action comes from
	 */
	show: function(paste, transform) {
		if (!paste) transform = this.init();

		var width = Math.max(this.minWidth, this.rect.width);
		var height = Math.max(this.minHeight, this.rect.height);

		this.selection.style.left = this.rect.left + "px";
		this.selection.style.top = this.rect.top + "px";
		this.selection.style.width = width + "px";
		this.selection.style.height = height + "px";
		this.selection.style.transform = this.selection.style.webkitTransform = Module.MatTools.toCSS(transform);

// this.applyUI(this.selection);

		this.selection.querySelector("svg").setAttribute("viewBox", this.rect.left + " " + this.rect.top + " " + width + " " + height);
		this.selection.querySelector("path").setAttribute("d", "M " + this.path.join(" L ") + " Z");
		this.selection.querySelector("path").style.strokeWidth = this.strokeWidth;

		$(this.selection).addClass(this.type + "Selection");
		this.selection.style.display = "";

		if (WILL.type == WILL.Type.RASTER && !paste)
			this.createSelectionWithControlPoints();
	},

applyUI: function(obj) {
	var transform = obj.frame.getTransformStyle();
// console.log(JSON.stringify(transform))
	var left = obj.frame.getMathStyle("left");
	var top = obj.frame.getMathStyle("top");
	var width = obj.frame.getMathStyle("width");
	var height = obj.frame.getMathStyle("height");

	var center = {x: left + width / 2, y: top + height / 2};
// console.log(center)
	width *= transform.scale.x;
	height *= transform.scale.y;
	left = center.x - width / 2 + transform.translate.x;
	top = center.y - height / 2 + transform.translate.y;

// console.log(left, top, width, height)

	obj.style.left = left + "px";
	obj.style.top = top + "px";
	obj.style.width = width + "px";
	obj.style.height = height + "px";

	obj.style.transform = "rotate(" + transform.rotate.angle + "rad)";
},

	/**
	 * Hides selection if available
	 */
	hide: function() {
		if (!this.selection || this.selection.style.display == "none") return;

		this.selection.style.display = "none";
		$(this.selection).removeClass(this.type + "Selection");

		WILL.contextMenu.hide();

		this.completeSelection();
		this.rect = null;
	},

	completeSelection: function() {
		if (this.layer) {
			if (this.appendSelectionOnComplete) {
				// if we haven't save the state already
				if (!this.selectionRemovedFromAllStrokes)
					WILL.history.add(WILL.VIEW_AREA);

				WILL.strokesLayer.blend(this.layer, {transform: this.originTransform});
			}

			this.removeSelection();
		}
		else if (WILL.mode == WILL.Mode["2D"]) {
			if (this.image) {
				this.image.top = Date.now();
				delete this.image;

				WILL.refreshImages();
				WILL.canvasImage.style.display = "none";
			}
			else {
				this.strokes.forEach(function(stroke) {
					stroke.transform();
				}, this);
			}
		}
	},

	/**
	 * Is selection available
	 */
	visible: function() {
		return !!(this.selection && this.selection.style.display == "");
	},

	split: function() {
		this.splits.forEach(function(split) {
			WILL.strokes.replace(split.stroke, split.strokes);
		}, this);

		this.splits = new Array();
	},

	/**
	 * Translate selection
	 *
	 * @param {int} x
	 * @param {int} y
	 */
	translate: function(pos) {
		var transform = this.selection.getTransformStyle().matrix;

		var offsetX = pos.x - transform.tx;
		var offsetY = pos.y - transform.ty;
		var translate = Module.MatTools.makeTranslate(offsetX, offsetY);

		transform = Module.MatTools.multiply(translate, transform);
		this.selection.style.transform = this.selection.style.webkitTransform = Module.MatTools.toCSS(transform)

		this.transform(translate);
	},

	/**
	 * Executes transformation
	 *
	 * @param {Module.Matrix2D} mat transform matrix
	 * @param {boolean} [discardRedraw] skips redraw after transformation
	 */
	transform: function(mat, discardRedraw) {
		if (this.image)
			this.transformImage(mat);
		else {
			if (WILL.type == WILL.Type.VECTOR)
				this.transformStrokes(mat, discardRedraw);
			else
				this.transfromSelectionLayer(mat);
		}
	},

	transformImage: function(mat) {
		this.image.data.transform = Module.MatTools.multiply(mat, this.image.data.transform);
		this.refreshImage();
	},

	refreshImage: function(create) {
		if (!this.image) return;

		var ctx = WILL.canvasImage.getContext("2d");
		ctx.clearCanvas();

		WILL.refreshImage(ctx, this.image);
		if (create) WILL.refreshImages();

		WILL.canvasImage.style.display = "";
	},

	transformStrokes: function(mat, discardRedraw) {
		if (!this.transformed) {
			this.split();
			WILL.history.add();

			this.transformed = true;
		}

		this.strokes.forEach(function(stroke) {
			stroke.transform(mat);
		});

		if (!discardRedraw)
			WILL.redraw(WILL.VIEW_AREA);
	},

	transfromSelectionLayer: function(mat) {
		this.cutOutSelectionLayerFromAllStrokes();
		this.originTransform = Module.MatTools.multiply(mat, this.originTransform);

		WILL.refresh(WILL.VIEW_AREA);
	},

	cutOutSelectionLayerFromAllStrokes: function() {
		if (!this.selectionRemovedFromAllStrokes && this.maskLayer) {
			this.createLayer();

			WILL.history.add(WILL.VIEW_AREA);
			WILL.strokesLayer.blend(this.maskLayer, {mode: Module.BlendMode.MULTIPLY_NO_ALPHA_INVERT});

			this.appendSelectionOnComplete = true;
			this.selectionRemovedFromAllStrokes = true;
			this.maskLayer = null;
		}
	},

	createLayer: function() {
		if (!this.layer) {
			this.layer = WILL.canvas.createLayer();

			this.layer.blend(WILL.strokesLayer, {mode: Module.BlendMode.NONE});
			this.layer.blend(this.maskLayer, {mode: Module.BlendMode.MULTIPLY_NO_ALPHA});
		}
	},

	createSelectionWithControlPoints: function() {
		// if (!this.maskLayer) this.maskLayer = WILL.canvas.createLayer()
		this.maskLayer = WILL.canvas.createLayer()
		this.maskLayer.clear();

		WILL.selection.maskLayer.fillPath(this.selector.path, Module.Color.WHITE, true);

		GLctx.flush();

		this.appendSelectionOnComplete = false;
		this.selectionRemovedFromAllStrokes = false;
	},

	removeSelection: function() {
		this.layer = null;
		this.maskLayer = null;
	},

	/**
	 * Cut selection data
	 */
	cut: function() {
		this.copy(true);
	},

	/**
	 * Copy selection data
	 */
	copy: function(cut) {
		this.clipboard = new Object();

		if (this.image)
			this.clipboard.imageData = this.image.data;
		else {
			if (WILL.type == WILL.Type.VECTOR) {
				this.clipboard.strokes = this.strokes.clone();

				if (cut)
					this.split();
				else
					this.splits = new Array();
			}
			else {
				this.createLayer();

				var pixels = this.layer.readPixels(this.origin);

				this.clipboard.pixels = pixels;
				this.clipboard.origin = this.origin;
				this.clipboard.originTransform = this.originTransform;
			}
		}

		this.clipboard.type = this.type;
		this.clipboard.rect = this.rect;
		this.clipboard.path = this.path;
		// this.clipboard.transform = Transformer.transform;
		this.clipboard.transform = Module.MatTools.multiply(Module.MatTools.invert(WILL.transform), Transformer.transform);

		if (cut)
			this.delete();
		else
			this.hide();
	},

	/**
	 * Paste selection data
	 *
	 * @param {Event} e where to create selection
	 */
	paste: function(e) {
		if (!this.clipboard) return;

		this.create();

		if (WILL.type == WILL.Type.VECTOR)
			this.strokes = Object.clone(this.clipboard.strokes);
		else {
			this.origin = Object.clone(this.clipboard.origin);;
			this.originTransform = Object.clone(this.clipboard.originTransform);
		}

		this.type = this.clipboard.type;
		this.rect = Object.clone(this.clipboard.rect);
		this.path = Object.clone(this.clipboard.path);

		var pos = tools.getMousePos(e);
		var offsetX = pos.x - this.clipboard.transform.tx;
		var offsetY = pos.y - this.clipboard.transform.ty;
		var translate = Module.MatTools.makeTranslate(offsetX, offsetY);

		if (WILL.type == WILL.Type.VECTOR) {
			this.strokes.forEach(function(stroke) {
				stroke.bounds.left += offsetX;
				stroke.bounds.right += offsetX;
				stroke.bounds.top += offsetY;
				stroke.bounds.bottom += offsetY;

				WILL.strokes.push(stroke);
			}, this);

			this.transform(translate);
		}
		else {
			this.originTransform = Module.MatTools.multiply(translate, this.originTransform);
			this.createRasterSelection();
		}

		var transform = Module.MatTools.multiply(translate, this.clipboard.transform);
		transform = Module.MatTools.multiply(WILL.transform, transform);

		this.show(true, transform);
	},

	createRasterSelection: function() {
		// if (!this.layer) this.layer = WILL.canvas.createLayer();
		this.layer = WILL.canvas.createLayer();
		this.layer.clear();

		var bytes = this.clipboard.pixels;
		this.layer.writePixels(bytes, this.origin);

		this.appendSelectionOnComplete = true;
		this.selectionRemovedFromAllStrokes = false;
		this.maskLayer = null;

		WILL.refresh(WILL.VIEW_AREA);
	},

	/**
	 * Delete selection data
	 */
	delete: function() {
		WILL.history.add();

		if (WILL.type == WILL.Type.VECTOR) {
			var dirtyArea;
			this.split();

			this.strokes.forEach(function(stroke) {
				dirtyArea = Module.RectTools.union(dirtyArea, stroke.bounds);
				WILL.strokes.remove(stroke);
			});

			WILL.redraw(WILL.modelToView(dirtyArea));
		}
		else {
			this.cutOutSelectionLayerFromAllStrokes();
			this.removeSelection();

			WILL.refresh(WILL.VIEW_AREA);
		}

		this.hide();
	},

	/**
	 * Changes selected strokes color
	 *
	 * @param {Module.Color} color new color
	 */
	changeStrokesColor: function(color) {
		if (WILL.type == WILL.Type.VECTOR) {
			var dirtyArea = null;

			WILL.history.add();
			this.split();

			this.strokes.forEach(function(stroke) {
				stroke.color = color;
				dirtyArea = Module.RectTools.union(dirtyArea, stroke.bounds);
			});

			this.hide();
			WILL.redraw(WILL.modelToView(dirtyArea));
		}
	}
};
