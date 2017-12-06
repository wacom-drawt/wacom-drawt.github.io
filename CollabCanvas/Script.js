
var WILL = {
    backgroundColor: Module.Color.WHITE,
    color: Module.Color.from(0, 0, 0),
    activeWriters: new Array(),
    strokes: new Array(),

    init: function(width, height) {
        this.initInkEngine(width, height);
        this.initEvents();
    },

    initInkEngine: function(width, height) {
        this.canvas = new Module.InkCanvas(document.getElementById("canvas"), width, height);
        this.canvas.clear(this.backgroundColor);
        this.strokesLayer = this.canvas.createLayer();
        
        this.brush = new Module.DirectBrush();

        this.speedPathBuilder = new Module.SpeedPathBuilder();
        this.speedPathBuilder.setNormalizationConfig(182, 3547);
        this.speedPathBuilder.setPropertyConfig(Module.PropertyName.Width, 2.05, 34.53, 0.72, NaN, Module.PropertyFunction.Power, 1.19, false);

        if (window.PointerEvent) {
            this.pressurePathBuilder = new Module.PressurePathBuilder();
            this.pressurePathBuilder.setNormalizationConfig(0.195, 0.88);
            this.pressurePathBuilder.setPropertyConfig(Module.PropertyName.Width, 2.05, 34.53, 0.72, NaN, Module.PropertyFunction.Power, 1.19, false);
        }

        this.strokeRenderer = new Module.StrokeRenderer(this.canvas, this.canvas);
        this.strokeRenderer.configure({brush: this.brush, color: this.color});

        client.init();

        this.writer = new Writer(client.id);
        client.writers[client.id] = this.writer;
    },

    initEvents: function() {
        var self = this;

        if (window.PointerEvent) {
            Module.canvas.addEventListener("pointerdown", function(e) {self.beginStroke(e);});
            Module.canvas.addEventListener("pointermove", function(e) {self.moveStroke(e);});
            document.addEventListener("pointerup", function(e) {self.endStroke(e);});
        }
        else {
            Module.canvas.addEventListener("mousedown", function(e) {self.beginStroke(e);});
            Module.canvas.addEventListener("mousemove", function(e) {self.moveStroke(e);});
            document.addEventListener("mouseup", function(e) {self.endStroke(e);});

            if (window.TouchEvent) {
                Module.canvas.addEventListener("touchstart", function(e) {self.beginStroke(e);});
                Module.canvas.addEventListener("touchmove", function(e) {self.moveStroke(e);});
                document.addEventListener("touchend", function(e) {self.endStroke(e);});
            }
        }
    },

    getPressure: function(e) {
        return (window.PointerEvent && e instanceof PointerEvent && e.pressure !== 0.5)?e.pressure:NaN;
    },

    beginStroke: function(e) {
        if (["mousedown", "mouseup"].contains(e.type) && e.button != 0) return;
        if (e.changedTouches) e = e.changedTouches[0];

        this.inputPhase = Module.InputPhase.Begin;
        this.pressure = this.getPressure(e);
        this.pathBuilder = isNaN(this.pressure)?this.speedPathBuilder:this.pressurePathBuilder;

        this.buildPath({x: e.clientX, y: e.clientY});
        this.drawPath();

        client.encoder.encodeComposeStyle(this.writer.strokeRenderer);
        client.send();
    },

    moveStroke: function(e) {
        if (!this.inputPhase) return;
        if (e.changedTouches) e = e.changedTouches[0];

        this.inputPhase = Module.InputPhase.Move;
        this.pointerPos = {x: e.clientX, y: e.clientY};
        this.pressure = this.getPressure(e);

        if (WILL.frameID != WILL.canvas.frameID) {
            var self = this;

            WILL.frameID = WILL.canvas.requestAnimationFrame(function() {
                if (self.inputPhase && self.inputPhase == Module.InputPhase.Move) {
                    self.buildPath(self.pointerPos);
                    self.drawPath();
                }
            }, true);
        }
    },

    endStroke: function(e) {
        if (!this.inputPhase) return;
        if (e.changedTouches) e = e.changedTouches[0];

        this.inputPhase = Module.InputPhase.End;
        this.pressure = this.getPressure(e);

        this.buildPath({x: e.clientX, y: e.clientY});
        this.drawPath();

        client.encoder.encodeAdd([{
            brush: this.brush,
            path: this.path,
            width: this.writer.strokeRenderer.width,
            color: this.writer.strokeRenderer.color,
            ts: 0, tf: 1, randomSeed: 0,
            blendMode: this.writer.strokeRenderer.blendMode
        }]);
        client.send();

        var stroke = new Module.Stroke(this.brush, this.path, NaN, this.color, 0, 1);
		this.strokes.push(stroke);

        delete this.inputPhase;
    },

    buildPath: function(pos) {
        var pathBuilderValue = isNaN(this.pressure)?Date.now() / 1000:this.pressure;

        var pathPart = this.pathBuilder.addPoint(this.inputPhase, pos, pathBuilderValue);
        var pathContext = this.pathBuilder.addPathPart(pathPart);

        this.pathPart = pathContext.getPathPart();
        this.path = pathContext.getPath();
    },

    drawPath: function() {
        this.strokeRenderer.draw(this.pathPart, this.inputPhase == Module.InputPhase.End);
    },

    clear: function() {
        this.canvas.clear(this.backgroundColor);
    },

    changeColor: function() {
    	if (this.color == Module.Color.WHITE) {
    		this.color = Module.Color.BLACK;
    	}
    	else {
    		this.color = Module.Color.WHITE;
    	}
    	this.strokeRenderer.configure({brush: this.brush, color: this.color});
    },
        refresh: function (dirtyArea, redraw) {
        if (this.activeWriters.length == 0) {
            if (redraw)
                this.redraw(dirtyArea);
            else
                this.refreshCanvas(dirtyArea);

            return;
        }

        if (this.activeArea)
            this.activeArea = Module.RectTools.union(this.activeArea, dirtyArea);
        else
            this.activeArea = dirtyArea || this.viewArea;

        if (redraw)
            this.activeArea.redraw = true;

        if (!this.refreshTimeoutID) {
            this.refreshTimeoutID = setTimeout(function() {
                var activeArea = WILL.activeArea;
                delete WILL.activeArea;

                if (activeArea.redraw)
                    WILL.redraw(activeArea);
                else
                    WILL.refreshCanvas(activeArea);

                delete WILL.refreshTimeoutID;
                if (WILL.activeArea) WILL.refresh(WILL.activeArea);
            }, 16);
        }
    },

    refreshCanvas: function(dirtyArea) {
        if (!dirtyArea) dirtyArea = this.canvas.bounds;
        dirtyArea = Module.RectTools.ceil(dirtyArea);

        if (this.activeWriters.length > 0) {
            if (this.writer.inputPhase && this.writer.inputPhase == Module.InputPhase.Move)
                this.writer.strokeRenderer.drawPreliminary(this.preliminaryPathPart);

            this.canvas.clear(dirtyArea, this.backgroundColor);
            this.canvas.blend(this.strokesLayer, {rect: dirtyArea});

            this.activeWriters.forEach(function(writer) {
                writer.strokeRenderer.updatedArea = dirtyArea;
                writer.strokeRenderer.blendUpdatedArea();

                writer.unconfirmedStrokesData.forEach(function(data) {
                    if (data.layer.isDeleted()) console.log("deleted layer")
                    this.canvas.blend(data.layer, {mode: data.blendMode, rect: dirtyArea});
                }, this);
            }, this);
        }
        else {
            this.canvas.clear(dirtyArea, this.backgroundColor);
            this.canvas.blend(this.strokesLayer, {rect: dirtyArea});
        }
    },

    clear: function() {
        parent.server.clear();
    },

    clearCanvas: function() {
        this.strokes = new Array();

        this.strokesLayer.clear(this.backgroundColor);
        this.canvas.clear(this.backgroundColor);
    }
};

function Writer(id) {
    this.id = id;

    this.strokeRenderer = new Module.StrokeRenderer(WILL.canvas);
    this.strokeRenderer.configure({brush: WILL.brush, color: ((id == 0)?Module.Color.BLUE:Module.Color.GREEN)});
}

Writer.prototype.refresh = function() {
    if (this.id == client.id && this.inputPhase == Module.InputPhase.Move)
        this.strokeRenderer.drawPreliminary(WILL.preliminaryPathPart);

    WILL.canvas.clear(this.strokeRenderer.updatedArea, WILL.backgroundColor);
    WILL.canvas.blend(WILL.strokesLayer, {rect: this.strokeRenderer.updatedArea});

    this.strokeRenderer.blendUpdatedArea();
}

Writer.prototype.compose = function(path, endStroke) {
    if (path.points.length == 0)
        return;

    this.strokeRenderer.draw(path, endStroke, this.id != client.id);

    if (this.id == client.id) {
        if (this.strokeRenderer.updatedArea)
            this.refresh();

        if (endStroke)
            delete this.inputPhase;

        client.encoder.encodeComposePathPart(path, this.strokeRenderer.color, true, false, endStroke);
        client.send();
    }
}

Writer.prototype.abort = function() {
    var dirtyArea = Module.RectTools.union(this.strokeRenderer.strokeBounds, this.strokeRenderer.preliminaryDirtyArea);

    this.strokeRenderer.abort();
    delete this.inputPhase;

    WILL.refresh(dirtyArea);

    if (this.id == client.id) {
        client.encoder.encodeComposeAbort();
        client.send();
    }
}


var client = {
    name: window.name,
    writers: [],

    init: function() {
        this.encoder = new Module.PathOperationEncoder();
        this.decoder = new Module.PathOperationDecoder(Module.PathOperationDecoder.getPathOperationDecoderCallbacksHandler(this.callbacksHandlerImplementation));
        
        this.pubnub = new PubNub({
                subscribeKey: "sub-c-5d558e80-d9bc-11e7-8016-4af0e5b01aa9",
                publishKey: "pub-c-6ba52908-5766-4a32-b284-c504da485bfd",
            });

        this.recieve = function(sender, data) {
        var writer = this.writers[sender];

        if (!writer) {
            writer = new Writer(sender);
            this.writers[sender] = writer;
        }

        Module.writeBytes(data, function(int64Ptr) {
            this.decoder.decode(writer, int64Ptr);
        }, this);
        }
        var that = this;
        this.pubnub.addListener({   
            message: function(m){
                // handle message
                var actualChannel = m.actualChannel;
                var channelName = m.channel; // The channel for which the message belongs
                var msg = m.message; // The Payload
                var publisher = m.publisher;
                var subscribedChannel = m.subscribedChannel;
                var channelGroup = m.subscription; // The channel group or wildcard subscription match (if exists)
                var pubTT = m.timetoken; // Publish timetoken
                
                msg.arr.length = msg.length;
                var a = new Int8Array(msg.arr)
                that.receive(publisher, a);        
            }
        
        });

        this.pubnub.subscribe({channels:['main'],})

    }, 
        receive: function(sender, data) {
        var writer = this.writers[sender];

        if (!writer) {
            writer = new Writer(sender);
            this.writers[sender] = writer;
        }
        console.log("rec")
        Module.writeBytes(data, function(int64Ptr) {
            this.decoder.decode(writer, int64Ptr);
        }, this);
    },
    send: function(compose) {
        var payload = Module.readBytes(this.encoder.getBytes())
        console.log(payload.__proto__)
        this.pubnub.publish(
        {
            message: {
                arr: payload,
                length: payload.length
            },
            channel: 'main',
            sendByPost: false, // true to send via post
            storeInHistory: false, //override default storage options
            meta: {
                "cool": "meta"
            } // publish extra meta with the request
        },
        function (status, response) {
            // handle status, response
        });
        this.encoder.reset();
    },

    callbacksHandlerImplementation: {
        onComposeStyle: function(writer, style) {
            if (writer.id == client.id) return;
            writer.strokeRenderer.configure(style);
        },

        onComposePathPart: function(writer, path, endStroke) {
            if (writer.id == client.id) return;

            writer.compose(path, endStroke);
            writer.refresh();
        },

        onComposeAbort: function(writer) {
            if (writer.id == client.id) return;
            writer.abort();
        },

        onAdd: function(writer, strokes) {
            strokes.forEach(function(stroke) {
                WILL.strokes.push(stroke);
                writer.strokeRenderer.blendStroke(WILL.strokesLayer, stroke.blendMode);
            }, this);

            WILL.refresh();
        },

        onRemove: function(writer, group) {},

        onUpdateColor: function(writer, group, color) {},

        onUpdateBlendMode: function(writer, group, blendMode) {},

        onSplit: function(writer, splits) {},

        onTransform: function(writer, group, mat) {}
    }
};

var env = {
    width: 1600,
    height: 1000
};

Module.addPostScript(function() {
    Module.InkDecoder.getStrokeBrush = function(paint, writer) {
        return WILL.brush;
    }

    WILL.init(1600, 1000);
    WILL.color = Module.Color.WHITE;
});


function changeDrawColor() {
	WILL.changeColor();
}

function saveDrawingToPng() {
	var canvas = document.getElementById("canvas");
	// var img    = canvas.toDataURL("image/png");
	var dataURL    = canvas.toDataURL();
	$.ajax({
	type: "POST",
	url: "https://drawtwacom.herokuapp.com/submit",
	data: { 
	 imgBase64: dataURL,
	 nodeId: "IDString"
	}
	}).done(function(o) {
	console.log('saved'); 
	// If you want the file to be visible in the browser 
	// - please modify the callback in javascript. All you
	// need is to return the url to the file, you just saved 
	// and than put the image in your browser.
	});

}

