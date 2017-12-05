if (!("scrollX" in window)) Object.defineProperty(window, "scrollX", {get: function() {return (window.pageXOffset !== undefined)?window.pageXOffset:(document.documentElement || document.body.parentNode || document.body).scrollLeft;}});
if (!("scrollY" in window)) Object.defineProperty(window, "scrollY", {get: function() {return (window.pageYOffset !== undefined)?window.pageYOffset:(document.documentElement || document.body.parentNode || document.body).scrollTop;}});

var tools = {
	android: /(android)/i.test(navigator.userAgent),
	iOS: /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream,

	findFieldName: function(o, field) {
		for (name in o) {
			if (o[name] === field)
				return name;
		}

		return null;
	},

	getURLParam: function(name) {
		if (!this.query) {
			this.query = new Object();

			if (location.search != "") {
				var pairs = location.search.substring(1).split("&");

				for (var i = 0; i < pairs.length; i++)
					this.query[pairs[i].split("=")[0]] = decodeURIComponent(pairs[i].split("=")[1]);
			}
		}

		return this.query[name];
	},

	// https://github.com/dcneiner/Downloadify
	// https://github.com/eligrey/FileSaver.js/
	saveAs: function(content, filename, contentType) {
		var href;

		if (content instanceof Blob)
			href = URL.createObjectURL(content);
		else {
			var parts;

			if (content instanceof ArrayBuffer)
				parts = [content];
			else if (ArrayBuffer.isTypedArray(content))
				parts = [content.buffer];
			else if (content instanceof Array)
				parts = content;

			var blob = new Blob(parts, {"type": contentType || "application/octet-stream"});
			href = URL.createObjectURL(blob);
		}

		var a = document.createElement("a");
		a.href = href;
		a.download = filename;

		a.appendChild(document.createTextNode(filename));
		a.style.display = "none";

		document.body.appendChild(a);
		a.click();

		setTimeout(function() {
			URL.revokeObjectURL(href);
		}, 911);
	},

	getFlags: function(mask) {
		var result = [];
		var bits = mask.toString(2).split("").reverse();

		for (var i = 0; i < bits.length; i++) {
			if (bits[i] == 1)
				result.push(Math.pow(2, i));
		}

		return result;
	},

	extractColor: function(node, opacity) {
		var rgba = [];

		if (node.tagName == "INPUT") {
			var value = node.value.substring(1);

			rgba.push(parseInt(value.substring(0, 2), 16));
			rgba.push(parseInt(value.substring(2, 4), 16));
			rgba.push(parseInt(value.substring(4), 16));
			rgba.push(opacity || 1);
		}
		else {
			rgba = eval(node.getStyle("background-color").replace(/rgba?/, "new Array"));
			if (!rgba[3]) rgba[3] = node.getMathStyle("opacity");
		}

		return Module.Color.from(rgba);
	},

	// TODO: deprecate, use e.offset instead
	getMousePos: function(e, element) {
		if (e.changedTouches) e = e.changedTouches[0];
		if (!element) element = Module.canvas;
		var offset = element.getBoundingClientRect();

		return {
			clientX: e.clientX,
			clientY: e.clientY,
			// layerX: e.layerX,
			// layerY: e.layerY,
			x: e.clientX - offset.left,
			y: e.clientY - offset.top
			// x: (e.clientX - offset.left + window.scrollX) * ((window.devicePixelRatio > 1)?1 / window.devicePixelRatio:window.devicePixelRatio),
			// y: (e.clientY - offset.top + window.scrollY) * ((window.devicePixelRatio > 1)?1 / window.devicePixelRatio:window.devicePixelRatio)
		};
	},

	generateUUID: function() {
		var d = Date.now()
		var uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
			var r = (d + Math.random() * 16) % 16 | 0;
			d = Math.floor(d / 16);
			return (c == "x" ? r : (r & 0x3 | 0x8)).toString(16);
		});

		return uuid;
	},

	crc32: (function() {
		var table = new Uint32Array(256);

		// Pre-generate crc32 polynomial lookup table
		// http://wiki.osdev.org/CRC32#Building_the_Lookup_Table
		for (var i = 256; i--;) {
			var tmp = i;

			for (var k = 8; k--;)
				tmp = tmp & 1 ? 3988292384 ^ tmp >>> 1 : tmp >>> 1;

			table[i] = tmp;
		}

		// Example input        : [97, 98, 99, 100, 101] (Uint8Array)
		// Example output       : 2240272485 (Uint32)
		return function(data) {
			// Begin with all bits set (0XFFFFFFFF)
			var crc = -1;

			for (var i = 0, l = data.length; i < l; i++)
				crc = crc >>> 8 ^ table[crc & 255 ^ data[i]];

			// Apply binary NOT
			return (crc ^ -1) >>> 0;
		};
	})(),

	disbaleZoom: function() {
		var keyCodes = [61, 107, 173, 109, 187, 189];

		window.addEventListener("keydown", function(e) {
			if ((e.ctrlKey || e.metaKey) && (keyCodes.indexOf(e.which) != -1))
				e.preventDefault();
		});

		window.addEventListener("DOMMouseScroll", function(e) {
			if (e.ctrlKey || e.metaKey) e.preventDefault();
		});

		window.addEventListener("mousewheel", function(e) {
			if (e.ctrlKey || e.metaKey) e.preventDefault();
		});
	},

	disableIOSEffects: function() {
		if (this.iOS) {
			// disable vertical scrolling bounce (elastic scrolling)
			var xStart, yStart = 0;

			document.addEventListener("touchstart", function(e) {
				xStart = e.touches[0].screenX;
				yStart = e.touches[0].screenY;
			});

			document.addEventListener("touchmove", function(e) {
				var xMovement = Math.abs(e.touches[0].screenX - xStart);
				var yMovement = Math.abs(e.touches[0].screenY - yStart);
				if ((yMovement * 3) > xMovement) e.preventDefault();
			});

			// disable viewport double tap
			var doubleTouchStartTimestamp = 0;
			document.addEventListener("touchstart", function (e) {
				var now = Date.now();
				if (doubleTouchStartTimestamp + 500 > now) e.preventDefault();
				doubleTouchStartTimestamp = now;
			});

			// disable viewport zooming
			window.addEventListener("gesturestart", function (e) {
				e.preventDefault();
			});
		}
	},

	debug: function(ui8a) {
		var binary = "";

		for (var i = 0; i < ui8a.length; i++) {
			// if (i % 100 == 0 && i > 0 && !binary.endsWith("\n")) binary += "\n";
			if (ui8a[i] == 0) continue;
			binary += ui8a[i];
		}

		console.log("length: " + ui8a.length + " :: " + (ui8a.length / 1024 / 1024))
		console.log(binary)
	}
};

tools.disbaleZoom();
tools.disableIOSEffects();

// document.ontouchmove = function(e) {
// 	e.preventDefault(); // warning in Chrome
// }

function Timer() {
	this.reset();
}

Timer.prototype.reset = function() {
	this.time = 0;
	// this.intervals = new Array();
}

Timer.prototype.start = function() {
	this.begin = Date.now();
}

Timer.prototype.stop = function() {
	if (!this.begin) return;

	var interval = Date.now() - this.begin;
	this.time += interval;

	delete this.begin;
}

var movesCounter = {
	init: function(custom) {
		if (this.ready) return;
		this.ready = true;

		document.addEventListener("mousedown", function(e) {movesCounter.start(e);});
		if (!custom) document.addEventListener("mousemove", function(e) {movesCounter.increment(e);});
		document.addEventListener("mouseup", function(e) {movesCounter.stop(e);});
		document.addEventListener("mouseout", function(e) {movesCounter.stop(e);});

		document.addEventListener("touchstart", function(e) {movesCounter.start(e);});
		if (!custom) document.addEventListener("touchmove", function(e) {movesCounter.increment(e);});
		document.addEventListener("touchend", function(e) {movesCounter.stop(e);});
		document.addEventListener("touchleave", function(e) {movesCounter.stop(e);});
	},

	start: function() {
		this.started = true;
		this.cycles = 0;
		this.count = 0;

		this.move();
	},

	move: function() {
		var self = this;

		requestAnimationFrame(function(timestamp) {
			self.cycles++;

			if (self.cycles == 60)
				self.log();

			if (self.started)
				self.move();
		});
	},

	stop: function() {
		if (!this.started) return;

		this.started = false;
		this.log();
	},

	increment: function() {
		if (!this.started) return;

		this.count++;
	},

	log: function() {
		console.log(Math.floor(this.cycles * 16.67) + ": " + this.count);

		this.cycles = 0;
		this.count = 0;
	}
};

var uuid = {
	mask: "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx",

	generate: function() {
		var d = Date.now()
		var result = this.mask.replace(/[xy]/g, function(c) {
			var r = (d + Math.random() * 16) % 16 | 0;
			d = Math.floor(d / 16);
			return (c == "x" ? r : (r & 0x3 | 0x8)).toString(16);
		});

		return result;
	},

	toUint32: function(uuid) {
		uuid = uuid.replace(/-/g, "");

		var uInt32 = new Uint32Array(4);
		uInt32[0] = parseInt(uuid.substring(0, 8), 16);
		uInt32[1] = parseInt(uuid.substring(8, 16), 16);
		uInt32[2] = parseInt(uuid.substring(16, 24), 16);
		uInt32[3] = parseInt(uuid.substring(24), 16);

		return uInt32;
	},

	fromUint32: function(uInt32) {
		var result = "";
		var uuid = uInt32[0].toString(16) + uInt32[1].toString(16) + uInt32[2].toString(16) + uInt32[3].toString(16);

		this.mask.split("-").forEach(function(part) {
			result += uuid.substring(0, part.length);
			result += "-";
			uuid = uuid.substring(part.length);
		});

		return result.substring(0, result.length-1);
	}
};

var dropDown = {
	init: function() {
		$(".DropDown .Paper").on("mousedown", function() {dropDown.selectPaper(this);});
		$(".DropDown .Color").on("mousedown", function() {dropDown.selectColor(this);});

		$(document).on("mousedown", function(e) {
			var parents = $(e.target).parents().toArray();

			if ($("nav .Paper")[0] != e.target && parents.indexOf($(".DropDown .Papers")[0]) == -1) dropDown.hide("Papers");
			if ($("nav .Color")[0] != e.target && parents.indexOf($(".DropDown .Colors")[0]) == -1) dropDown.hide("Colors");
		});

		$(window).on("resize", function(e) {
			$(".DropDown").css("visibility", "hidden");
		});
	},

	show: function(name) {
		var button = $("nav ." + name.substring(0, name.length-1))[0];
		$(".DropDown." + name).css("left", (button.offsetLeft - 7 - $(".DropDown." + name).width()/2 + button.offsetWidth/2) + "px").css("visibility", "visible");
	},

	hide: function(name) {
		$(".DropDown." + name).css("visibility", "hidden");
	},

	toggle: function(name) {
		if ($(".DropDown." + name).css("visibility") == "hidden")
			this.show(name);
		else
			this.hide(name);
	},

	click: function(item) {
		$(item.parentNode).children().removeClass("Selected");
		$(item).addClass("Selected");
	},

	selectPaper: function(item) {
		this.click(item);
		$("nav .Paper")[0].src = item.src;
		WILL.setBackground(item.src.split("btn_")[1].split(".")[0]);
		this.hide("Papers");
	},

	selectColor: function(item) {
		var color = tools.extractColor(item);
		this.click(item);
		$("nav .Color").css("background-color", item.style.backgroundColor);
		$("nav .Color").css("opacity", item.style.backgroundColor.startsWith("rgba")?"":color.alpha);

		if (WILL.selection.visible())
			WILL.selection.changeStrokesColor(color);
		else {
			WILL.setColor(color);
			$("nav .Tool#" + WILL.writer.tool.id).trigger("click");
		}

		this.hide("Colors");
	}
};

var layout = {
	init: function() {
		this.navType = ($("nav")[0])?"DEMO":"RTC";
		this.initHeight();
		this.initDemoNavigation();
	},

	initHeight: function() {
		$(".Wrapper").css("height", $(window).height());
		$(".OnlineStatus").css("line-height", $(window).height() + "px");
		if (this.navType == "RTC") $(".nav").css("line-height", $(window).height() + "px");

		$(window).on("resize", function() {
			$(".Wrapper").css("height", $(window).height());
			$(".OnlineStatus").css("line-height", $(window).height() + "px");
			if (layout.navType == "RTC") $(".nav").css("line-height", $(window).height() + "px");
		});
	},

	initDemoNavigation: function() {
		dropDown.init();

		function over(img) {
			if (!img.classList.contains("Selected")) img.src = img.src.replace(".png", "_selected.png");
		}

		function out(img) {
			if (!img.classList.contains("Selected")) img.src = img.src.replace("_selected.png", ".png");
		}

		$("nav img")
			.on("mouseover", function() {over(this);})
			.on("mouseout", function() {out(this);});

		$("nav .ButtonFile")
			.on("mouseover", function() {over($(this).find("img")[0]);})
			.on("mouseout", function() {out($(this).find("img")[0]);});

		$("nav .Tool").on("click", function() {
			if (this.classList.contains("Selected")) return;

			WILL.setTool(this.id);

			$("nav .Tool.Selected").each(function() {
				$(this).removeClass("Selected");
				this.src = this.src.replace("_selected.png", ".png");
			});

			this.src = this.src.replace("_selected.png", ".png").replace(".png", "_selected.png");
			$(this).addClass("Selected");
		});
	},

	multicolors: function() {
		$("body").addClass("multicolors");
		document.querySelector("input[type=color]").value = Module.Color.toHex(WILL.writer.color);

		if (layout.navType == "DEMO")
			document.querySelector("nav .ColorBox").onclick = null;
	},

	selectColor: function(input) {
		$(".ColorBox .Color").css("background-color", input.value);
		WILL.writer.setColor(input);
	}
};

function initEngine() {
	var type = (location.pathname.containsIgnoreCase("ProductivityDemo") || location.pathname.containsIgnoreCase("RTC"))?WILL.Type.VECTOR:WILL.Type.RASTER;
	WILL.mode = top.location.pathname.containsIgnoreCase("RTC")?WILL.Mode["2D"]:WILL.Mode["GL"];

	WILL.init(type, $(".Wrapper").width(), $(".Wrapper")[0].offsetHeight - ($("nav").height() || 0));

	if (layout.navType == "DEMO") {
		if (WILL.mode == WILL.Mode["2D"])
			WILL.setBackground(Module.Color.TRANSPERENT);
		else
			WILL.setBackground($(".Papers .Paper.Selected").first()[0].id);
		// WILL.setBackground(Module.Color.from(0, 151, 212));

		if (tools.getURLParam("collaboration")) {
			if (type == WILL.Type.VECTOR)
				$($("nav .Tool")[2]).click();
			else
				WILL.setTool($("nav ." + WILL.type.name + " .Tool").first()[0].id);

			dropDown.selectColor($(".DropDown .Color")[client.id]);
		}
		else {
			WILL.setTool($("nav ." + WILL.type.name + " .Tool").first()[0].id);
			WILL.setColor(tools.extractColor($("nav .Color")[0]));

			// if (location.pathname.containsIgnoreCase("ToolConfigurator"))
			// 	WILL.setColor(Module.Color.from(74, 74, 74, 0.25));
		}
	}
	else {
		WILL.setBackground(WILL.backgroundColor);
		WILL.setTool("Pen");
		WILL.setColor(Module.Color.from(0, 151, 212));
	}

	$(window).on("resize", function() {
		WILL.resize($(".Wrapper").width(), $(".Wrapper").height() - ($("nav").height() || 0));
	});
}

$(document).ready(function() {
	layout.init();
});

Module.addPostScript(function() {
	Module.InkDecoder.getStrokeBrush = function(paint, writer) {
		var self = WILL.io;
		var brush;

		if (writer)
			brush = WILL.tools.findBrush(paint);
		else
			brush = (paint != null)?self.brushes[paint]:WILL.tools.brush;
/*
		if (ink.blendMode != Module.BlendMode.NORMAL) {
			if (!self.blendBrushes) self.blendBrushes = new Object();
			brush = self.blendBrushes[ink.blendMode.name];

			if (!brush) {
				brush = new Module.DirectBrush();
				brush.blendMode = ink.blendMode;

				self.blendBrushes[ink.blendMode.name] = brush;
			}
		}
*/
		return brush;
	}

	$(document).ready(function() {
		initEngine();

		$("body").addClass(WILL.type.name);

		if (location.pathname.containsIgnoreCase("ToolConfigurator")) {
			$("body").addClass("CONFIGURATOR");
			document.getElementById("Eraser").src = "Images/btn_toolconfig_eraser.png";
			toolConfigurator.init();
		}

		if (location.pathname.containsIgnoreCase("RTC")) {
			// var rtc = window.rtc || window.client;

			// rtc.url = "$RTC_URL$";
			setTimeout(function() {
				var COLLABORATORS_MAX = 128;

				var server = tools.getURLParam("server");
				if (server) client.URL = client[server.toUpperCase()];

				// barni - 115392
				// bsenglish - 190638
				// if (tools.getURLParam("Location")) client.url = client[tools.getURLParam("Location")];
				client.init(parseInt(tools.getURLParam("UserID") || 115392, 10), tools.getURLParam("SessionID") || "0f8fad5b-d9cb-469f-a165-70867728950e");
			}, 2000);
		}

		if (tools.getURLParam("multicolors"))
			layout.multicolors();

		$("nav").css("visibility", "visible");
	});
});
