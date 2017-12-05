// movesCounter.init(true);
/**
 * Canvas writer
 *
 * @class WILL.Writer
 */
WILL.Writer = function() {
	if (!WILL.RENDERERS_POOL)
		this.strokeRenderer = new Module.StrokeRenderer(WILL.canvas);

	this.intersector = new Module.Intersector();

	this.context = null;
	this.tool = null;
	this.prevTool = null;
}

Object.extend(WILL.Writer.prototype, {
	color: Module.Color.BLACK,

	/**
	 * Set writer tool
	 *
	 * @param {(WILL.Tool | string)} tool string is tool name
	 */
	setTool: function(tool) {
		WILL.contextMenu.hide();
		WILL.selection.hide();

		if (!tool)
			return;
		else if (typeof tool == "string")
			tool = WILL.tools[tool];

		if (this.tool && this.tool.type == WILL.Tool.Type.STROKE && !this.tool.eraser)
			this.prevTool = this.tool;

		if (tool.color) {
			if (!this.prevColor) this.prevColor = this.color;
			this.color = tool.color;
		}
		else if (this.tool && this.tool.color) {
			this.color = this.prevColor;
			delete this.prevColor;
		}

		this.tool = tool;
		this.color.alpha = tool.alpha || 1;

		if (!WILL.RENDERERS_POOL) {
			if (tool.brush) this.strokeRenderer.configure({brush: tool.brush});
			this.strokeRenderer.configure({width: tool.width, color: this.color, blendMode: tool.strokeLayerBlendMode});
		}
	},

	/**
	 * Set writer color
	 *
	 * @param {(Module.Color | HTMLElement)} color
	 */
	setColor: function(color) {
		if (color instanceof HTMLElement)
			color = tools.extractColor(color);

		if (!Object.equals(color, this.color) && (this.tool.type != WILL.Tool.Type.STROKE || this.tool.eraser))
			this.setTool(this.prevTool);

		this.color = color;
		if (this.tool.alpha) this.color.alpha = this.tool.alpha;

		if (!WILL.RENDERERS_POOL)
			this.strokeRenderer.configure({color: color});
	},

	/**
	 * Is drawing allowed
	 *
	 * @param {Event} e mouse event
	 * @param {Module.InputPhase} inputPhase drawing phase
	 * @return {boolean} permission
	 */
	canDraw: function(e, inputPhase) {
		var result = true;

		if (WILL.dirtySafariMobilePatch)
			return false;

		if (e) {
			if (["mousedown", "mouseup", "pointerdown", "pointerup"].contains(e.type)) {
				if (e.button > 0) {
					result = false;

					if (e.button == 2 && WILL.rightButtonEraser)
						result = true;
				}

				if (result && e.buttons) {
					if (e.type == "mouseup" || e.type == "pointerup")
						result = e.buttons == 0;
					else
						result = (tools.getFlags(e.buttons).length == 1);
				}
			}
			// touchstart, touchmove, touchend
		}

		if (result) {
			if (inputPhase == Module.InputPhase.Begin) {
				if (WILL.selection.visible() || WILL.contextMenu.visible()) {

					WILL.selection.hide();
					WILL.contextMenu.hide();

					result = false;
				}
				else
					result = !this.context;
			}
			else
				result = !!this.context;
		}

		return result;
	},

	/**
	 * Drawing context
	 *
	 * @param {Event} e mouse event
	 * @param {Module.InputPhase} inputPhase drawing phase
	 * @return {Object} context related data
	 */
	updateContext: function(e, inputPhase) {
		if (inputPhase == Module.InputPhase.Begin)
			this.context = new Object();

		this.context.inputPhase = inputPhase;

		if (e) {
			e.preventDefault();

			this.context.pos = e.offset;

			var transform = Module.MatTools.invert(WILL.transform);
			var pt = Module.MatTools.transformPoint(this.context.pos, transform);

			this.context.pos.x = pt.x;
			this.context.pos.y = pt.y;

			if (inputPhase == Module.InputPhase.Begin) {
				var eraser = ["mousedown", "pointerdown"].contains(e.type) && e.button == 2;

				if (this.tool.isEraser() || eraser) {
					this.context.erase = true;
					this.setTool("Eraser");
				}
			}
			else if (inputPhase == Module.InputPhase.Move)
				WILL.contextMenu.cancel = true;

			this.tool.preparePathBuilder(e, inputPhase);
		}
	},

	/**
	 * Deletes drawing context when drawing is finished or aborted
	 */
	deleteContext: function() {
		if (!this.context) return;
		if (this.context.erase) this.setTool(this.prevTool);
		delete this.context;
	},

	/**
	 * Module.InputPhase.Begin is raised
	 *
	 * @param {Event} e mouse down event
	 */
	beginStroke: function(e) {
		if (!this.canDraw(e, Module.InputPhase.Begin))
			return;

		WILL.canvas.activate();

		this.updateContext(e, Module.InputPhase.Begin);
		this.buildPath();

		if (this.tool.type == WILL.Tool.Type.ERASER) {
			this.strokeRenderer.reset();
			WILL.history.add();
		}
		else
			this.draw();
	},

	/**
	 * Module.InputPhase.Move is raised
	 *
	 * @param {Event} e mouse move event
	 */
	moveStroke: function(e) {
		if (!this.canDraw(e, Module.InputPhase.Move))
			return;

		this.updateContext(e, Module.InputPhase.Move);
/*
		if (this.context.draw) return;
		this.context.draw = true;

		if (this.tool.type == WILL.Tool.Type.ERASER)
			this.updateAnimationFrame(this.erase);
		else
			this.updateAnimationFrame(this.draw);
*/
		if (WILL.frameID != WILL.canvas.frameID) {
			var callback = (this.tool.type == WILL.Tool.Type.ERASER)?this.erase:this.draw;

			WILL.frameID = WILL.canvas.requestAnimationFrame(function() {
				if (this.context && this.context.inputPhase == Module.InputPhase.Move) {
					this.buildPath();
					callback.call(this);
				}
			}.bind(this), true);
		}
	},
/*
	updateAnimationFrame: function(callback) {
		if (!this.context || this.context.inputPhase != Module.InputPhase.Move)
			return;

		if (!Object.equals(this.context.pos, this.context.lastPos)) {
			this.context.lastPos = this.context.pos;

			this.buildPath();
			callback.call(this);
		}

		requestAnimationFrame(function(timestamp) {
			this.updateAnimationFrame(callback);
		}.bind(this));
	},
*/
	/**
	 * Module.InputPhase.Move is raised
	 *
	 * @param {Event} e mouse up event
	 */
	endStroke: function(e) {
		if (!this.canDraw(e, Module.InputPhase.End))
			return;

		if (this.context.inputPhase == Module.InputPhase.Begin) {
			var image;

			for (var i = 0; i < WILL.images.length; i++) {
				if (!WILL.images[i])
					continue;

				if (Module.RectTools.intersect(WILL.images[i].bounds, Module.RectTools.create(this.context.pos.x, this.context.pos.y, 0, 0))) {
					image = WILL.images[i]
					break;
				}
			}

			if (image) {
				this.abort();

				WILL.selection.create(image);
				WILL.selection.show();

				return;
			}
		}

		this.updateContext(e, Module.InputPhase.End);
		this.buildPath();

		if (this.tool.type == WILL.Tool.Type.ERASER)
			this.erase();
		else
			this.draw();

		this.deleteContext();
	},

	/**
	 * Build path for input event
	 */
	buildPath: function() {
		var transform = Module.MatTools.isIdentity(WILL.transform)?null:WILL.transform;

		if (this.context.inputPhase == Module.InputPhase.Begin)
			this.tool.smoothener.reset();

		var pathPart = this.tool.pathBuilder.addPoint(this.context.inputPhase, this.context.pos, this.tool.pathBuilderValue);
		var smoothedPathPart = this.tool.smoothener.smooth(pathPart, this.context.inputPhase == Module.InputPhase.End);
		var pathContext = this.tool.pathBuilder.addPathPart(smoothedPathPart);

		this.context.pathPart = pathContext.getPathPart();
		this.context.pathPart.transform = transform;

		this.context.path = pathContext.getPath();
		this.context.path.transform = transform;

		if (this.context.inputPhase == Module.InputPhase.Move && pathPart.points.length > 0 && this.tool.type != WILL.Tool.Type.ERASER) {
			var preliminaryPathPart = this.tool.pathBuilder.createPreliminaryPath();
			var preliminarySmoothedPathPart = this.tool.smoothener.smooth(preliminaryPathPart, true);

			this.context.preliminaryPathPart = this.tool.pathBuilder.finishPreliminaryPath(preliminarySmoothedPathPart);
			this.context.preliminaryPathPart.transform = transform;
		}
	},

	draw: function() {
		switch (this.context.inputPhase) {
			case Module.InputPhase.Begin:
				if (this.context.pathPart.points.length > 0) {
					this.strokeRenderer.draw(this.context.pathPart, false);
					WILL.refresh(this.strokeRenderer.updatedArea);
				}

				break;
			case Module.InputPhase.Move:
				this.strokeRenderer.draw(this.context.pathPart, false);
				WILL.refresh(this.strokeRenderer.updatedArea);

				break;
			case Module.InputPhase.End:
				var stroke;

				if (WILL.model || this.tool.type == WILL.Tool.Type.SELECTOR) {
					if (!WILL.rtc || this.tool.type == WILL.Tool.Type.SELECTOR)
						stroke = this.strokeRenderer.toStroke(this.context.path);
				}

				if (this.tool.type == WILL.Tool.Type.STROKE) {
					this.strokeRenderer.draw(this.context.pathPart, true);
					WILL.refresh(this.strokeRenderer.updatedArea);

					this.completeRendering(stroke);
				}
				else {
					this.abort();
					this.select(stroke);
				}

				break;
			default:
				throw new Error("Invalid input phase:", this.context.inputPhase);
		}
	},

	completeRendering: function(stroke) {
		WILL.history.add(this.strokeRenderer.strokeBounds);
		if (stroke) WILL.strokes.push(stroke);

		if (WILL.mode == WILL.Mode["2D"]) {
			WILL.canvas.clear(this.strokeRenderer.strokeBounds);
			stroke.drawBezierPath();
		}
		else
			this.strokeRenderer.blendStroke(WILL.strokesLayer);
	},

	/**
	 * Abort stroke drawing and removed drawed part from canvas
	 */
	abort: function() {
		if (WILL.writer == this && !this.context) return;

		var dirtyArea = Module.RectTools.union(this.strokeRenderer.strokeBounds, this.strokeRenderer.preliminaryDirtyArea);

		this.strokeRenderer.abort();

		if (WILL.RENDERERS_POOL)
			WILL.deallocStrokeRenderer(this.strokeID);

		this.deleteContext();

		if (WILL.mode == WILL.Mode["2D"]) WILL.canvas.clear(dirtyArea);
		WILL.refresh(dirtyArea);
	},

	/**
	 * Remove drawing from canvas, based on eraser data
	 */
	erase: function() {
		this.intersector.setTargetAsStroke(this.context.pathPart, NaN);

		var dirtyArea = null;
		var strokesToRemove = new Array();

		WILL.strokes.forEach(function(stroke) {
			if (this.tool.whole) {
				if (this.intersector.isIntersectingTarget(stroke)) {
					dirtyArea = Module.RectTools.union(dirtyArea, stroke.bounds);
					strokesToRemove.push({stroke: stroke});
				}
			}
			// splitter
			else {
				var intervals = this.intersector.intersectWithTarget(stroke);
				var split = stroke.split(intervals, this.intersector.targetType);

				if (split.intersect) {
					dirtyArea = Module.RectTools.union(dirtyArea, split.bounds);
					strokesToRemove.push({stroke: stroke, replaceWith: split.strokes});
				}
			}
		}, this);

		strokesToRemove.forEach(function(strokeToRemove) {
			if (this.tool.whole)
				WILL.strokes.remove(strokeToRemove.stroke);
			else
				WILL.strokes.replace(strokeToRemove.stroke, strokeToRemove.replaceWith);
		}, this);

		if (dirtyArea)
			WILL.redraw(WILL.modelToView(dirtyArea));
	},

	/**
	 * Finds selection data, based on selector stroke
	 *
	 * @param {Module.Stroke} stroke selector stroke
	 */
	select: function(stroke) {
		WILL.selection.create();

		if (WILL.type == WILL.Type.VECTOR)
			this.selectStrokes(stroke);
		else
			this.selectPath(stroke);
	},

	selectStrokes: function(selectorStroke) {
		this.intersector.setTargetAsClosedPath(selectorStroke.path);

		WILL.strokes.forEach(function(stroke) {
			if (this.tool.whole) {
				if (this.intersector.isIntersectingTarget(stroke))
					WILL.selection.strokes.push(stroke);
			}
			// splitter
			else {
				var intervals = this.intersector.intersectWithTarget(stroke);
				var split = stroke.split(intervals, this.intersector.targetType);

				if (split.intersect) {
					if (intervals.length > 1)
						WILL.selection.splits.push(split);

					split.selected.forEach(function(stroke) {
						WILL.selection.strokes.push(stroke);
					}, this);
				}
			}
		}, this);

		if (WILL.selection.strokes.length > 0) {
			if (!this.tool.whole)
				this.selectPath(selectorStroke);
			else
				WILL.selection.show();
		}
	},

	selectPath: function(stroke) {
		if (stroke.length < 15) return;

		WILL.selection.selector = stroke;
		WILL.selection.show();
	}
});
