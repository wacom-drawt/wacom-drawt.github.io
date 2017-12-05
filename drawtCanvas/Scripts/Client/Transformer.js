var math = {
	vector: function(pa, pb) {
		return {
			x: pb.x - pa.x,
			y: pb.y - pa.y,
			length: function() {return Math.sqrt(this.x*this.x + this.y*this.y);}
		};
	},

	angle: function(va, vb) {
		var dot_prdouct = va.x*vb.x + va.y*vb.y;
		var cross_product = va.x*vb.y - va.y*vb.x;
		var alpha = Math.atan2(cross_product, dot_prdouct);

		return alpha;
	}
};

(function() {
	if (!("TouchEvent" in window)) return;

	var dispatcher = {
		elements: [],

		initEvents: function(o) {
			o.addEventListener("touchstart", function(e) {
				if (e.touches.length == 2) {
					if ((this == e.touches[0].target || this.contains(e.touches[0].target)) && (this == e.touches[1].target || this.contains(e.touches[1].target))) {
						dispatcher.element = this;
						dispatcher.options = this.options;
						dispatcher.start(e);
						dispatcher.fireEvent(e, "start");
					}
				}
			}, {passive: false});

			o.addEventListener("touchmove", function(e) {
				if (dispatcher.element != this) return;

				var detail = dispatcher.move(e);
				dispatcher.fireEvent(e, "", detail);
			}, {passive: false});

			o.addEventListener("touchend", function(e) {
				if (dispatcher.element && dispatcher.element == this && e.touches.length < 2) {
					dispatcher.end(e);
					dispatcher.fireEvent(e, "end");
					dispatcher.element = null;
				}
			}, {passive: false});
		},

		start: function(e) {
			var origin = (this.element.frame || this.element).toRect();

			this.center = {x: origin.left + origin.width / 2, y: origin.top + origin.height / 2};
			this.offsetParent = this.element.offsetParent.getBoundingClientRect();
			this.lastPinch = this.createPinch(e);

			if (this.options["Transform"]["ExcludeRotation"] instanceof Function)
				this.excludeRotation = this.options["Transform"]["ExcludeRotation"]();
			else
				this.excludeRotation = !!this.options["Transform"]["ExcludeRotation"];
		},

		move: function(e) {
			var pinch = this.createPinch(e);

			var lastVec = math.vector(this.lastPinch[0], this.lastPinch[1]);
			var vec = math.vector(pinch[0], pinch[1]);

			var lastCenter = {x: (this.lastPinch[0].x + this.lastPinch[1].x) / 2, y: (this.lastPinch[0].y + this.lastPinch[1].y) / 2};
			var center = {x: (pinch[0].x + pinch[1].x) / 2, y: (pinch[0].y + pinch[1].y) / 2};
			var translation = {x: center.x - lastCenter.x, y: center.y - lastCenter.y};

			var rotation = this.excludeRotation?0:math.angle(lastVec, vec);
			var scale = vec.length() / lastVec.length();
			center = {x: center.x - this.offsetParent.x - this.center.x, y: center.y - this.offsetParent.y - this.center.y};

			this.lastPinch = pinch;

			var result = {
				pin: center,
				origin: this.center,
				scale: scale,
				rotation: rotation,
				translation: translation
			};

			Object.defineProperty(result, "transform", {
				get: function() {
					var transform = Module.MatTools.makeTransformAroundPoint(this.rotation, this.scale, this.pin);
					var translate = Module.MatTools.makeTranslate(this.translation);

					return Module.MatTools.multiply(transform, translate);
				}
			});

			return result;
		},

		end: function(e) {},

		createPinch: function(e) {
			var pinch = [];

			pinch[0] = {x: e.touches[0].clientX, y: e.touches[0].clientY};
			pinch[1] = {x: e.touches[1].clientX, y: e.touches[1].clientY};

			return pinch;
		},

		fireEvent: function(e, suffix, detail) {
			if (e.cancelable) e.preventDefault();
			e.stopPropagation();

			var event = new CustomEvent("pinch" + suffix, {"detail": detail});
			event.touches = e.touches;
			event.changedTouches = e.changedTouches;

			this.element.dispatchEvent(event);
		}
	};

	PinchEvent = {
		/**
		 * Attach pinch behaviour to the html element.
		 * Callback events: pinchstart, pinch, pinchend
		 *
		 * @param {HTMLElement} o pinch element
		 * @param {Object} [options]
		 * 		@property {(boolean | Function)} ExcludeRotation
		 */
		init: function(o, options) {
			if (!dispatcher.elements.contains(o)) {
				if (!o.options) o.options = new Object();
				o.options["Transform"] = options || {};

				dispatcher.elements.push(o);
				dispatcher.initEvents(o);

				return true;
			}
			else {
				o.options["Transform"] = Object.assign(o.options["Transform"], options);

				return false;
			}
		}
	};
})();

(function() {
	var Translator = {
		init: function(o) {
			var options = o.options["Translate"];

			return [options["Handle"] || o];
		},

		start: function(e) {
			this.lastPoint = {x: e.clientX, y: e.clientY};
		},

		move: function(e) {
			this.delta = {x: e.clientX - this.lastPoint.x, y: e.clientY - this.lastPoint.y};
			this.lastPoint = {x: e.clientX, y: e.clientY};

			return Module.MatTools.makeTranslate(this.delta);
		},

		end: function(e) {},
	};

	var Scalator = {
		init: function(o) {
			var handles = new Array();
			var options = o.options["Scale"];

			if (isNaN(options["MinWidth"])) options["MinWidth"] = 50;
			if (isNaN(options["MinHeight"])) options["MinHeight"] = 50;

			var handleTypes = options["KeepRatio"]?["TL", "TR", "BR", "BL"]:["TL", "T", "TR", "R", "BR", "B", "BL", "L"];

			handleTypes.forEach(function(type) {
				var handle = document.createElement("div");
				handle.className = "ResizeHandle " + type;
				handle.type = type;
				handle.root = o;

				handle.onmouseover = function() {
					Scalator.updateCursor(this);
				};

				o.appendChild(handle);

				handles.push(handle);
			}, this);

			return handles;
		},

		start: function(e) {
			this.origin = this.obj.frame.toRect();
			this.center = {x: this.origin.left + this.origin.width / 2, y: this.origin.top + this.origin.height / 2};
			this.offsetParent = this.obj.offsetParent.getBoundingClientRect();

			switch (e.currentTarget.type) {
				case "TL":
					this.point = {x: -this.origin.width / 2, y: -this.origin.height / 2};
					break;
				case "T":
					this.point = {x: 0, y: -this.origin.height / 2};
					break;
				case "TR":
					this.point = {x: this.origin.width / 2, y: -this.origin.height / 2};
					break;
				case "R":
					this.point = {x: this.origin.width / 2, y: 0};
					break;
				case "BR":
					this.point = {x: this.origin.width / 2, y: this.origin.height / 2};
					break;
				case "B":
					this.point = {x: 0, y: this.origin.height / 2};
					break;
				case "BL":
					this.point = {x: -this.origin.width / 2, y: this.origin.height / 2};
					break;
				case "L":
					this.point = {x: -this.origin.width / 2, y: 0};
					break;
			}

			if (this.options["ExcludeRotation"] instanceof Function)
				this.excludeRotation = this.options["ExcludeRotation"].call({});
			else
				this.excludeRotation = !!this.options["ExcludeRotation"];

			this.excludeRotation = this.excludeRotation || this.point.x == 0 || this.point.y == 0;
		},

		move: function(e) {
			var center = Module.MatTools.transformPoint({x: 0, y: 0}, Transformer.transform);
			var point = Module.MatTools.transformPoint(this.point, Transformer.transform);
			var anchor = {x: 2 * center.x - point.x, y: 2 * center.y - point.y};

			var rmx = e.clientX - this.offsetParent.x - this.center.x;
			var rmy = e.clientY - this.offsetParent.y - this.center.y;

			var anchorToMouse = math.vector(anchor, {x: rmx, y: rmy});
			var anchorToPoint = math.vector(anchor, point);

			var delta = this.excludeRotation?0:math.angle(anchorToPoint, anchorToMouse);
			var scale = anchorToMouse.length() / anchorToPoint.length();

			if (this.point.x == 0)
				scale = {x: 1, y: scale};
			else if (this.point.y == 0)
				scale = {x: scale, y: 1};

			var update = Module.MatTools.makeTransformAroundPoint(delta, scale, anchor);

			var transform = Module.MatTools.multiply(update, Transformer.transform);
			var rect = Module.MatTools.transformRect(this.origin, transform);

			if (rect.width < this.options["MinWidth"] || rect.height < this.options["MinHeight"])
				update = null;

			return update;
		},

		end: function(e) {},

		updateCursor: function(handle) {
			var cursor;
			var angle = handle.root.getTransformStyle().rotate.angle;

			if (handle.type == "TR" || handle.type == "BL")
				angle += Math.PI / 4;
			else if (handle.type == "TL" || handle.type == "BR")
				angle += 3 * Math.PI / 4;
			else if (handle.type == "L" || handle.type == "R")
				angle += Math.PI / 2;

			if (angle < 0)
				angle += 2 * Math.PI;
			else if (angle > 2 * Math.PI)
				angle -= 2 * Math.PI;

			if ((angle > Math.PI / 8 && angle <= 3 * Math.PI / 8) || (angle >= 9 * Math.PI / 8 && angle <= 11 * Math.PI / 8))
				cursor = "nesw-resize";
			else if ((angle > 3 * Math.PI / 8 && angle <= 5 * Math.PI / 8) || (angle >= 11 * Math.PI / 8 && angle <= 13 * Math.PI / 8))
				cursor = "ew-resize";
			else if ((angle > 5 * Math.PI / 8 && angle <= 7 * Math.PI / 8) || (angle >= 13 * Math.PI / 8 && angle <= 15 * Math.PI / 8))
				cursor = "nwse-resize";
			else
				cursor = "ns-resize";

			handle.style.cursor = cursor;
		}
	};

	var Rotator = {
		init: function(o) {
			var options = o.options["Rotate"];
			return options["Handles"];
		},

		start: function(e) {
			var clientRect = this.obj.getBoundingClientRect();
			this.center = {x: clientRect.left + clientRect.width / 2, y: clientRect.top + clientRect.height / 2};
			this.centerToMouse = math.vector(this.center, {x: e.clientX, y: e.clientY});
		},

		move: function(e) {
			var centerToMouse = math.vector(this.center, {x: e.clientX, y: e.clientY});
			var delta = math.angle(this.centerToMouse, centerToMouse);

			if (delta == 0) return null;

			this.centerToMouse = centerToMouse;

			var center = {x: Transformer.transform.tx, y: Transformer.transform.ty};
			var update = Module.MatTools.makeRotationAroundPoint(delta, center);

			return update;
		},

		end: function(e) {}
	};

	var Transformator = {
		start: function(e) {},

		move: function(e) {
			/*
			var center = e.detail.pin;
			var scale = e.detail.scale;
			var alpha = e.detail.rotation;
			var delta = e.detail.translation;

			var update = Module.MatTools.create();
			var transform;

			if ("Scale" in this.obj.options) {
				transform = Module.MatTools.makeScaleAtPoint(scale, center);
				update = Module.MatTools.multiply(transform, update);
			}

			if ("Rotate" in this.obj.options) {
				transform = Module.MatTools.makeRotationAroundPoint(alpha, center);
				update = Module.MatTools.multiply(transform, update);
			}

			if ("Translate" in this.obj.options) {
				transform = Module.MatTools.makeTranslate(delta);
				update = Module.MatTools.multiply(transform, update);
			}

			return update;
			*/
			return e.detail.transform;
		},

		end: function(e) {}
	};

	var dispatcher = {
		"Translate": Translator,
		"Scale": Scalator,
		"Rotate": Rotator,
		"Transform": Transformator,

		add: function(type, o, options) {
			if (!o.options) o.options = new Object();

			if (type in o.options)
				throw new Error(type + " transform already added on this object");
			else
				o.options[type] = options || {};

			dispatcher.initTransformFrame(o);

			var handles = dispatcher[type].init(o);
			dispatcher.attachEvents(handles, type, o)
		},

		attachEvents: function(handles, type, o) {
			handles.forEach(function(handle) {
				handle.addEventListener("dragstart", function(e) {
					e.preventDefault();
					e.stopPropagation();
				});

				handle.addEventListener("mousedown", function(e) {
					dispatcher.start(e, type, o);
				});

				document.addEventListener("mousemove", function(e) {
					dispatcher.move(e, type);
				});

				document.addEventListener("mouseup", function(e) {
					dispatcher.end(e, type);
				});

				if ("TouchEvent" in window) {
					handle.addEventListener("touchstart", function(e) {
						if (!dispatcher["TransformTransform"])
							dispatcher.start(e, type, o);
					}, {passive: false});

					document.addEventListener("touchmove", function(e) {
						dispatcher.move(e, type);
					}, {passive: false});

					document.addEventListener("touchend", function(e) {
						dispatcher.end(e, type);
					}, {passive: false});
				}
			});

			if ("PinchEvent" in window) {
				let excludeRotation = false;

				if (o.options["Scale"])
					excludeRotation = o.options["Scale"]["ExcludeRotation"];

				if (!excludeRotation)
					excludeRotation = !o.options["Rotate"];

				var init = PinchEvent.init(o, {ExcludeRotation: excludeRotation});

				if (init) {
					o.addEventListener("pinchstart", function(e) {
						if (dispatcher["TranslateTransform"]) dispatcher.end(e, "Translate", true);
						if (dispatcher["ScaleTransform"]) dispatcher.end(e, "Scale", true);
						if (dispatcher["RotateTransform"]) dispatcher.end(e, "Rotate", true);

						dispatcher.start(e, "Transform", o);
					});

					o.addEventListener("pinch", function(e) {
						dispatcher.move(e, "Transform");
					});

					o.addEventListener("pinchend", function(e) {
						dispatcher.end(e, "Transform");
					});
				}
			}
		},

		start: function(e, type, o) {
			if (dispatcher["TransformTransform"] || dispatcher["TranslateTransform"] || dispatcher["ScaleTransform"] || dispatcher["RotateTransform"]) return;
			e = this.fixE(e, type);

			var transformer = dispatcher[type];
			transformer.obj = o;
			transformer.options = o.options[type];
			transformer.transform = Module.MatTools.create();

			var origin = o.frame.toRect();
			transformer.originCenter = {x: origin.left + origin.width / 2, y: origin.top + origin.height / 2};

			Transformer.transform = Module.MatTools.create();

			var transform = o.frame.getStyle("transform");

			if (transform != "none") {
				transform = transform.substring(transform.indexOf("(")+1, transform.indexOf(")")).split(/,\s*/g);

				Transformer.transform.a = parseFloat(transform[0]);
				Transformer.transform.b = parseFloat(transform[1]);
				Transformer.transform.c = parseFloat(transform[2]);
				Transformer.transform.d = parseFloat(transform[3]);
				Transformer.transform.tx = parseFloat(transform[4]);
				Transformer.transform.ty = parseFloat(transform[5]);
			}

			var detail = dispatcher[type].start(e);
			var te = new CustomEvent("TransformStart", {"detail": detail});
			transformer.obj.dispatchEvent(te);

			this[type + "Transform"] = true;
		},

		move: function(e, type) {
			if (!this[type + "Transform"]) return;
			if (type != "Transform" && e.touches && e.touches[0].identifier != e.changedTouches[0].identifier) return;

			e = this.fixE(e, type);

			var transformer = dispatcher[type];
			var deltaTransform = transformer.move(e);

			if (deltaTransform) {
				Transformer.transform = Module.MatTools.multiply(deltaTransform, Transformer.transform);

				var update = Module.MatTools.create();
				var translate = Module.MatTools.makeTranslate(-transformer.originCenter.x, -transformer.originCenter.y);

				if (transformer.obj.transform) update = Module.MatTools.multiply(transformer.obj.transform, update);
				update = Module.MatTools.multiply(translate, update);

				update = Module.MatTools.multiply(deltaTransform, update);

				update = Module.MatTools.multiply(Module.MatTools.invert(translate), update);
				if (transformer.obj.transform) update = Module.MatTools.multiply(Module.MatTools.invert(transformer.obj.transform), update);

				var te = new CustomEvent("Transform", {"detail": update});
				transformer.obj.dispatchEvent(te);

				transformer.obj.frame.style.transform = "matrix(" +
					Transformer.transform.a + ", " +
					Transformer.transform.b + ", " +
					Transformer.transform.c + ", " +
					Transformer.transform.d + ", " +
					Transformer.transform.tx + ", " +
					Transformer.transform.ty +
				")";

				this.applyUI(transformer.obj)
			}
		},

		end: function(e, type, force) {
			if (!this[type + "Transform"]) return;
			if (!force && type != "Transform" && e.touches && e.touches[0] && e.touches[0].identifier != e.changedTouches[0].identifier) return;

			e = this.fixE(e, type);

			var transformer = dispatcher[type];
			var detail = transformer.end(e);
			var te = new CustomEvent("TransformEnd", {"detail": detail});
			transformer.obj.dispatchEvent(te);

			this[type + "Transform"] = false;
		},

		initTransformFrame: function(obj) {
			if (obj.frame) return;

			obj.frame = document.createElement("div");

			obj.frame.style.display = obj.style.display;
			obj.frame.style.position = "absolute";
			obj.frame.style.left = obj.style.left;
			obj.frame.style.top = obj.style.top;
			obj.frame.style.width = obj.style.width;
			obj.frame.style.height = obj.style.height;

			obj.parentNode.insertBefore(obj.frame, obj);

			var observer = new MutationObserver(function(mutations) {
				var styles = {};
				var pairs = mutations.last.oldValue.split("; ");

				pairs.forEach(function(pair) {
					var style = pair.replace(";", "").split(": ");
					styles[style[0]] = style[1];
				});

				var display = mutations.last.target.style.display;
				var prevDisplay = styles.display || "";

				if (display != prevDisplay) {
					// show
					if (prevDisplay == "none") {
						obj.frame.style.left = obj.style.left;
						obj.frame.style.top = obj.style.top;
						obj.frame.style.width = obj.style.width;
						obj.frame.style.height = obj.style.height;

						if (obj.style.transform) {
							obj.frame.style.transform = obj.style.transform;
							obj.style.transform = "";
						}

						obj.frame.style.visibility = "hidden";
						obj.frame.style.display = "";

						dispatcher.applyUI(obj);

						obj.frame.style.visibility = "";
					}
					// hide
					else
						obj.frame.style.display = "none";
				}
			});

			observer.observe(obj, {attributes: true, attributeOldValue: true, attributeFilter: ["style"]});
		},

		applyUI: function(obj) {
			var transform = obj.frame.getTransformStyle();

			var left = obj.frame.getMathStyle("left");
			var top = obj.frame.getMathStyle("top");
			var width = obj.frame.getMathStyle("width");
			var height = obj.frame.getMathStyle("height");

			var center = {x: left + width / 2, y: top + height / 2};

			width *= transform.scale.x;
			height *= transform.scale.y;
			left = center.x - width / 2 + transform.translate.x;
			top = center.y - height / 2 + transform.translate.y;

			obj.style.left = left + "px";
			obj.style.top = top + "px";
			obj.style.width = width + "px";
			obj.style.height = height + "px";

			if (transform.rotate.angle == 0)
				obj.style.transform = "";
			else
				obj.style.transform = "rotate(" + transform.rotate.angle + "rad)";
		},

		fixE: function(e, type) {
			e.preventDefault();
			e.stopPropagation();

			if (type != "Transform" && e.changedTouches) {
				var touch = e.changedTouches[0];
				touch.currentTarget = touch.target;

				e = touch;
			}

			return e;
		}
	};

	Transformer = {
		/**
		 * Attach translate behaviour to the html element.
		 * Callback events: TransformStart, Transform, TransformEnd
		 *
		 * @param {HTMLElement} o element to translate
		 * @param {Object} [options]
		 * 		@property {HTMLElement} [Handle=o]
		 */
		addTranslate: function(o, options) {
			dispatcher.add("Translate", o, options);
		},

		/**
		 * Attach scale behaviour to the html element.
		 * Callback events: TransformStart, Transform, TransformEnd
		 *
		 * @param {HTMLElement} o element to scale
		 * @param {Object} [options]
		 * 		@property {int} [MinWidth=50]
		 * 		@property {int} [MinHeight=50]
		 * 		@property {boolean} KeepRatio
		 * 		@property {(boolean | Function)} ExcludeRotation
		 */
		addScale: function(o, options) {
			dispatcher.add("Scale", o, options);
		},

		/**
		 * Attach rotate behaviour to the html element.
		 * Callback events: TransformStart, Transform, TransformEnd
		 *
		 * @param {HTMLElement} o element to rotate
		 * @param {Object} options
		 * 		@property {Array<HTMLElement>} Handles rotation controlers
		 */
		addRotate: function(o, options) {
			dispatcher.add("Rotate", o, options);
		}
	};
})();
