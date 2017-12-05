function getWorker() {
	var worker = new Worker(Module.getScriptPrefixURL("RTC.Client.js") + "/RTC.Worker.js");

	worker.addEventListener("message", function(e) {
		messanger[e.data.action](e.data);
	}, false);

	worker.addEventListener("error", function(e) {
		console.log(["ERROR: Line ", e.lineno, " in ", e.filename, ": ", e.message].join(""));
	}, false);

	return worker;
}

var pathWorker = getWorker();

var pathPartworker = getWorker();
// pathPartworker.queue = new Array();

var messanger = {
	init: function() {
		pathWorker.postMessage({action: "init", callback: "load", MAX_SCALE_FACTOR: WILL.MAX_SCALE_FACTOR});
		pathPartworker.postMessage({action: "init", callback: "load", MAX_SCALE_FACTOR: WILL.MAX_SCALE_FACTOR});
	},

	load: function(data) {
		console.log("worker is ready")
	},

	sendPathPart: function(writer, endStroke) {
		var stroke = WILL.incomplete[writer.pathID];
		var segment = stroke.segment;
		var pathPart = null;

		for (var i = 0; i < pathPartworker.queue.length; i++) {
			var next = pathPartworker.queue[i];

			if (next.strokeID == stroke.id) {
				pathPart = next;

				break;
			}
		}

		if (pathPart) {
// console.log("add")
			var points = segment.points;
			var stride = stroke.path.stride;

			if (endStroke)
				points = points.slice(2*stride, 2*stride);
			else
				points = points.slice(2*stride, points.length - stride);

			pathPart.points.pushArray(points);

			pathPart.bounds = Module.RectTools.union(pathPart.bounds, segment.bounds);

			if (!pathPartworker.strokeID) {
// console.log("shift");
				pathPart = pathPartworker.queue.shift();
			}
			else
				return;
		}
		else {
			if (pathPartworker.strokeID) {
// console.log("create")
				pathPartworker.queue.push(Object.clone(segment));
				return;
			}
			else
				pathPart = segment;
		}
// console.log("process");
		var strokeData = stroke.data;
		strokeData.path.points = pathPart.points.toFloat32Array();

		var segmentBounds = pathPart.bounds;

		pathPartworker.strokeID = stroke.id;
		pathPartworker.postMessage({action: "buildBezierPath", callback: "recieveBezierPathPart", strokeID: stroke.id, strokeData: strokeData, dirtyArea: segmentBounds}, [strokeData.path.points.buffer]);
	},

	sendPathPart: function(collaborator, segmentBounds) {
		var stroke = WILL.incomplete[collaborator.pathID];
		pathPartworker.postMessage({action: "buildBezierPath", callback: "recieveBezierPathPart", strokeID: stroke.id, strokeData: stroke.data, dirtyArea: segmentBounds}, [stroke.data.path.points.buffer]);
	},

	recieveBezierPathPart: function(data) {
/*
		delete pathPartworker.strokeID;
		if (pathPartworker.queue[0]) this.sendPathPart({pathID: pathPartworker.queue[0].strokeID});
*/
		var stroke = WILL.incomplete[data.strokeID];
		if (!stroke || !stroke.bezierPaths) return;

		var bezierPath = new Module.FlatPath(data.segments, data.color);
		bezierPath.bounds = data.dirtyArea;

		stroke.bezierPaths.push(bezierPath);

		WILL.redraw(WILL.modelToView(data.dirtyArea));
	},

	sendStrokePath: function(stroke) {
/*
		for (var i = 0; i < pathPartworker.queue.length; i++) {
			if (pathPartworker.queue[i].stroke.id == stroke.id) {
				pathPartworker.queue.removeAt(i);
				break;
			}
		}
*/
		WILL.incomplete[stroke.id] = stroke;
		pathWorker.postMessage({action: "buildBezierPath", callback: "recieveBezierPath", strokeID: stroke.id, strokeData: stroke.data}, [stroke.data.path.points.buffer]);
	},

	recieveBezierPath: function(data) {
		var stroke = WILL.incomplete[data.strokeID];

		stroke.path.points = data.points;
		stroke.bezierPath = new Module.FlatPath(data.segments, data.color);

		delete stroke.bezierPaths;
		delete WILL.incomplete[stroke.id];

		if (WILL.writer.unconfirmedStrokesData[stroke.id]) {
			if (WILL.RENDERERS_POOL)
				WILL.deallocStrokeRenderer(stroke.id);
			else {
				var data = WILL.writer.unconfirmedStrokesData[stroke.id];
				data.layer.delete();
				delete WILL.writer.unconfirmedStrokesData[stroke.id];
			}
		}

		WILL.strokes.push(stroke);

		if (stroke.incompleteTransform) {
			client.execTransform([stroke.id], stroke.incompleteTransform);
			delete stroke.incompleteTransform;
		}
		else
			WILL.redraw(WILL.modelToView(stroke.bounds));
	}
};

messanger.init();