var href = location.href.substring(0, location.href.lastIndexOf("/"));
var MAX_SCALE_FACTOR;

self.addEventListener("message", function(e) {
	// console.log(JSON.stringify(e.data));

	var result = messanger[e.data.action](e.data);
	result.action = e.data.callback;

	var transferrable = result.transferrable || [];
	delete result.transferrable;

	self.postMessage(result, transferrable);
}, false);

var messanger = {
	init: function(data) {
		MAX_SCALE_FACTOR = data.MAX_SCALE_FACTOR;

		self.importScripts(href + "/js.ext.js");
		self.importScripts(href + "/WILL/engine/Module.js");

		Module.memoryInitializerPrefixURL = href + "/WILL/engine/";

		self.importScripts(href + "/WILL/engine/WacomInkEngine.js");

		return {};
	},

	buildBezierPath: function(data) {
		var points = data.strokeData.path.points;

		var path = new Module.FlatPath();
		path.setStroke(data.strokeData, MAX_SCALE_FACTOR);

		var transferrable = [points.buffer];
		var segments = path.data;
		var color = path.color;

		segments.forEach(function(segment) {
			transferrable.push(segment.buffer);
		});

		return {
			strokeID: data.strokeID,
			dirtyArea: data.dirtyArea,
			points: points,
			segments: segments,
			color: color,
			transferrable: transferrable
		};
	}
};