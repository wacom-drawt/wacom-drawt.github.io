// var Command = dcodeIO.ProtoBuf.protoFromFile("/Shell.proto").build("Shell");
var Command;

dcodeIO.ProtoBuf.loadProtoFile("/Shell.proto", function(err, builder) {
	Command = builder.build("Shell");
});

// setTimeout(function() {
// 	console.clear();
// }, 3000)

function Collaborator(id) {
	this.id = id;

	client.collaborators[this.id] = this;
}

Collaborator.prototype.abort = function() {
	for (var pathID in WILL.incomplete) {
		var incompleteStroke = WILL.incomplete[pathID];

		if (incompleteStroke.creator == this.id) {
			WILL.redraw(WILL.modelToView(incompleteStroke.bounds));
			delete WILL.incomplete[pathID];
		}
	}
}

Collaborator.prototype.disconnect = function() {
	this.abort();
	delete client.collaborators[this.id];
}

var client = {
	// url: "ws://10.185.3.151:89/api/web",
	url: "ws://dev-messaging-bamboo-loop.cloudapp.net/api/web",
	// url: "wss://qa-messaging.bamboo-loop.com/api/web",
	// url: "wss://qa-messaging-us.bamboo-loop.com/api/web",
	// url: "wss://qa-messaging-ap.bamboo-loop.com/api/web",

	// AP: "wss://qa-messaging-ap.bamboo-loop.com/api/web",
	// EU: "wss://qa-messaging-eu.bamboo-loop.com/api/web",
	// US: "wss://qa-messaging-us.bamboo-loop.com/api/web",

	collaborators: new Object(),

	init: function(id, sessionID) {
		this.id = id;
		this.sessionID = sessionID;

		this.debugMode = client.DebugMode.NONE;
		this.debugKeepAlive = false;
		// menu.disableLibrary = true;

		this.encoder = new Module.PathOperationEncoder();
		this.decoder = new Module.PathOperationDecoder(Module.PathOperationDecoder.getPathOperationDecoderCallbacksHandler(this.callbacksHandlerImplementation));

		this.connect();
	},

	connect: function() {
		this.disconnect();
		menu.showOnlineStatus();

		this.socket = new WebSocket(this.url);
		this.socket.binaryType = "arraybuffer";

		this.socket.onopen = function(event) {
			client.log("WebSocket Open: " + client.sessionID);
			client.begin = Date.now();

			client.send(Command.Type.LOGIN, {
				login: client.createMessage("Login", {client_id: client.id, session_id: client.sessionID})
			});

			client.keepAlive();
		};

		this.socket.onmessage = function(event) {
			client.receive(event.data);
		};

		this.socket.onerror = function(e) {
			menu.showOnlineStatus(true);

			client.log("WebSocket Error: " + e.data);
			if (e.code) console.log("	code: " + e.code);
			if (e.reason) console.log("	reason: " + e.reason);
		};

		this.socket.onclose = function () {
			client.log("WebSocket Close: " + (client.begin?((Date.now() - client.begin) / 1000 / 60).toFixed(2) + " sec (" + (Date.now() - client.begin) + " ms)":"Open failed"));
			client.clearKeepAliveInterval();
			if (client.ready) client.reconnect();
		};

		window.addEventListener("unload", function(e) {client.disconnect(e);});
	},

	reconnect: function() {
		menu.showOnlineStatus(true);

		this.clearKeepAliveInterval();

		WILL.writer.abort();

		this.ready = false;
		this.log("------------- RECONNECT -------------");
		this.connect();
	},

	disconnect: function() {
		if (!this.socket) return;
		menu.showOnlineStatus(true);

		if (this.socket.readyState == this.socket.OPEN) {
			// this.send(Command.Type.LOGOUT);
			this.ready = false;
			this.socket.close();
		}
	},

	keepAlive: function() {
		if (this.intervalID) {
			if (!this.alive) this.alive = 0;

			if (this.alive > 5) {
				console.log("%c------------- LAG or DEAD -------------", "color:red");
				this.reconnect();
				return;
			}

			this.alive++;
			this.send(Command.Type.KEEP_ALIVE);
		}
		else {
			this.intervalID = setInterval(function() {
				client.keepAlive();
			}, 1000);
		}
	},

	clearKeepAliveInterval: function() {
		if (this.intervalID) {
			clearInterval(this.intervalID);
			delete this.intervalID;
			delete this.alive;
		}
	},

	createMessage: function(name, data) {
		var message = (name == "Command")?new Command():new Command[name]();

		if (data) {
			for (name in data)
				message[name] = data[name];
		}

		return message;
	},

	send: function(commandType, data) {
		if (this.socket.readyState != this.socket.OPEN) return;

		if (arguments.length == 0 || typeof commandType == "boolean") {
			var pathOperation = Module.readBytes(this.encoder.getBytes());
			if (pathOperation.length == 0) return;

			commandType = Command.Type.UPDATE_CANVAS;
			data = {path_operation: pathOperation, path_id: WILL.writer.strokeID};

			this.encoder.reset();
		}

		var comm = this.createMessage("Command", data);
		comm.command_type = commandType;

		this.debug(comm, this.DebugMode.SEND);

// if (this.add) {
// 	comm.command_type = Command.Type.SYSTEM;
// 	comm.system = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
// }

		var ab = comm.toArrayBuffer();

// if (this.add)
// 	tools.saveAs(ab, "UPDATE_CANVAS_ADD_STROKE");

		this.socket.send(ab);

		delete ab;
		delete comm;
	},

	receive: function(data) {
		var comm = Command.decode(data);

		var collaborator = this.collaborators[comm.client_id];
		if (!collaborator) collaborator = new Collaborator(comm.client_id);
		/*
		var writer = WILL.writers[comm.client_id];
		if (!writer) {
			writer = new WILL.Writer();
			writer.init(comm.client_id, comm.client_idx);
		}
		*/
		this.debug(comm, this.DebugMode.RECEIVE);

		switch (comm.command_type) {
			case Command.Type.LOGGEDIN:
				WILL.clear();

				if (comm.logged_in.authorised) {
					WILL.writer.init(this.id);
					WILL.writer.strokeID = comm.logged_in.stroke_id;

					this.updateCanvas({}, null, comm.path_operation);

					comm.logged_in.data.forEach(function(data) {
						var collaborator = this.collaborators[data.owner_id];
						if (!collaborator) collaborator = new Collaborator(data.owner_id);

						this.updateCanvas(collaborator, data.path_id, data.path_operation);
					}, this);

					comm.logged_in.images.forEach(function(data) {
						this.updateImage({}, data);
					}, this);

					this.ready = true;
					menu.hideOnlineStatus();
				}
				else {
					client.disconnect();
					alert("You are not authorised to access this session.");
				}

				break;
			case Command.Type.JOIN:
				//

				break;
			case Command.Type.LEAVE:
				//

				break;
			case Command.Type.DISCONNECTED:
				WILL.writer.abort();
				collaborator.disconnect();

				break;
			case Command.Type.CLEAR_CANVAS:
				WILL.clear();
				if (this.debugMode != this.DebugMode.NONE) console.clear();

				break;
			case Command.Type.UPDATE_CANVAS:
				this.updateCanvas(collaborator, comm.path_id, comm.path_operation);
				break;
			case Command.Type.UPDATE_IMAGE:
				this.updateImage(collaborator, comm.image);
				break;
			case Command.Type.COMPLETE_TRANSFORM:
				this.completeTransform(comm.path);
				break;
			case Command.Type.COMPLETE_IMAGE_TRANSFORM:
				this.updateImageOrder(comm.image_order.id, comm.image_order.images);
				break;
			case Command.Type.KEEP_ALIVE:
				this.alive = 0;
				break;
		}
	},

	updateCanvas: function(collaborator, pathID, pathOperation) {
		if (!pathOperation) return;

		Module.writeBytes(new Uint8Array(pathOperation.toArrayBuffer()), function(int64Ptr) {
			// writer.pathID = pathID;
			collaborator.pathID = pathID;

			this.decoder.decode(collaborator, int64Ptr);
		}, this);
	},

	updateImage: function(collaborator, data) {
		var image = WILL.images[data.index];

		if (data.remove) {
			if (!image)
				console.warn("Image with id " + data.id + " not found");
			else {
				WILL.images.remove(image);
				WILL.refreshImages();

				if (collaborator.id == client.id)
					WILL.selection.hide();
			}
		}
		else {
			if (!image) {
				if (collaborator.id == client.id) {
					image = WILL.unconfirmedImages[data.id];
					delete WILL.unconfirmedImages[data.id];

					WILL.images[data.index] = image;
					WILL.refreshImages();

					WILL.selection.create(image);
					WILL.selection.show();
				}
				else {
					var imageData = {
						id: data.id,
						src: data.src,
						transform: data.transform
					};

					WILL.importImage(imageData, true, function(image) {
						WILL.images[data.index] = image;
						WILL.refreshImages();
					});
				}
			}
			else {
				if (collaborator.id == client.id) {
					if (!WILL.selection.visible()) {
						WILL.selection.create(image);
						WILL.selection.show();
					}
				}
				else {
					image.data.transform = Module.MatTools.multiply(data.transform, image.data.transform);
					WILL.refreshImages();
				}
			}
		}
	},

	updateImageOrder: function(imageID, ordered) {
		var result = new Array();
		var images = new Object();

		WILL.images.forEach(function(image) {
			images[image.data.id] = image;
		}, this);

		ordered.forEach(function(id) {
			var image = images[id];
			if (id == imageID) delete image.top;

			result.push(image);
		}, this);

		WILL.images = result;
		WILL.refreshImages();
	},

	completeTransform: function(group) {
		var dirtyArea;

		group.forEach(function(strokeID) {
			var stroke = client.findStroke(strokeID, false, true);
			if (!stroke) console.error("completeTransform: stroke not found", strokeID);

			if (stroke) {
				stroke.transform();

				dirtyArea = Module.RectTools.union(dirtyArea, stroke.bounds);

				WILL.strokesTransform.remove(stroke);
				WILL.strokes.push(stroke);
			}
		});

		if (dirtyArea)
			WILL.redraw(WILL.modelToView(dirtyArea), true);
	},

	centerPoints: function(points, send) {
		var center = Module.canvas.toRect().center;

		for (var i = 0; i < points.length; i++) {
			if (i % 3 == 0)
				points[i] += center.x * (send?-1:1);
			else if (i % 3 == 1)
				points[i] += center.y * (send?-1:1);;
		}

		return points;
	},

	centerMatrix: function(mat, send) {
		var center = Module.canvas.toRect().center;

		var cx = center.x;
		var cy = center.y;
		var tdx = cx - cx*mat.a + cy*mat.b;
		var tdy = cy + cx*mat.c - cy*mat.d;

		mat.tx += tdx * (send?-1:1);
		mat.ty += tdy * (send?-1:1);

		return mat;
	},

	timePrefix: function() {
		var d = new Date();
		var time = d.getHours().pad(2) + ":" + d.getMinutes().pad(2) + ":" + d.getSeconds().pad(2) + "." + d.getMilliseconds().pad(4);
		return "[" + time + "]: ";
	},

	log: function(message) {
		console.log(this.timePrefix() + message);
	},

	getCommandTypeName: function(commandType) {
		var result = null;

		for (name in Command.Type) {
			if (Command.Type[name] === commandType) {
				result = name;
				break;
			}
		}

		return result;
	},

	debug: function(comm, mode) {
		var debug;
		var actor;

		var prefix = "%c" + mode.name + "(%c%s%c): %c";
		var color = "color: ";

		if (mode == this.DebugMode.RECEIVE) {
			debug = this.debugMode == this.DebugMode.RECEIVE || this.debugMode == this.DebugMode.ALL;
			actor = comm.client_id;
			color += "red";
		}
		// this.DebugMode.SEND
		else {
			debug = this.debugMode == this.DebugMode.SEND || this.debugMode == this.DebugMode.ALL;
			actor = this.id;
			color += "green";
		}

		if (debug) {
			var exclude = [Command.Type.KEEP_ALIVE, Command.Type.UPDATE_CANVAS];

			if (!exclude.contains(comm.command_type))
				console.log(this.timePrefix() + prefix + this.getCommandTypeName(comm.command_type), color, "color: purple; font-weight: bold;", actor, color, "color: black");
			else if (comm.command_type != Command.Type.KEEP_ALIVE)
				console.log(prefix + this.getCommandTypeName(comm.command_type), color, "color: purple; font-weight: bold;", actor, color, "color: black");
		}

		if (this.debugKeepAlive && comm.command_type == Command.Type.KEEP_ALIVE)
			console.log(this.timePrefix() + "%c" + mode.name + ": %cKEEP_ALIVE", color, "color: black");
	},

	callbacksHandlerImplementation: {
		onComposeStyle: function(writer, style) {
			// if (writer.id == client.id) return;
			writer.strokeRenderer.configure(style);
		},

		onComposeStyle: function(collaborator, style) {
			collaborator.style = style;
		},

		onComposePathPart: function(writer, path, endStroke) {
			// if (writer.id == client.id) return;

			WILL.activeWriters.add(writer);

			writer.strokeRenderer.draw(path, endStroke, true);

			if (endStroke) {
				writer.completeRendering();
				WILL.activeWriters.remove(writer);
			}

			WILL.refresh(writer.strokeRenderer.updatedArea);
		},

		onComposePathPart: function(collaborator, path, endStroke) {
			var stroke = WILL.incomplete[collaborator.pathID];

			if (!stroke) {
				stroke = new Module.Stroke(collaborator.style.brush, {points: new Float32Array(12), stride: path.stride}, collaborator.style.width, collaborator.style.color, 0, 1, collaborator.style.randomSeed, collaborator.style.blendMode);
				stroke.id = collaborator.pathID;
				stroke.bezierPaths = [];

				WILL.incomplete[collaborator.pathID] = stroke;
			}

			var segmentBounds = Module.calculateSegmentBounds(path.points, path.stride, collaborator.style.width, 0, 0);
			stroke.path.bounds = Module.RectTools.union(stroke.path.bounds, segmentBounds);
			stroke.path.points = Module.readFloats(path.points);

			messanger.sendPathPart(collaborator, segmentBounds);
			/*
			var points = Module.readFloats(path.points).toArray();

			if (endStroke)
				points = points.slice(2*path.stride, 2*path.stride);
			else if (this.points)
				points = points.slice(2*path.stride, points.length - path.stride);

			if (!this.points) this.points = [];
			this.points.pushArray(points);

			messanger.sendPathPart(writer, Module.PathBuilder.createPath(this.points, path.stride));

			if (endStroke) delete this.points;
			*/
		},

		onComposeAbort: function(writer) {
			// if (writer.id == client.id) return;

			WILL.activeWriters.remove(writer);
			writer.super.abort();
		},

		onComposeAbort: function(collaborator) {
			var stroke = WILL.incomplete[collaborator.pathID];

			if (stroke)
				delete WILL.incomplete[collaborator.pathID];

			if (stroke)
				WILL.redraw(WILL.modelToView(stroke.bounds));
		},

		onAdd: function(writer, strokes) {
			var dirtyArea;
			// var redraw = false;

			strokes.forEach(function(stroke) {
				if (writer.id == client.id)
					stroke = client.findStroke(stroke.id, true) || client.findStroke(stroke.id, false, true) || stroke;

				WILL.strokes.push(stroke);
				dirtyArea = Module.RectTools.union(dirtyArea, stroke.bounds);

				if (writer.unconfirmedStrokesData[0]) {
					var data = writer.unconfirmedStrokesData.shift();

					if (WILL.mode == WILL.Mode["GL"])
						WILL.strokesLayer.blend(data.layer, {mode: data.blendMode, rect: data.strokeBounds});

					data.layer.delete();
				}
				// else
				// 	redraw = true;
			}, this);

			// if (dirtyArea) {
				// if (redraw)
					WILL.redraw(dirtyArea);
				// else
					// WILL.refresh(dirtyArea);
			// }
		},

		onAdd: function(collaborator, strokes) {
			if (client.ready) {
				strokes.forEach(function(stroke) {
					if (collaborator.id == client.id)
						stroke = client.findStroke(stroke.id, true) || client.findStroke(stroke.id, false, true) || stroke;
					else {
						var incompleteStroke = WILL.incomplete[stroke.id];

						if (incompleteStroke) {
							incompleteStroke.path = stroke.path;
							stroke = incompleteStroke;
						}
					}

					messanger.sendStrokePath(stroke);
				}, this);
			}
			else {
				var dirtyArea;

				strokes.forEach(function(stroke) {
					var bezierPath = new Module.FlatPath();
					bezierPath.setStroke(stroke, WILL.MAX_SCALE_FACTOR);

					stroke.bezierPath = bezierPath;
					WILL.strokes.push(stroke);

					dirtyArea = Module.RectTools.union(dirtyArea, stroke.bounds);
				}, this);

				WILL.redraw(WILL.modelToView(dirtyArea));
			}
		},

		onRemove: function(collaborator, group) {
			var dirtyArea;
			var refreshTransform = false;

			group.forEach(function(strokeID) {
				var stroke = client.findStroke(strokeID);

				if (stroke) {
					dirtyArea = Module.RectTools.union(dirtyArea, stroke.bounds);
					WILL.strokes.remove(stroke);
				}
				else {
					stroke = client.findStroke(strokeID, false, true);

					if (stroke) {
						refreshTransform = true;
						WILL.strokesTransform.remove(stroke);

						if (WILL.selection.visible()) {
							WILL.selection.strokes.remove(stroke);
							if (WILL.selection.strokes.length == 0) WILL.selection.hide();
						}
					}
				}
			}, this);

			if (refreshTransform)
				WILL.refreshTransform();
			else if (dirtyArea) {
				if (WILL.mode == WILL.Mode["2D"])
					WILL.redraw(WILL.modelToView(dirtyArea));
				else
					WILL.refresh(dirtyArea);
			}
		},

		onUpdateColor: function(collaborator, group, color) {
			var dirtyArea;

			group.forEach(function(strokeID) {
				var stroke = client.findStroke(strokeID) || client.findStroke(strokeID, false, true);

				if (stroke) {
					stroke.color = color;
					dirtyArea = Module.RectTools.union(dirtyArea, stroke.bounds);

					if (WILL.mode == WILL.Mode["2D"])
						stroke.bezierPath.color = color;
				}
			});

			if (dirtyArea)
				WILL.redraw(WILL.modelToView(dirtyArea));
		},

		onUpdateBlendMode: function(collaborator, group, blendMode) {},

		onSplit: function(collaborator, splits) {
			var strokesToRemove = new Array();

			splits.forEach(function(split) {
				var stroke = client.findStroke(split.id);

				if (stroke) {
					var replaceWith = new Array();

					split.intervals.forEach(function(interval) {
						var subStroke;
						var push = true;

						if (collaborator.id == client.id) {
							subStroke = client.findStroke(interval.id, true);
							if (WILL.mode == WILL.Mode["2D"] && subStroke && WILL.strokesTransform.contains(subStroke)) push = false;
						}

						if (!subStroke) {
							subStroke = stroke.subStroke(interval.fromIndex, interval.toIndex, interval.fromTValue, interval.toTValue);
							if (interval.id) subStroke.id = interval.id;
						}

						if (push)
							replaceWith.push(subStroke);
					}, this);

					strokesToRemove.push({stroke: stroke, replaceWith: replaceWith});
				}
			}, this);

			strokesToRemove.forEach(function(strokeToRemove) {
				WILL.strokes.replace(strokeToRemove.stroke, strokeToRemove.replaceWith);
			}, this);

			if (strokesToRemove.length > 0)
				WILL.redraw(WILL.modelToView(splits.affectedArea));
		},

		onTransform: function(collaborator, group, transform) {
			client.execTransform(group, transform);
		}
	},

	execTransform: function(group, transform) {
		var refresh = false;
		var dirtyArea;

		group.forEach(function(strokeID) {
			var stroke = WILL.incomplete[strokeID];

			if (stroke) {
				if (stroke.incompleteTransform)
					stroke.incompleteTransform = Module.MatTools.multiply(transform, stroke.incompleteTransform);
				else
					stroke.incompleteTransform = transform;
			}
			else {
				stroke = client.findStroke(strokeID);

				if (stroke) {
					dirtyArea = Module.RectTools.union(dirtyArea, stroke.bounds);

					WILL.strokes.remove(stroke);
					WILL.strokesTransform.push(stroke);
				}
				else
					stroke = client.findStroke(strokeID, false, true);

				if (stroke) {
					refresh = true;

					// transform = client.centerMatrix(transform, false);
					stroke.transform(transform);
				}
				else
					console.warn("execTransform: stroke not found", strokeID);
			}
		});

		if (dirtyArea)
			WILL.redraw(WILL.modelToView(dirtyArea), true);
		else if (refresh) {
			if (WILL.mode == WILL.Mode["2D"])
				WILL.refreshTransform();
			else
				WILL.redraw(WILL.VIEW_AREA);
		}
	},

	findStroke: function(strokeID, selection, transform) {
		var result = null;
		var strokes = WILL.strokes;
		if (selection) strokes = WILL.selection.strokes || [];
		else if (transform) strokes = WILL.strokesTransform;

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
	MIN_SCALE_FACTOR: 0.2,
	MAX_SCALE_FACTOR: 4,

	RENDERERS_POOL: false,

	clear: function(send) {
		if (send)
			client.send(Command.Type.CLEAR_CANVAS);
		else {
			var resend = WILL.strokesTransform.length > 0;
			this.super.clear();
			if (resend) this.clear(true);
		}
	},

	refresh: function (dirtyArea) {
		dirtyArea = this.ensureVisibleArea(dirtyArea);
		if (!dirtyArea) return;

		if (this.writer.context) {
			if (this.writer.context.inputPhase == Module.InputPhase.Move)
				this.writer.strokeRenderer.drawPreliminary(this.writer.context.preliminaryPathPart);

			dirtyArea = this.writer.strokeRenderer.updatedArea;

			this.canvas.clear(dirtyArea);
			this.writer.strokeRenderer.blendUpdatedArea();
		}
		else
			this.canvas.clear(dirtyArea);

		for (var strokeID in this.writer.unconfirmedStrokesData) {
			var data = this.writer.unconfirmedStrokesData[strokeID];
			this.canvas.blend(data.layer, {mode: data.blendMode, rect: dirtyArea});
		}
	},

	zoom: function(e) {
		if (WILL.selection.visible()) return;

		var transform;

		if (e.type == "wheel") {
			var pos = tools.getMousePos(e);
			var scale = (e.deltaY > 0)?0.97:1.03;
			transform = Module.MatTools.makeScaleAtPoint(scale, pos);
		}
		else {
			var translate = Module.MatTools.makeTranslate(e.origin);
			transform = Module.MatTools.makeScaleAtPoint(e.scale, e.point);

			var update = Module.MatTools.invert(translate);
			update = Module.MatTools.multiply(transform, update);
			update = Module.MatTools.multiply(translate, update);

			transform = update;
		}

		transform = Module.MatTools.multiply(transform, this.transform);

		if ((this.transform.a == WILL.MIN_SCALE_FACTOR && transform.a < WILL.MIN_SCALE_FACTOR) || (this.transform.a == WILL.MAX_SCALE_FACTOR && transform.a > WILL.MAX_SCALE_FACTOR))
			return;

		if (transform.a < WILL.MIN_SCALE_FACTOR) {
			transform.a = WILL.MIN_SCALE_FACTOR;
			transform.d = WILL.MIN_SCALE_FACTOR;
		}
		else if (transform.a > WILL.MAX_SCALE_FACTOR) {
			transform.a = WILL.MAX_SCALE_FACTOR;
			transform.d = WILL.MAX_SCALE_FACTOR;
		}

		this.transform = transform;
		this.canvas2D.transform = this.transform;
		this.canvasTransform.transform = this.transform;

		// this.canvas.clear();
		this.redraw(WILL.VIEW_AREA);
		this.refreshImages();
	},

	pan: function(delta) {
		if (WILL.selection.visible()) return;

		var transform = Module.MatTools.makeTranslate(delta);

		this.transform = Module.MatTools.multiply(transform, this.transform);
		this.canvas2D.transform = this.transform;
		this.canvasTransform.transform = this.transform;

		// this.canvas.clear();
		this.redraw(WILL.VIEW_AREA);
		this.refreshImages();
	},

	resetTransforms: function() {
		this.transform = Module.MatTools.create();
		this.canvas2D.transform = this.transform;
		this.canvasTransform.transform = this.transform;

		// this.canvas.clear();
		this.redraw(WILL.VIEW_AREA);
		this.refreshImages();
	},

	initImage: function(image, data, confirmed) {
		this.super.initImage(image, data, confirmed);

		if (!confirmed) {
			client.send(Command.Type.UPDATE_IMAGE, {
				image: client.createMessage("Image", image.data)
			});
		}
	},

	selection: {
		completeSelection: function() {
			if (this.strokes.length == 0 && !this.image) return;
			var imageID = this.image?this.image.data.id:NaN;

			this.super.completeSelection();

			if (!isNaN(imageID)) {
				client.send(Command.Type.COMPLETE_IMAGE_TRANSFORM, {
					image_order: client.createMessage("ImageOrderUpdate", {
						id: imageID
					})
				});
			}
			else if (this.transformed) {
				client.send(Command.Type.COMPLETE_TRANSFORM, {
					path: client.getStrokeIDs(this.strokes).toArray()
				});
			}
		},

		transformImage: function(mat) {
			this.super.transformImage(mat);

			client.send(Command.Type.UPDATE_IMAGE, {
				image: client.createMessage("Image", {
					id: this.image.data.id,
					src: this.image.data.src,
					transform: mat
				})
			});
		},

		copy: function(cut) {
			var dirtyArea;
			var image = this.image;

			this.super.copy(cut);

			if (!image) {
				menu.clipboard.layer.clear();

				this.clipboard.strokes.forEach(function(stroke) {
					if (WILL.mode == WILL.Mode["2D"]) {
						stroke = Object.clone(stroke);
						stroke.transform(WILL.transform);
						stroke.transform();
					}

					menu.clipboard.layer.draw(stroke);
					dirtyArea = Module.RectTools.union(dirtyArea, stroke.bounds);
				});

				menu.clipboard.add(this.clipboard, WILL.getImageCanvas(menu.clipboard.layer, dirtyArea));
			}
		},

		delete: function() {
			if (this.image) {
				client.send(Command.Type.UPDATE_IMAGE, {
					image: client.createMessage("Image", {
						id: this.image.data.id,
						remove: true
					})
				});
			}
			else
				this.super.delete();
		}
	},

	io: {
		restore: function(bytes) {
			var clipboard = new Object();
			clipboard.strokes = new Array();
			clipboard.path = new Array();
			clipboard.transform = "";

			menu.clipboard.layer.clear();

			Module.writeBytes(bytes, function(int64Ptr) {
				var strokes = Module.InkDecoder.decode(bytes);

				clipboard.strokes.pushArray(strokes);
				clipboard.rect = strokes.bounds;
				clipboard.transformedRect = strokes.bounds;

				strokes.forEach(function(stroke) {
					WILL.writer.strokeRenderer.draw(stroke);
					WILL.writer.strokeRenderer.blendStroke(menu.clipboard.layer, stroke.blendMode);
				}, this);
			});

			menu.clipboard.add(clipboard, WILL.getImageCanvas(menu.clipboard.layer, clipboard.rect));
		}
	}
});

if (WILL.RENDERERS_POOL) {
	Object.extend(WILL, {
		pool: [],
		poolCapacity: 5,
		// context: {},

		initInkEngine: function(width, height) {
			this.super.initInkEngine(width, height);

			for (var i = 0; i < this.poolCapacity; i++)
				this.pool.push(new Module.StrokeRenderer(this.canvas));

			Object.extend(client.callbacksHandlerImplementation, this.callbacksHandlerImplementation, true);
		},

		allocStrokeRenderer: function(strokeID) {
			if (this.pool.length == 0) throw new Error("StrokeRenderer pool exceeded");

			var strokeRenderer = this.pool.shift();
			WILL.writer.unconfirmedStrokesData[strokeID] = strokeRenderer;

			return strokeRenderer;
		},

		deallocStrokeRenderer: function(strokeID) {
			var strokeRenderer = WILL.writer.unconfirmedStrokesData[strokeID];
			if (!strokeRenderer) throw new Error("deallocStrokeRenderer failed");

			delete WILL.writer.unconfirmedStrokesData[strokeID];
			this.pool.push(strokeRenderer);
		},

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

		completeRefresh: function (dirtyArea) {
			dirtyArea = this.ensureVisibleArea(dirtyArea);
			if (!dirtyArea) return;

			this.canvas.clear(dirtyArea);

			for (var strokeID in this.writer.unconfirmedStrokesData) {
				if (this.writer.context && strokeID == WILL.strokeID) {
					if (this.writer.context.inputPhase == Module.InputPhase.Move)
						this.writer.strokeRenderer.drawPreliminary(this.writer.context.preliminaryPathPart);

					this.writer.strokeRenderer.updatedArea = dirtyArea;
					this.writer.strokeRenderer.blendUpdatedArea();
				}
				else {
					var strokeRenderer = this.writer.unconfirmedStrokesData[strokeID];
					this.canvas.blend(strokeRenderer.layer, {mode: strokeRenderer.blendMode, rect: dirtyArea});
				}
			}
		},

		callbacksHandlerImplementation: {
			onComposePathPart: function(collaborator, path, endStroke) {
				// if (collaborator.id == client.id) return;

				var strokeRenderer = WILL.writer.unconfirmedStrokesData[collaborator.pathID];

				if (!strokeRenderer) {
					strokeRenderer = WILL.allocStrokeRenderer(collaborator.pathID);
					strokeRenderer.configure({brush: collaborator.style.brush, width: collaborator.style.width, color: collaborator.style.color, blendMode: collaborator.style.blendMode});

					WILL.writer.unconfirmedStrokesData[collaborator.pathID] = strokeRenderer;
				}

				path.transform = WILL.transform;
				strokeRenderer.draw(path, endStroke, true);

				WILL.refresh(strokeRenderer.updatedArea);
			},

			onComposeAbort: function(collaborator) {
				var strokeRenderer = WILL.writer.unconfirmedStrokesData[collaborator.pathID];

				if (strokeRenderer) {
					strokeRenderer.abort();
					WILL.deallocStrokeRenderer(collaborator.pathID);
				}
			}
		}
	});
}

Function.prototype.createEnum.call(client, "DebugMode", ["NONE", "ALL", "SEND", "RECEIVE"]);