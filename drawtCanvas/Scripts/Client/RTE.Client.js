var client = {
	name: window.name,

	init: function() {
		this.id = parent.server.getSessionID(this.name);

		WILL.writer.init(this.id);

		this.encoder = new Module.PathOperationEncoder();
		this.decoder = new Module.PathOperationDecoder(Module.PathOperationDecoder.getPathOperationDecoderCallbacksHandler(this.callbacksHandlerImplementation));
	},

	send: function(compose) {
		parent.server.receive(this.id, Module.readBytes(this.encoder.getBytes()), compose);
		this.encoder.reset();
	},

	receive: function(sender, data) {
		var writer = WILL.writers[sender];

		if (!writer) {
			writer = new WILL.Writer();
			writer.init(sender);
		}

		Module.writeBytes(data, function(int64Ptr) {
			this.decoder.decode(writer, int64Ptr);
		}, this);
	},

	callbacksHandlerImplementation: {
		onComposeStyle: function(writer, style) {
			if (writer.id == client.id) return;
			writer.strokeRenderer.configure(style);
		},

		onComposePathPart: function(writer, path, endStroke) {
			if (writer.id == client.id) return;

			WILL.activeWriters.add(writer);

			writer.strokeRenderer.draw(path, endStroke, true);

			if (endStroke) {
				writer.completeRendering();
				WILL.activeWriters.remove(writer);
			}

			WILL.refresh(writer.strokeRenderer.updatedArea);
		},

		onComposeAbort: function(writer) {
			if (writer.id == client.id) return;

			WILL.activeWriters.remove(writer);
			writer.super.abort();
		},

		onAdd: function(writer, strokes) {
			strokes.forEach(function(stroke) {
				if (writer.id == client.id)
					stroke = client.findStroke(stroke.id, true) || stroke;

				WILL.strokes.push(stroke);

				if (writer.unconfirmedStrokesData[0]) {
					var data = writer.unconfirmedStrokesData.shift();

					WILL.strokesLayer.blend(data.layer, {mode: data.blendMode, rect: data.strokeBounds});
					data.layer.delete();

					WILL.refresh(data.strokeBounds);
				}
				else
					WILL.refresh(stroke.bounds, true);
			}, this);
		},

		onRemove: function(writer, group) {
			var dirtyArea;

			group.forEach(function(strokeID) {
				var stroke = client.findStroke(strokeID);

				if (stroke) {
					dirtyArea = Module.RectTools.union(dirtyArea, stroke.bounds);
					WILL.strokes.remove(stroke);
				}
			}, this);

			if (dirtyArea)
				WILL.refresh(dirtyArea, true);
		},

		onUpdateColor: function(writer, group, color) {
			var dirtyArea;

			group.forEach(function(strokeID) {
				var stroke = client.findStroke(strokeID);

				if (stroke) {
					stroke.color = color;
					dirtyArea = Module.RectTools.union(dirtyArea, stroke.bounds);
				}
			});

			if (dirtyArea)
				WILL.refresh(dirtyArea, true);
		},

		onUpdateBlendMode: function(writer, group, blendMode) {},

		onSplit: function(writer, splits) {
			var strokesToRemove = new Array();

			splits.forEach(function(split) {
				var stroke = client.findStroke(split.id);

				if (stroke) {
					var replaceWith = new Array();

					split.intervals.forEach(function(interval) {
						var subStroke;

						if (writer.id == client.id)
							subStroke = client.findStroke(interval.id, true);

						if (!subStroke) {
							subStroke = stroke.subStroke(interval.fromIndex, interval.toIndex, interval.fromTValue, interval.toTValue);
							if (interval.id) subStroke.id = interval.id;
						}

						replaceWith.push(subStroke);
					}, this);

					strokesToRemove.push({stroke: stroke, replaceWith: replaceWith});
				}
			}, this);

			strokesToRemove.forEach(function(strokeToRemove) {
				WILL.strokes.replace(strokeToRemove.stroke, strokeToRemove.replaceWith);
			}, this);

			if (strokesToRemove.length > 0)
				WILL.refresh(splits.affectedArea, true);
		},

		onTransform: function(writer, group, mat) {
			var transform = false;

			group.forEach(function(strokeID) {
				var stroke = client.findStroke(strokeID);

				if (stroke) {
					transform = true;
					stroke.transform(mat);
				}
			});

			if (transform)
				WILL.refresh(WILL.VIEW_AREA, true);
		}
	},

	findStroke: function(strokeID, selection) {
		var result = null;
		var strokes = selection?WILL.selection.strokes || []:WILL.strokes;

		for (var i = 0; i < strokes.length; i++) {
			if (strokes[i].id == strokeID) {
				result = strokes[i];
				break;
			}
		}

		return result;
	},

	getStrokeIDs: function(strokes) {
		var result = new Array();

		strokes.forEach(function(stroke) {
			result.push(stroke.id);
		});

		return result.toUint32Array();
	}
};

Object.extend(WILL, {
	clear: function() {
		parent.server.clear();
	}
});

Object.extend(WILL, {
	io: {
		restore: function(bytes) {
			Module.writeBytes(bytes, function(int64Ptr) {
				var strokes = Module.InkDecoder.decode(bytes);

				client.encoder.encodeAdd(strokes);
				client.send();
			});
		}
	}
}, true);