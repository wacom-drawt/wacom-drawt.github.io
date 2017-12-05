Object.extend(WILL, {
	unconfirmedImages: new Object(),

	init: function(type, width, height) {
		this.rtc = true;

		this.super.init(type, width, height);

		this.writers = new Object();
		this.activeWriters = new Array();
		this.activeWritersLayer = this.canvas.createLayer();
		this.viewCacheLayer = this.canvas.createLayer();

		this.incomplete = new Object();

		// RTE
		if (top != window)
			client.init();
	},

	redraw: function(dirtyArea, refreshTransform) {
		if (WILL.mode == WILL.Mode["2D"]) {
			this.refresh2DActiveArea = Module.RectTools.union(this.refresh2DActiveArea, dirtyArea);

			if (this.refresh2DAnimationFrameID != this.canvas.frameID) {
				this.refresh2DAnimationFrameID = WILL.canvas.requestAnimationFrame(function() {
					var activeArea = WILL.refresh2DActiveArea;
					delete WILL.refresh2DActiveArea;
					WILL.refresh2D(activeArea);
				});
			}

			if (refreshTransform) this.refreshTransform();
			this.refresh(dirtyArea);
		}
		else
			this.super.redraw(dirtyArea);
	},

	refreshImages: function() {
		var refreshImages = this.super.refreshImages;

		if (this.refreshImagesAnimationFrameID != this.canvas.frameID) {
			this.refreshImagesAnimationFrameID = WILL.canvas.requestAnimationFrame(function() {
				refreshImages.call(WILL);
			});
		}
	},

	refreshTransform: function() {
		var refreshTransform = this.super.refreshTransform;

		if (this.refreshTransformAnimationFrameID != this.canvas.frameID) {
			this.refreshTransformAnimationFrameID = WILL.canvas.requestAnimationFrame(function() {
				refreshTransform.call(WILL);
			});
		}
	},

	/**
	 * Refresh canvas with modified layers data on 16ms.
	 * It combines all refrshes in this time and refresh union area of them.
	 *
	 * @param {Module.Rectangle} dirtyArea canvas rect to refresh
	 */
	refresh: function (dirtyArea) {
		if (!dirtyArea) return;

		this.refreshActiveArea = Module.RectTools.union(this.refreshActiveArea, dirtyArea);

		if (this.refreshAnimationFrameID != this.canvas.frameID) {
			this.refreshAnimationFrameID = WILL.canvas.requestAnimationFrame(function() {
				var activeArea = WILL.refreshActiveArea;
				delete WILL.refreshActiveArea;
				WILL.completeRefresh(activeArea);
			}, true);
		}
	},

	completeRefresh: function(dirtyArea) {
		dirtyArea = this.ensureVisibleArea(dirtyArea);
		if (!dirtyArea) return;

		var strokesLayer = this.strokesLayer;

		if (this.activeWriters.length > 0) {
			if (WILL.mode == WILL.Mode["2D"])
				this.activeWritersLayer.clear(dirtyArea);
			else
				this.activeWritersLayer.blend(this.strokesLayer, {mode: Module.BlendMode.NONE, rect: dirtyArea});

			if (this.writer.context && this.writer.context.inputPhase == Module.InputPhase.Move)
				this.writer.strokeRenderer.drawPreliminary(this.writer.context.preliminaryPathPart);

			this.activeWriters.forEach(function(writer) {
				strokesLayer = this.activeWritersLayer;

				writer.strokeRenderer.updatedArea = dirtyArea;
				writer.strokeRenderer.blendUpdatedArea(this.activeWritersLayer);
			}, this);
		}

		if (strokesLayer)
			this.viewCacheLayer.blend(strokesLayer, {mode: Module.BlendMode.NONE, rect: dirtyArea});
		else
			this.viewCacheLayer.clear(dirtyArea);

		for (var clientID in this.writers) {
			var unconfirmedStrokesData = this.writers[clientID].unconfirmedStrokesData;

			for (var strokeID in unconfirmedStrokesData) {
				var data = unconfirmedStrokesData[strokeID];
				this.viewCacheLayer.blend(data.layer, {mode: data.blendMode, rect: dirtyArea});
			}
		}

		if (WILL.mode == WILL.Mode["2D"])
			this.canvas.clear(dirtyArea);
		else {
			if (this.backgroundLayer)
				this.canvas.blend(this.backgroundLayer, {mode: Module.BlendMode.NONE, rect: dirtyArea});
			else
				this.canvas.clear(dirtyArea, this.backgroundColor);
		}

		this.canvas.blend(this.viewCacheLayer, {rect: dirtyArea});

		if (this.selection.layer)
			this.canvas.blend(this.selection.layer, {transform: this.selection.mat});
	},

	initImage: function(image, data, confirmed) {
		this.super.initImage(image, data);

		if (!confirmed) {
			image.data.id = this.writer.genStrokeID();
			this.unconfirmedImages[image.data.id] = image;
		}
	},

	selection: {
		split: function(discardSend) {
			var splits = new Array();

			this.splits.forEach(function(split) {
				split.id = split.stroke.id;

				split.strokes.forEach(function(subStroke) {
					subStroke.id = WILL.writer.genStrokeID();
				}, this);

				splits.push(split);
			}, this);

			this.splits = new Array();

			if (splits.length > 0) {
				client.encoder.encodeSplit(splits);
				if (!discardSend) client.send();
			}
		},

		transformStrokes: function(mat, discardRedraw) {
			var transformed = this.transformed;

			// if (!this.transformed) {
				// this.split(true);

				// this.transformed = true;
			// }

			// this.currentTransform = Module.MatTools.multiply(this.currentTransform, mat);

			this.super.transformStrokes(mat, true);

			// beginTransform
			if (!transformed) {
				var dirtyArea;

				this.strokes.forEach(function(stroke) {
					// stroke.locked = true;

					dirtyArea = Module.RectTools.union(dirtyArea, stroke.bounds);

					WILL.strokes.remove(stroke);
					WILL.strokesTransform.push(stroke);
				}, this);

				WILL.redraw(WILL.modelToView(dirtyArea));
			}

			if (!discardRedraw) WILL.refreshTransform();

			client.encoder.encodeTransform(client.getStrokeIDs(this.strokes), mat);
			client.send(true);
		},

		completeSelection: function() {
			this.super.completeSelection();

			if (this.transformed) {
				var dirtyArea;

				if (WILL.strokesTransform.length == 0 && WILL.strokes.length > 0)
					console.warn("invalid completeSelection");

				this.strokes.forEach(function(stroke) {
					// stroke.locked = false;

					dirtyArea = Module.RectTools.union(dirtyArea, stroke.bounds);

					WILL.strokesTransform.remove(stroke);
					WILL.strokes.add(stroke);
				}, this);

				WILL.redraw(WILL.modelToView(dirtyArea), true);
			}
		},

		paste: function(e) {
			if (!this.clipboard) return;

			if (this.clipboard.imageData) {
				var transform = Object.clone(this.clipboard.imageData.transform);
				transform.tx = e.clientX;
				transform.ty = e.clientY;

				WILL.importImage({
					src: this.clipboard.imageData.src,
					transform: transform
				});
			}
			else {
				this.create();

				this.type = this.clipboard.type;
				this.strokes = Object.clone(this.clipboard.strokes);
				this.rect = Object.clone(this.clipboard.rect);
				this.path = Object.clone(this.clipboard.path);

				var pos = tools.getMousePos(e);

				var frameTransform = Module.MatTools.multiply(WILL.transform, this.clipboard.transform);

				var frameCenterInWindow = {x: frameTransform.tx, y: frameTransform.ty};
				var frameCenterInModel = Module.MatTools.transformPoint(frameCenterInWindow, Module.MatTools.invert(WILL.transform));
				var windowCenterInWindow = pos;
				var windowCenterInModel = Module.MatTools.transformPoint(windowCenterInWindow, Module.MatTools.invert(WILL.transform));
				var translationInModel = {x: windowCenterInModel.x - frameCenterInModel.x, y: windowCenterInModel.y - frameCenterInModel.y}

				var strokesTransform = Module.MatTools.makeTranslate(translationInModel.x, translationInModel.y);

				var frameTranslate = Module.MatTools.makeTranslate(windowCenterInWindow.x - frameTransform.tx, windowCenterInWindow.y - frameTransform.ty);
				var frameTransform = Module.MatTools.multiply(frameTranslate, frameTransform);

				this.strokes.forEach(function(stroke) {
					stroke.id = WILL.writer.genStrokeID();

					if (WILL.mode == WILL.Mode["2D"]) {
						stroke.transform(strokesTransform);
						stroke.transform();
					}
					else
						stroke.transform(strokesTransform);
				}, this);

				client.encoder.encodeAdd(this.strokes);
				client.send();

				this.show(true, frameTransform);
			}
		},

		delete: function() {
			this.hide();

			if (!this.strokes[0].id)
				this.split(true);

			client.encoder.encodeRemove(client.getStrokeIDs(this.strokes));
			client.send();
		},

		changeStrokesColor: function(color) {
			this.hide();

			this.split(true);

			client.encoder.encodeUpdateColor(client.getStrokeIDs(this.strokes), color);
			client.send();
		}
	}
});

Object.extend(WILL.Writer.prototype, {
	init: function(id) {
		this.id = id;
		this.strokeID = 0; // updated from client
		this.unconfirmedStrokesData = new Object();

		WILL.writers[id] = this;
	},

	genStrokeID: function() {
		this.strokeID++;
		return this.strokeID;
	},

	beginStroke: function(e) {
		if (!this.canDraw(e, Module.InputPhase.Begin))
			return;

		if (WILL.RENDERERS_POOL) {
			if (this.tool.type == WILL.Tool.Type.STROKE || this.tool.type == WILL.Tool.Type.SELECTOR) {
				this.genStrokeID();
				this.strokeRenderer = WILL.allocStrokeRenderer(this.strokeID);
				this.strokeRenderer.configure({brush: this.tool.brush, width: this.tool.width, color: this.color, blendMode: this.tool.strokeLayerBlendMode});
			}
		}

		this.super.beginStroke(e);

		if (this.tool.type != WILL.Tool.Type.ERASER)
			WILL.activeWriters.push(this);

		if (this.tool.type == WILL.Tool.Type.STROKE) {
			if (!WILL.RENDERERS_POOL)
				this.genStrokeID();

			client.encoder.encodeComposeStyle(this.strokeRenderer);
		}
	},

	endStroke: function(e) {
		if (!this.canDraw(e, Module.InputPhase.Move))
			return;

		var context = this.context;

		this.super.endStroke(e);
		WILL.activeWriters.remove(this);

		if (WILL.selection.visible())
			return;

		if (this.tool.type == WILL.Tool.Type.STROKE) {
			client.encoder.encodeComposePathPart(context.pathPart, this.color, this.tool.variableWidth, this.tool.variableAlpha, true);
			client.send(true);

			client.encoder.encodeAdd([{
				id: this.strokeID,
				brush: this.tool.brush,
				path: context.path,
				width: this.tool.width,
				color: this.color,
				ts: 0, tf: 1,
				randomSeed: this.strokeRenderer.randomSeed,
				blendMode: this.tool.strokeLayerBlendMode
			}]);

			client.send();
		}
	},

	draw: function() {
		this.super.draw();

		if (this.tool.type == WILL.Tool.Type.STROKE) {
			client.encoder.encodeComposePathPart(this.context.pathPart, this.color, this.tool.variableWidth, this.tool.variableAlpha, false);
			client.send(true);

			// this.draw2D();
		}
	},

	draw2D: function() {
		var collaborator = client.collaborators[client.id];
		if (!collaborator) collaborator = new Collaborator(client.id);
		collaborator.pathID = WILL.writer.strokeID;

		var stroke = WILL.incomplete[collaborator.pathID];
		var style = WILL.writer.strokeRenderer;
		var pathPart = this.context.pathPart;
		var stride = pathPart.stride;
		var segmentBounds = Module.calculateSegmentBounds(pathPart.points, stride, style.width, 0, 0);
		var points = Module.readFloats(pathPart.points);

		if (!stroke) {
			stroke = new Module.Stroke(style.brush, {points: new Float32Array(12), stride: stride}, style.width, Object.clone(style.color, true), 0, 1, style.randomSeed, style.blendMode);
			stroke.id = collaborator.pathID;
			stroke.parts = [];
			stroke.bezierPaths = [];

			WILL.incomplete[collaborator.pathID] = stroke;
		}

		if (points.length > 0) {
			stroke.path.bounds = Module.RectTools.union(stroke.path.bounds, segmentBounds);
			stroke.segment = {strokeID: stroke.id, bounds: segmentBounds, points: points.toArray()};

			messanger.sendPathPart(collaborator, this.context.inputPhase == Module.InputPhase.End);
		}
	},

	completeRendering: function() {
		if (!WILL.RENDERERS_POOL) {
			// this.unconfirmedStrokesData.push({layer: this.strokeRenderer.layer, strokeBounds: this.strokeRenderer.strokeBounds, blendMode: this.strokeRenderer.blendMode});

			this.unconfirmedStrokesData[this.strokeID] = {layer: this.strokeRenderer.layer, strokeBounds: this.strokeRenderer.strokeBounds, blendMode: this.strokeRenderer.blendMode};
			this.strokeRenderer.layer = WILL.canvas.createLayer();
		}
	},

	abort: function() {
		if (!WILL.activeWriters.contains(this)) return;

		WILL.activeWriters.remove(this);

		this.super.abort();

		client.encoder.encodeComposeAbort();
		client.send(true);
	},

	erase: function() {
		var result = new Array();

		this.intersector.setTargetAsStroke(this.context.pathPart, NaN);

		WILL.strokes.forEach(function(stroke) {
			if (this.tool.whole) {
				if (this.intersector.isIntersectingTarget(stroke))
					result.push(stroke.id);
			}
			// splitter
			else {
				var intervals = this.intersector.intersectWithTarget(stroke);
				var split = stroke.split(intervals, this.intersector.targetType);

				if (split.intersect) {
					split.id = stroke.id;

					split.strokes.forEach(function(subStroke) {
						subStroke.id = this.genStrokeID();
					}, this);

					result.push(split);
				}
			}
		}, this);

		if (result.length > 0)
			this.sendErase(result);
	},

	sendErase: function(eraseData) {
		if (this.tool.whole)
			client.encoder.encodeRemove(eraseData.toUint32Array());
		else
			client.encoder.encodeSplit(eraseData);

		client.send();
	}
});
/*
Module.addPostScript(function() {
	Object.extend(Array.prototype, {
		get: function(i) {
			return this[i];
		},

		size: function() {
			return this.length;
		}
	});

	Object.extend(Module.Intersector.prototype, {
		isIntersectingTarget: function(stroke) {
			var result = false;
			if (!stroke.locked) result = this.super.isIntersectingTarget(stroke);
			return result;
		},

		intersectWithTarget: function(stroke) {
			var intervals;

			if (stroke.locked) {
				intervals = new Array();
				intervals.push({fromIndex: 0, toIndex: stroke.path.segments.length+2, fromTValue: stroke.ts, toTValue: stroke.tf, inside: false});
			}
			else
				intervals = this.super.intersectWithTarget(stroke);

			return intervals;
		}
	});
});
*/