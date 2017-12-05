/**
 * dom-drag.js / 09.25.2001 / www.youngpup.net
 */
var Drag = {
	name: "Drag",
	obj: null,

	/**
	 * options {
	 * 	MinX: INT,
	 * 	MaxX: INT,
	 * 	MinY: INT,
	 * 	MaxY: INT,
	 * 	MaxPreserveSize: BOOL,
	 * 	Axis: STRING,				possible values: X, Y, XY, default is XY
	 * 	SwapHorzRef: BOOL,
	 * 	SwapVertRef: BOOL,
	 * 	XMapper: FUNCTION,
	 * 	YMapper: FUNCTION
	 * }
	 */
	init: function(o, oRoot, options) {
		if (!options) options = new Object();
		if (!options["Axis"]) options["Axis"] = "XY";

		o.options = options;

		o.root = oRoot || o;

		o.hmode = !!!options["SwapHorzRef"];
		o.vmode = !!!options["SwapVertRef"];

		Transform.init(Drag, o);
	},

	start: function(e) {
		e = Transform.fixE(e);

		var o = Drag.obj = this;

		var rect = o.root.toRect((o.vmode?"T":"B") + (o.hmode?"L":"R"));
		var x = parseInt(rect.x);
		var y = parseInt(rect.y);

		o.sx = x;
		o.sy = y;
		o.lx = e.clientX;
		o.ly = e.clientY;

		o.root.onDragStart(x, y, o);
		Transform.onStart(Drag);

		return false;
	},

	move: function(e) {
		e = Transform.fixE(e);

		var o = Drag.obj;

		var rect = o.root.toRect((o.vmode?"T":"B") + (o.hmode?"L":"R"));
		var x = parseInt(rect.x);
		var y = parseInt(rect.y);

		var nx = o.options["Axis"].contains("X")?x + ((e.clientX - o.lx) * (o.hmode?1:-1)):o.sx;
		var ny = o.options["Axis"].contains("Y")?y + ((e.clientY - o.ly) * (o.vmode?1:-1)):o.sy;

		if (!isNaN(o.options["MinX"]) && nx < o.options["MinX"])
			nx = o.options["MinX"];
		else if (!isNaN(o.options["MaxX"])) {
			if (o.options["MaxPreserveSize"] && o.options["MaxX"] < nx + rect.offsetWidth)
				nx = o.options["MaxX"] - rect.offsetWidth;
			else if (nx > o.options["MaxX"])
				nx = o.options["MaxX"];
		}

		if (!isNaN(o.options["MinY"]) && ny < o.options["MinY"])
			ny = o.options["MinY"];
		else if (!isNaN(o.options["MaxY"])) {
			if (o.options["MaxPreserveSize"] && o.options["MaxY"] < ny + rect.offsetHeight)
				ny = o.options["MaxY"] - rect.offsetHeight;
			else if (ny > o.options["MaxY"])
				ny = o.options["MaxY"];
		}

		if (o.options["XMapper"])
			nx = o.options["XMapper"](y);
		else if (o.options["YMapper"])
			ny = o.options["YMapper"](x);

		if (!nx) nx = x;
		if (!ny) ny = y;

		o.root.style[o.hmode?"left":"right"] = nx + "px";
		o.root.style[o.vmode?"top":"bottom"] = ny + "px";
		o.lx = e.clientX;
		o.ly = e.clientY;

		o.root.onDrag(nx, ny, o);

		return false;
	},

	end: function() {
		var o = Drag.obj;

		Transform.onEnd(Drag);
		o.root.onDragEnd(parseInt(o.root.style[o.hmode?"left":"right"]), parseInt(o.root.style[o.vmode?"top":"bottom"]), o);

		Drag.obj = null;
	}
};

var Resize = {
	name: "Resize",
	handle: null,

	/**
	 * options {
	 * 	Handles: ARRAY,		default: ["TL", "T", "TR", "R", "BR", "B", "BL", "L"]
	 * 	KeepRatio: BOOL,
	 * 	MinX: INT,
	 * 	MaxX: INT,
	 * 	MinY: INT,
	 * 	MaxY: INT,
	 * 	MinWidth: INT,		default: 50
	 * 	MaxWidth: INT,
	 * 	MinHeight: INT,		default: 50
	 * 	MaxHeight: INT
	 * }
	 */
	init: function(o, options) {
		if (o.options) return;

		if (!options) options = new Object();
		if (isNaN(options["MinWidth"])) options["MinWidth"] = 50;
		if (isNaN(options["MinHeight"])) options["MinHeight"] = 50;
		o.options = options;

		var handles = options["Handles"] || (options["KeepRatio"]?["TL", "TR", "BR", "BL"]:["TL", "T", "TR", "R", "BR", "B", "BL", "L"]);

		for (var i = 0; i < handles.length; i++) {
			var handle = document.createElement("div");
			handle.className = "ResizeHandle " + handles[i];
			handle.type = handles[i];
			handle.root = o;
			o.appendChild(handle);

			Transform.init(Resize, handle, true);
		}

		Transform.attachOnTransformEvents(Resize, o);
	},

	start: function(e) {
		e = Transform.fixE(e);

		var handle = Resize.handle = this;
		var o = this.root;
		var rect = o.toRect();

		o.sw = rect.width;
		o.sh = rect.height;
		o.sx = rect.left;
		o.sy = rect.top;
		o.lx = e.clientX;
		o.ly = e.clientY;

		o.onResizeStart(o.sx, o.sy, o.sw, o.sh, handle);
		Transform.onStart(Resize);

		return false;
	},

	move: function(e) {
		e = Transform.fixE(e);

		var handle = Resize.handle;
		var o = handle.root;
		var rect = o.toRect();

		var dx = e.clientX - o.lx;
		var dy = e.clientY - o.ly;

		var nx = rect.left;
		var ny = rect.top;
		var nw = rect.width;
		var nh = rect.height;

		if (handle.type.endsWith("L")) {
			nx += dx;
			nw -= dx;
		}
		if (handle.type.startsWith("T")) {
			ny += dy;
			nh -= dy;
		}
		if (handle.type.endsWith("R")) nw += dx;
		if (handle.type.startsWith("B")) nh += dy;

		if (!isNaN(o.options["MinX"]) && nx < o.options["MinX"]) {
			if (handle.type.endsWith("L")) nw += nx - o.options["MinX"];
			nx = o.options["MinX"];
		}
		else if (!isNaN(o.options["MaxX"]) && o.options["MaxX"] < nx + nw)
			nw = o.options["MaxX"] - nx;

		if (!isNaN(o.options["MinY"]) && ny < o.options["MinY"]) {
			if (handle.type.startsWith("T")) nh += ny - o.options["MinY"];
			ny = o.options["MinY"];
		}
		else if (!isNaN(o.options["MaxY"]) && o.options["MaxY"] < ny + nh)
			nh = o.options["MaxY"] - ny;

		if (nw < o.options["MinWidth"]) {
			if (handle.type.endsWith("L")) nx += nw - o.options["MinWidth"];
			nw = o.options["MinWidth"];
		}
		else if (!isNaN(o.options["MaxWidth"]) && nw > o.options["MaxWidth"]) {
			if (handle.type.endsWith("L")) nx += nw - o.options["MaxWidth"];
			nw = o.options["MaxWidth"];
		}

		if (nh < o.options["MinHeight"]) {
			if (handle.type.startsWith("T")) ny += nh - o.options["MinHeight"];
			nh = o.options["MinHeight"];
		}
		else if (o.options["MaxHeight"] && nh > o.options["MaxHeight"]) {
			if (handle.type.startsWith("T")) ny += nh - o.options["MaxHeight"];
			nh = o.options["MaxHeight"];
		}

		if (o.options["KeepRatio"]) {
			var nr = {x: nx, y: ny, width: nw, height: nh};

			if (Math.abs(dx) > Math.abs(dy))
				Resize.keepRatioByWidth(nr, nw);
			else if (Math.abs(dx) < Math.abs(dy))
				Resize.keepRatioByHeight(nr, nh);

			nx = nr.x;
			ny = nr.y;
			nw = nr.width;
			nh = nr.height;
		}

		o.style.left = nx + "px";
		o.style.top = ny + "px";
		o.style.width = nw + "px";
		o.style.height = nh + "px";

		o.onResize(nx, ny, nw, nh, handle);

		o.lx = e.clientX;
		o.ly = e.clientY;

		return false;
	},

	end: function() {
		var handle = Resize.handle;
		var o = handle.root;

		Transform.onEnd(Resize);

		var rect = o.toRect();
		o.onResizeEnd(rect.left, rect.top, rect.width, rect.height, handle);

		Resize.handle = null;
	},

	keepRatioByWidth: function(rect, width, constraint) {
		var handle = Resize.handle;
		var o = handle.root;

		var nh = width / o.sw * o.sh;
		var ny = rect.y;

		if (!constraint) {
			if (nh < o.options["MinHeight"]) {
				nh = o.options["MinHeight"];
				Resize.keepRatioByHeight(rect, nh, true);
			}
			else if (nh > o.options["MaxHeight"]) {
				nh = o.options["MaxHeight"];
				Resize.keepRatioByHeight(rect, nh, true);
			}
		}

		if (handle.type.startsWith("T")) {
			ny -= nh - rect.height;

			if (!constraint && !isNaN(o.options["MinY"]) && ny < o.options["MinY"]) {
				nh += ny - o.options["MinY"];
				ny = o.options["MinY"];
				Resize.keepRatioByHeight(rect, nh, true);
			}
		}

		if (!constraint && !isNaN(o.options["MaxY"]) && o.options["MaxY"] < ny + nh) {
			nh = o.options["MaxY"] - ny;
			Resize.keepRatioByHeight(rect, nh, true);
		}

		rect.y = ny;
		rect.height = nh;
	},

	keepRatioByHeight: function(rect, height, constraint) {
		var handle = Resize.handle;
		var o = handle.root;

		var nw = height / o.sh * o.sw;
		var nx = rect.x;

		if (!constraint) {
			if (nw < o.options["MinWidth"]) {
				nw = o.options["MinWidth"];
				Resize.keepRatioByWidth(rect, nw, true);
			}
			else if (nw > o.options["MaxWidth"]) {
				nw = o.options["MaxWidth"];
				Resize.keepRatioByWidth(rect, nw, true);
			}
		}

		if (handle.type.endsWith("L")) {
			nx -= nw - rect.width;

			if (!constraint && !isNaN(o.options["MinX"]) && nx < o.options["MinX"]) {
				nw += nx - o.options["MinX"];
				nx = o.options["MinX"];
				Resize.keepRatioByWidth(rect, nw, true);
			}
		}

		if (!constraint && !isNaN(o.options["MaxX"]) && o.options["MaxX"] < nx + nw) {
			nw = o.options["MaxX"] - nx;
			Resize.keepRatioByWidth(rect, nw, true);
		}

		rect.x = nx;
		rect.width = nw;
	}
};

var Transform = {
	init: function(transformer, o, attachLater) {
		o.onmousedown = transformer.start;

		o.removeEventListener("touchstart", transformer.start);
		o.addEventListener("touchstart", transformer.start);

		if (!attachLater) this.attachOnTransformEvents(transformer, o.root);
	},

	attachOnTransformEvents: function(transformer, root) {
		root["on" + transformer.name + "Start"] = new Function();
		root["on" + transformer.name + "End"] = new Function();
		root["on" + transformer.name] = new Function();
	},

	onStart: function(transformer) {
		document.onmousemove = transformer.move;
		document.onmouseup = transformer.end;

		document.addEventListener("touchmove", transformer.move);
		document.addEventListener("touchend", transformer.end);
	},

	onEnd: function(transformer) {
		document.onmousemove = null;
		document.onmouseup = null;

		document.removeEventListener("touchmove", transformer.move);
		document.removeEventListener("touchend", transformer.end);

	},

	fixE: function(e) {
		e = e || window.event;
		if (e.changedTouches) e = e.changedTouches[0];
		return e;
	}
};