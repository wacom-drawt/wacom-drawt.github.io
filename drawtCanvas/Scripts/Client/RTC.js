var Command = dcodeIO.ProtoBuf.protoFromFile("/Command.proto").build("Command");

var rtc = client = {
	// url: "ws://10.144.142.29:89/api/web",
	// url: "ws://192.168.1.2:89/api/web",
	// url: "ws://192.168.2.247:89/api/web",
	url: "ws://rtc-eu.cloudapp.net:80/api/web",

	writers: new Object(),

	init: function(canvasID, userName) {
		this.canvasID = canvasID;
		this.userName = userName;
		this.debugMode = rtc.DebugMode.NONE;
		this.debugKeepAlive = false;

		this.will.init();

		this.connect();
	},

	connect: function() {
		this.disconnect();
		menu.showOnlineStatus();

		this.socket = new WebSocket(this.url);
		this.socket.binaryType = "arraybuffer";

		this.socket.onopen = function(event) {
			rtc.log("WebSocket Open: " + rtc.userName);
			rtc.begin = Date.now();

			rtc.send(Command.Type.LOGIN, {
				login: rtc.createMessage("Login", {user_name: rtc.userName})
			});

			rtc.keepAlive();
		};

		this.socket.onmessage = function(event) {
			rtc.receive(event.data);
		};

		this.socket.onerror = function(e) {
			menu.showOnlineStatus(true);

			rtc.log("WebSocket Error: " + e.data);
			console.log("	code: " + e.code);
			console.log("	reason: " + e.reason);
		};

		this.socket.onclose = function () {
			rtc.log("WebSocket Close: " + (rtc.begin?((Date.now() - rtc.begin) / 1000 / 60).toFixed(2) + " sec (" + (Date.now() - rtc.begin) + " ms)":"Open failed"));
			rtc.clearKeepAliveInterval();
			if (rtc.ready) rtc.reconnect();
		};

		window.addEventListener("unload", function(e) {rtc.disconnect(e);});
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
			this.send(Command.Type.LOGOUT);
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
				rtc.keepAlive();
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

	send: function(commandType, data) {
		var comm = this.createMessage("Command", data);
		comm.command_type = commandType;

		this.debug(comm, this.DebugMode.SEND);
		rtc.socket.send(comm.toArrayBuffer());
	},

	receive: function(data) {
		if (typeof data == "string")
			console.log("Server: " + data);
		else {
			// data = JSON.parse(data);
			// console.log("data: " + data.byteLength);
			this.exec(Command.decode(data));
		}
	},

	exec: function(comm) {
		this.debug(comm, this.DebugMode.RECEIVE);

		switch (comm.command_type) {
			case Command.Type.LOGGEDIN:
				this.clientID = comm.client_id;

				this.send(Command.Type.JOIN_CANVAS, {
					join_canvas: this.createMessage("JoinCanvas", {canvas_id: this.canvasID})
				});

				break;
			case Command.Type.DISCONNECTED:
				this.getClientWriter(comm.client_id).abort();
				delete this.writers[comm.client_id];

				break;
			case Command.Type.JOIN_CANVAS:
				// when somebody else joined this canvas

				break;
			case Command.Type.LEAVE_CANVAS:
				// when somebody else left this canvas

				break;
			case Command.Type.LOAD_CANVAS:
				this.will.clear.call(WILL);

				var buffer = comm.load_canvas.bpvg.toArrayBuffer();
				if (buffer.byteLength > 0) WILL.io.restore(buffer);

				this.ready = true;
				menu.hideOnlineStatus();

				break;
			case Command.Type.CLEAR_CANVAS:
				this.will.clear.call(WILL);
				if (this.debugMode != this.DebugMode.NONE) console.clear();

				break;
			case Command.Type.BEGIN_STROKE:
				this.beginStroke(comm);
				break;
			case Command.Type.ADD_POINTS_TO_STROKE:
				this.moveStroke(comm);
				break;
			case Command.Type.END_STROKE:
				this.endStroke(comm);
				break;
			case Command.Type.ABORT_STROKE:
				this.getClientWriter(comm.client_id).abort();
				break;
			case Command.Type.STROKES_UPDATED:
				this.updateModel(comm);
				break;
			case Command.Type.UNDO:
				this.will.undo.call(WILL);
				break;
			case Command.Type.REDO:
				this.will.redo.call(WILL);
				break;
			case Command.Type.KEEP_ALIVE:
				this.alive = 0;
				break;
		}
	},

	abortStroke: function() {
		if (!WILL.writer.context) return;

		WILL.writer.abort();
		this.send(Command.Type.ABORT_STROKE);
	},

	beginStroke: function(comm) {
		var bs = comm.begin_stroke;
		var writer = this.getClientWriter(comm.client_id);

		writer.color = bs.color;
		writer.strokeID = bs.identifier;

		writer.tool.strokeLayerBlendMode = Module.BlendMode[bs.layer_blend_mode];
		writer.strokeRenderer.configure({color: bs.color});

		writer.updateContext(null, Module.InputPhase.Begin);
		WILL.activeWriters.push(writer);
	},

	moveStroke: function(comm) {
		var aps = comm.add_points_to_stroke;
		var writer = this.getClientWriter(comm.client_id);

		if (!writer.context) return;
		writer.updateContext(null, Module.InputPhase.Move);
		writer.context.pathPart = writer.tool.pathBuilder.createPath(this.centerPoints(aps.added_points));

		writer.draw();
	},

	endStroke: function(comm) {
		var writer = this.getClientWriter(comm.client_id);

		writer.updateContext(null, Module.InputPhase.End);
		writer.draw();

		writer.keepContext();
	},

	updateModel: function(comm) {
		var su = comm.strokes_updated;
		var dirtyArea;

		if (su.save_history_state)
			WILL.history.add();

		su.strokes_added.forEach(function(sa) {
			var rect = rtc.addStroke(comm.client_id, sa);
			if (rect) dirtyArea = Module.RectTools.union(dirtyArea, rect);
		});

		su.strokes_removed.forEach(function(sr) {
			var rect = rtc.removeStroke(rtc.findStroke(sr.stroke_client_id, sr.stroke_identifier));
			dirtyArea = Module.RectTools.union(dirtyArea, rect);
		});

		su.strokes_color_changed.forEach(function(scc) {
			var stroke = rtc.findStroke(scc.stroke_client_id, scc.stroke_identifier);

			if (stroke) {
				stroke.color = scc.color;
				dirtyArea = Module.RectTools.union(dirtyArea, stroke.bounds);
			}
		});

		su.strokes_split.forEach(function(ss) {
			var stroke = rtc.findStroke(ss.stroke_client_id, ss.stroke_identifier);

			if (stroke) {
				var replaceWith = new Array();

				ss.slices.forEach(function(slice) {
					if (slice.stroke_identifier) {
						var subStroke;

						if (comm.client_id == rtc.clientID)
							subStroke = rtc.findStroke(ss.stroke_client_id, slice.stroke_identifier, true);

						if (!subStroke) {
							subStroke = stroke.subStroke(slice.startingIndex, slice.finalIndex, slice.startingT, slice.finalT);
							subStroke.id = slice.stroke_identifier;
							subStroke.version = slice.stroke_version;
							subStroke.owner = comm.client_id;
						}

						replaceWith.push(subStroke);
					}
					else {
						var rect = rtc.sliceStroke(stroke, slice);
						dirtyArea = Module.RectTools.union(dirtyArea, rect);
					}
				});

				WILL.strokes.replace(stroke, replaceWith);
			}
		});

		su.strokes_transformed.forEach(function(st) {
			var stroke = rtc.findStroke(st.stroke_client_id, st.stroke_identifier);
			if (stroke) rtc.transformStroke(stroke, st.transform);
		});

		if (dirtyArea || su.strokes_transformed.length > 0)
			WILL.refresh(dirtyArea || WILL.VIEW_AREA, true);
	},

	addStroke: function(clientID, sa) {
		var rect;

		var writer = this.getClientWriter(clientID);
		var stroke = rtc.findStroke(clientID, sa.stroke_identifier, true);

		if (!stroke) {
			// var path = Module.PathBuilder.createPath(this.centerPoints(sa.points), sa.stride);
			var path = {points: this.centerPoints(sa.points).toFloat32Array(), stride: sa.stride};

			stroke = new Module.Stroke(
				writer.tool.brush,
				path,
				NaN,
				Module.Color.from(Module.Color.toArray(sa.color)),
				sa.startingT, sa.finalT
			);

			stroke.id = sa.stroke_identifier;
			stroke.version = sa.stroke_version;
			stroke.owner = clientID;
		}

		WILL.strokes.push(stroke);

		if (writer.unconfirmedStrokesData[0]) {
			var strokeLayer = writer.unconfirmedStrokesData[0].layer;
			var strokeRect = writer.unconfirmedStrokesData[0].rect;

			WILL.strokesLayer.blend(strokeLayer, {mode: Module.BlendMode[sa.layer_blend_mode], rect: strokeRect});

			writer.unconfirmedStrokesData.shift();

			if (writer.unconfirmedStrokesData.length == 0)
				WILL.activeWriters.remove(writer);

			WILL.refresh(strokeRect);
			strokeLayer.delete();
		}
		else
			rect = WILL.VIEW_AREA;

		return rect;
	},

	removeStroke: function(stroke) {
		var rect;

		if (stroke) {
			rect = stroke.bounds;
			WILL.strokes.remove(stroke);
		}

		return rect;
	},

	sliceStroke: function(stroke, slice) {
		var holeStrokePoints = stroke.path.points.subarray(slice.startingIndex * stroke.path.stride, slice.finalIndex * stroke.path.stride + stroke.path.stride);
		var holeStroke = new Module.Stroke(stroke.brush, {points: holeStrokePoints, stride: stroke.path.stride}, stroke.width, stroke.color, slice.startingT, slice.finalT);

		return holeStroke.bounds;
	},

	transformStroke: function(stroke, transform) {
		var mat = Module.MatTools.create();

		mat.a = transform[0];
		mat.b = transform[1];
		mat.c = transform[2];
		mat.d = transform[3];
		mat.tx = transform[4];
		mat.ty = transform[5];

		transform = this.centerMatrix(mat, false);

		mat.a = transform[0];
		mat.b = transform[1];
		mat.c = transform[2];
		mat.d = transform[3];
		mat.tx = transform[4];
		mat.ty = transform[5];

		stroke.transform(mat);
	},

	getClientWriter: function(clientID) {
		var writer = this.writers[clientID];

		if (!writer) {
			if (clientID == this.clientID)
				writer = WILL.writer;
			else {
				writer = new WILL.Writer();
				writer.unconfirmedStrokesData = new Array();
				writer.clientID = clientID;

				writer.tool = new WILL.Tool("RTC" + clientID, WILL.Tool.Type.STROKE);
				writer.tool.brush = WILL.tools.brush;

				writer.tool.createPathBuilder(WILL.Tool.PathBuilderType.SPEED);
				writer.tool.configureNormalization(5, 210);
				writer.tool.configureWidthChanel(1, 3.2, NaN, NaN, Module.PropertyFunction.Sigmoid, 0.6191646, true);
				writer.tool.createSmoothener();

				writer.strokeRenderer.configure({brush: writer.tool.brush});
			}

			this.writers[clientID] = writer;
		}

		return writer;
	},

	findStroke: function(clientID, identifier, selection) {
		var result = null;
		var strokes = selection?WILL.selection.strokes:WILL.strokes;

		for (var i = 0; i < strokes.length; i++) {
			if (strokes[i].owner == clientID && strokes[i].id == identifier) {
				result = strokes[i];
				break;
			}
		}

		return result;
	},

	createMessage: function(name, data) {
		var message = (name == "Command")?new Command():new Command[name]();

		if (data) {
			for (name in data)
				message[name] = data[name];
		}

		return message;
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

		var a = mat.a;
		var b = mat.b;
		var c = mat.c;
		var d = mat.d;
		var tx = mat.tx;
		var ty = mat.ty;

		var cx = center.x;
		var cy = center.y;
		var tdx = cx - cx*a + cy*b;
		var tdy = cy + cx*c - cy*d;

		tx += tdx * (send?-1:1);
		ty += tdy * (send?-1:1);

		return [a, b, c, d, tx, ty];
	},

	timePrefix: function() {
		var d = new Date();
		var time = d.getHours().pad(2) + ":" + d.getMinutes().pad(2) + ":" + d.getSeconds().pad(2) + "." + d.getMilliseconds().pad(4);
		return "[" + time + "]: ";
	},

	log: function(message) {
		console.log(this.timePrefix() + message);
	},

	debug: function(comm, mode) {
		var debug;
		var actor;

		var prefix = "%c" + mode.value + "(%c%s%c): %c";
		var color = "color: ";

		if (mode == this.DebugMode.RECEIVE) {
			debug = this.debugMode == this.DebugMode.RECEIVE || this.debugMode == this.DebugMode.ALL;
			actor = comm.client_id;
			color += "red";
		}
		// this.DebugMode.SEND
		else {
			debug = this.debugMode == this.DebugMode.SEND || this.debugMode == this.DebugMode.ALL;
			actor = this.clientID || this.userName;
			color += "green";
		}

		if (debug) {
			var exclude = [Command.Type.KEEP_ALIVE, Command.Type.ADD_POINTS_TO_STROKE, Command.Type.STROKES_UPDATED];

			if (!exclude.contains(comm.command_type))
				console.log(this.timePrefix() + prefix + this.getCommandTypeName(comm.command_type), color, "color: purple; font-weight: bold;", actor, color, "color: black");
			else if (comm.command_type == Command.Type.STROKES_UPDATED) {
				var action = "";

				if (comm.strokes_updated.strokes_added.length > 0) action = "ADD";
				else if (comm.strokes_updated.strokes_removed.length > 0) action = "REMOVE";
				else if (comm.strokes_updated.strokes_color_changed.length > 0) action = "COLOR";
				else if (comm.strokes_updated.strokes_split.length > 0) action = "SPLIT";
				else if (comm.strokes_updated.strokes_transformed.length > 0) action = "TRANSFORM";

				console.log(prefix + this.getCommandTypeName(comm.command_type) + " - " + action, color, "color: purple; font-weight: bold;", actor, color, "color: black");
			}
			else if (comm.command_type != Command.Type.KEEP_ALIVE)
				console.log(prefix + this.getCommandTypeName(comm.command_type), color, "color: purple; font-weight: bold;", actor, color, "color: black");
		}

		if (this.debugKeepAlive && comm.command_type == Command.Type.KEEP_ALIVE)
			console.log(this.timePrefix() + "%c" + mode.value + ": %cKEEP_ALIVE", color, "color: black");
	},

	traceStrokesData: function(strokes) {
		var result = new Array();
		if (!strokes) strokes = WILL.strokes;
		strokes.forEach(function(stroke) {result.push(stroke.uid)});
		return result;
	},
/*
	buildCanvasList: function() {
		var request = new XMLHttpRequest();
		request.onreadystatechange = function() {
			 if (this.readyState == this.DONE) {
			 	var arr = eval(this.response);
			 	canvasList = document.getElementById("CanvasID");

			 	if (!arr || arr.length == 0) {
			 		canvasList.options.item(0).innerHTML = "No active canvas found";
			 		return;
			 	}

			 	canvasList.options.remove(canvasList.options.item(0));

			 	for (var i = 0; i < arr.length; i++) {
			 		var canvas = arr[i];

			 		var option = document.createElement("option");
					option.appendChild(document.createTextNode(canvas["Name"]));
					option.value = canvas["Id"];
					canvasList.appendChild(option);
			 	}

			 	canvasList.disabled = false;
			}
		};

		request.open("GET", "/SelectCanvas.json", true);
		request.send();
	},
*/
	will: {
		init: function() {
			WILL.rtc = true;
			WILL.activeWriters = [];
			WILL.activeWritersLayer = WILL.canvas.createLayer();
			WILL.viewCacheLayer = WILL.canvas.createLayer();
			WILL.completeRefresh = function() {};

			this.override(WILL, "redraw");
			this.override(WILL, "refresh");
			this.override(WILL, "completeRefresh");
			this.override(WILL, "clear");
			this.override(WILL, "undo");
			this.override(WILL, "redo");
			this.override(WILL.Writer.prototype, "beginStroke");
			this.override(WILL.Writer.prototype, "endStroke");
			this.override(WILL.Writer.prototype, "buildPath");
			this.override(WILL.Writer.prototype, "draw");
			this.override(WILL.Writer.prototype, "erase");
			this.override(WILL.Writer.prototype, "abort");
			this.override(WILL.selection, "split", "selection");
			this.override(WILL.selection, "transformStrokes", "selection");
			this.override(WILL.selection, "copy", "selection");
			this.override(WILL.selection, "paste", "selection");
			this.override(WILL.selection, "delete", "selection");
			this.override(WILL.selection, "changeStrokesColor", "selection");
			this.override(WILL.io, "restore", "io");

			WILL.writer.strokeID = 0;
			WILL.writer.unconfirmedStrokesData = new Array();
			WILL.writer.clientID = rtc.clientID;

			WILL.Writer.prototype.completeRendering = function() {}
			WILL.Writer.prototype.keepContext = function() {
				this.unconfirmedStrokesData.push({layer: this.strokeRenderer.layer, rect: this.strokeRenderer.strokeBounds});
				this.strokeRenderer.layer = WILL.canvas.createLayer();
			}

			Object.defineProperty(Module.Stroke.prototype, "uid", {enumerable: true, get: function() {return this.id + "_" + this.owner + ((this.version == 1)?"":" (" + this.version + ")");}});
		},

		onBeginStroke: function(writer) {
			WILL.activeWriters.push(writer);

			if (writer.tool.type != WILL.Tool.Type.STROKE) return;

			writer.strokeID++;

			rtc.send(Command.Type.BEGIN_STROKE, {
				begin_stroke: rtc.createMessage("BeginStroke", {
					identifier: writer.strokeID,
					color: rtc.createMessage("RgbaColor", writer.color),
					stride: writer.tool.pathBuilder.stride,
					layer_blend_mode: writer.tool.strokeLayerBlendMode.value
				})
			});
		},

		onMoveStroke: function(writer, context) {
			if (writer.tool.type == WILL.Tool.Type.STROKE) {
				rtc.send(Command.Type.ADD_POINTS_TO_STROKE, {
					add_points_to_stroke: rtc.createMessage("AddPointsToStroke", {
						identifier: writer.strokeID,
						added_points: rtc.centerPoints((Module.readFloats(context.pathPart.points)).toArray(), true)
					})
				});
			}
		},

		onEndStroke: function(writer, context) {
			if (writer.tool.type == WILL.Tool.Type.SELECTOR) return;

			rtc.will.onMoveStroke(writer, context);

			if (writer.tool.type == WILL.Tool.Type.STROKE) {
				writer.keepContext();

				rtc.send(Command.Type.END_STROKE, {
					end_stroke: rtc.createMessage("EndStroke", {
						identifier: writer.strokeID
					})
				});

				rtc.send(Command.Type.STROKES_UPDATED, {
					strokes_updated: rtc.createMessage("StrokesUpdated", {
						save_history_state: true,
						strokes_added: [
							rtc.createMessage("StrokeAdded", {
								stroke_identifier: writer.strokeID,
								stroke_version: 1,
								color: rtc.createMessage("RgbaColor", writer.color),
								stride: writer.tool.pathBuilder.stride,
								layer_blend_mode: writer.tool.strokeLayerBlendMode.value,
								startingT: 0,
								finalT: 1,
								points: rtc.centerPoints((Module.readFloats(context.path.points)).toArray(), true)
							})
						]
					})
				});
			}
		},

		onErase: function(writer, eraseData) {
			var su = rtc.createMessage("StrokesUpdated", {
				save_history_state: false
			});

			if (writer.tool.whole)
				su.strokes_removed = eraseData;
			else
				su.strokes_split = eraseData;

			rtc.send(Command.Type.STROKES_UPDATED, {strokes_updated: su});
		},

		override: function(obj, name, target) {
			target = target?this.overrides[target]:this.overrides;

			this[name] = obj[name]
			obj[name] = target[name];
		},

		overrides: {
			redraw: function(dirtyArea) {
				this.instant = true;
				rtc.will.redraw.call(this, this.ensureVisibleArea(dirtyArea));
				delete this.instant;
			},

			refresh: function (dirtyArea, redraw) {
				if (!dirtyArea) return;

				if (this.activeWriters.length == 0 || this.instant) {
					if (redraw) {
						this.redraw(dirtyArea);
						return;
					}

					this.completeRefresh(dirtyArea);
					return;
				}

				if (this.activeArea)
					this.activeArea = Module.RectTools.union(this.activeArea, dirtyArea);
				else
					this.activeArea = dirtyArea;

				if (redraw)
					this.activeArea.redraw = true;

				if (!this.refreshTimeoutID) {
					this.refreshTimeoutID = setTimeout(function() {
						var activeArea = WILL.activeArea;
						delete WILL.activeArea;

						if (activeArea.redraw) {
							delete activeArea.redraw;
							WILL.redraw(activeArea);
						}
						else
							WILL.completeRefresh(activeArea);

						delete WILL.refreshTimeoutID;
						if (WILL.activeArea) WILL.refresh(WILL.activeArea);
					}, 16);
				}
			},

			completeRefresh: function(dirtyArea) {
				dirtyArea = this.ensureVisibleArea(dirtyArea);
				if (!dirtyArea) return;
// console.log("completeRefresh", JSON.stringify(dirtyArea), this.activeWriters.length, this.writer.context)
				var strokesLayer = this.strokesLayer;

				if (this.activeWriters.length > 0) {
					this.activeWritersLayer.blend(this.strokesLayer, {mode: Module.BlendMode.NONE, rect: dirtyArea});

					if (this.writer.context && this.writer.context.inputPhase == Module.InputPhase.Move && this.writer.tool.type != WILL.Tool.Type.ERASER)
						this.writer.strokeRenderer.drawPreliminary(this.writer.context.preliminaryPathPart);

					this.activeWriters.forEach(function(writer) {
						if (!writer.tool || writer.tool.type != WILL.Tool.Type.ERASER) {
							strokesLayer = this.activeWritersLayer;

							writer.strokeRenderer.updatedArea = dirtyArea;
							writer.strokeRenderer.blendUpdatedArea(this.activeWritersLayer);
						}
					}, this);
				}

				this.viewCacheLayer.blend(strokesLayer, {mode: Module.BlendMode.NONE, rect: dirtyArea});

				this.activeWriters.forEach(function(writer) {
					writer.unconfirmedStrokesData.forEach(function(data) {
						this.viewCacheLayer.blend(data.layer, {mode: data.blendMode, rect: dirtyArea});
					}, this);
				}, this);

				if (this.backgroundLayer)
					this.canvas.blend(this.backgroundLayer, {mode: Module.BlendMode.NONE, rect: dirtyArea});
				else
					this.canvas.clear(dirtyArea, this.backgroundColor);

				this.canvas.blend(this.viewCacheLayer, {rect: dirtyArea});

				if (this.selection.layer)
					this.canvas.blend(this.selection.layer, {transform: this.selection.mat});
			},

			clear: function() {
				rtc.send(Command.Type.CLEAR_CANVAS);
			},

			undo: function() {
				rtc.send(Command.Type.UNDO);
			},

			redo: function() {
				rtc.send(Command.Type.REDO);
			},

			beginStroke: function(e) {
				if (!this.canDraw(e, Module.InputPhase.Begin))
					return;

				rtc.will.beginStroke.call(this, e);
				rtc.will.onBeginStroke(this);
			},

			endStroke: function(e) {
				if (!this.canDraw(e, Module.InputPhase.End))
					return;

				var context = this.context;

				rtc.will.endStroke.call(this, e);
				rtc.will.onEndStroke(this, context);
			},

			buildPath: function() {
				if (WILL.writer == this)
					rtc.will.buildPath.call(this);
			},

			draw: function() {
				rtc.will.draw.call(this);

				if (WILL.writer == this)
					rtc.will.onMoveStroke(this, this.context);
			},

			erase: function() {
				var result = new Array();

				this.intersector.setTargetAsStroke(this.context.pathPart, NaN);

				WILL.strokes.forEach(function(stroke) {
					if (this.tool.whole) {
						if (this.intersector.isIntersectingTarget(stroke)) {
							result.push(rtc.createMessage("StrokeRemoved", {
								stroke_client_id: stroke.owner,
								stroke_identifier: stroke.id,
								stroke_version: stroke.version
							}));
						}
					}
					// splitter
					else {
						var intervals = this.intersector.intersectWithTarget(stroke);
						var split = stroke.split(intervals, this.intersector.targetType);

						if (split.intersect) {
							var slices = new Array();

							split.strokes.forEach(function(subStroke) {
								WILL.writer.strokeID++;

								slices.push(
									rtc.createMessage("StrokeSlice", {
										stroke_identifier: WILL.writer.strokeID,
										stroke_version: 1,
										startingIndex: subStroke.fromIndex,
										finalIndex: subStroke.toIndex,
										startingT: subStroke.ts,
										finalT: subStroke.tf
									})
								);
							}, this);

							split.holes.forEach(function(interval) {
								slices.push(
									rtc.createMessage("StrokeSlice", {
										startingIndex: interval.fromIndex,
										finalIndex: interval.toIndex,
										startingT: interval.fromTValue,
										finalT: interval.toTValue
									})
								);
							}, this);

							result.push(rtc.createMessage("StrokeSplit", {
								stroke_client_id: stroke.owner,
								stroke_identifier: stroke.id,
								stroke_version: stroke.version,
								slices: slices
							}));
						}
					}
				}, this);

				if (result.length > 0)
					rtc.will.onErase(this, result);
			},

			abort: function() {
				WILL.activeWriters.remove(this);

				if (WILL.writer == this) {
					rtc.send(Command.Type.ABORT_STROKE, {
						end_stroke: rtc.createMessage("AbortStroke", {
							identifier: this.strokeID
						})
					});
				}

				rtc.will.abort.call(this);
			},

			selection: {
				split: function() {
					var strokeSplit = new Array();

					this.splits.forEach(function(split) {
						var slices = new Array();
						var stroke = split.stroke;
						var subStrokes = split.strokes;

						subStrokes.forEach(function(subStroke) {
							WILL.writer.strokeID++;

							subStroke.id = WILL.writer.strokeID;
							subStroke.version = 1;
							subStroke.owner = rtc.clientID;

							slices.push(
								rtc.createMessage("StrokeSlice", {
									stroke_identifier: subStroke.id,
									stroke_version: subStroke.version,
									startingIndex: subStroke.fromIndex,
									startingT: subStroke.ts,
									finalIndex: subStroke.toIndex,
									finalT: subStroke.tf
								})
							);
						});

						strokeSplit.push(rtc.createMessage("StrokeSplit", {
							stroke_client_id: stroke.owner,
							stroke_identifier: stroke.id,
							stroke_version: stroke.version,
							slices: slices
						}));
					}, this);

					this.splits = new Array();

					if (strokeSplit.length > 0) {
						rtc.send(Command.Type.STROKES_UPDATED, {
							strokes_updated: rtc.createMessage("StrokesUpdated", {
								save_history_state: false,
								strokes_split: strokeSplit
							})
						});
					}
				},

				transformStrokes: function(mat, discardRedraw) {
					var history = false;

					if (!this.transformed) {
						history = true;
						this.transformed = true;

						this.split();
					}

					var su = rtc.createMessage("StrokesUpdated", {
						save_history_state: history
					});

					this.strokes.forEach(function(stroke) {
						su.strokes_transformed.push(
							rtc.createMessage("StrokeTransformed", {
								stroke_client_id: stroke.owner,
								stroke_identifier: stroke.id,
								stroke_version: stroke.version++,
								transform: rtc.centerMatrix(mat, true)
							})
						);
					}, this);

					rtc.send(Command.Type.STROKES_UPDATED, {strokes_updated: su});
				},

				copy: function(cut) {
					var dirtyArea;
					rtc.will.copy.call(this, cut);

					menu.clipboard.layer.clear();

					this.clipboard.strokes.forEach(function(stroke) {
						menu.clipboard.layer.draw(stroke);
						dirtyArea = Module.RectTools.union(dirtyArea, stroke.bounds);
					});

					menu.clipboard.add(this.clipboard, WILL.getImageCanvas(menu.clipboard.layer, dirtyArea));
				},

				paste: function(e) {
					if (!this.clipboard) return;

					var su = rtc.createMessage("StrokesUpdated", {
						save_history_state: false
					});

					this.strokes = Object.clone(this.clipboard.strokes);

					this.rect = Object.clone(this.clipboard.transformedRect);
					this.path = Object.clone(this.clipboard.path);

					var pos = tools.getMousePos(e);
					var offsetX = pos.x - this.rect.left;
					var offsetY = pos.y - this.rect.top;
					var mat = this.makeTranslate(offsetX, offsetY);

					this.rect.left += offsetX;
					this.rect.right += offsetX;
					this.rect.top += offsetY;
					this.rect.bottom += offsetY;

					this.strokes.forEach(function(stroke) {
						WILL.writer.strokeID++;

						stroke.id = WILL.writer.strokeID;
						stroke.version = 1;
						stroke.owner = rtc.clientID;

						stroke.transform(mat);

						su.strokes_added.push(
							rtc.createMessage("StrokeAdded", {
								stroke_identifier: stroke.id,
								stroke_version: stroke.version,
								color: stroke.color,
								stride: stroke.path.stride,
								layer_blend_mode: WILL.writer.tool.strokeLayerBlendMode.value,
								startingT: stroke.ts,
								finalT: stroke.tf,
								points: rtc.centerPoints(stroke.path.points.toArray(), true)
							})
						);
					}, this);

					rtc.send(Command.Type.STROKES_UPDATED, {strokes_updated: su});

					this.show(true);
					this.selection.style.transform = this.selection.style.webkitTransform = this.clipboard.transform;

					if (this.clipboard.viewBox)
						this.selection.querySelector("svg").setAttribute("viewBox", this.clipboard.viewBox);
				},

				delete: function() {
					if (!this.strokes[0].id)
						this.split();

					var su = rtc.createMessage("StrokesUpdated", {
						save_history_state: true
					});

					this.strokes.forEach(function(stroke) {
						su.strokes_removed.push(rtc.createMessage("StrokeRemoved", {
								stroke_client_id: stroke.owner,
								stroke_identifier: stroke.id,
								stroke_version: stroke.version
							})
						);
					});

					rtc.send(Command.Type.STROKES_UPDATED, {strokes_updated: su});

					this.hide();
				},

				changeStrokesColor: function(color) {
					var su = rtc.createMessage("StrokesUpdated", {
						save_history_state: true
					});

					this.split();

					this.strokes.forEach(function(stroke) {
						su.strokes_color_changed.push(
							rtc.createMessage("StrokeColorChanged", {
								stroke_client_id: stroke.owner,
								stroke_identifier: stroke.id,
								stroke_version: stroke.version,
								color: rtc.createMessage("RgbaColor", color)
							})
						);
					});

					rtc.send(Command.Type.STROKES_UPDATED, {strokes_updated: su});

					this.hide();
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

					clipboard.transformedRect = clipboard.rect;

					menu.clipboard.add(clipboard, WILL.getImageCanvas(menu.clipboard.layer, clipboard.rect));
				}
			}
		}
	}
};

Function.prototype.createEnum.call(rtc, "DebugMode", ["NONE", "ALL", "SEND", "RECEIVE"]);