var http = require("http");
var https = require("https");
var url = require("url");
var fs = require("fs");
var util = require("util");

var formidable = require("formidable");

var PageController = process.require("PageController");

var mimes = {
	"htm": "text/html; charset=utf-8",
	"html": "text/html; charset=utf-8",
	"css":  "text/css",
	"js":   "text/javascript",
	"json": "application/json",
	"jpg":  "image/jpeg",
	"jpeg": "image/jpeg",
	"png":  "image/png"
};

var WebPage = function(request, response) {
	var location = url.parse(request.url, true);

	this.uri = location.pathname;
	this.queryString = url.parse(request.url).query || "";
	this.query = location.query;

	this.init(this.uri);

	this.request = request;
	this.response = response;
	this.cookies = null;

	this.local = request.headers.host.indexOf("localhost") > -1 || request.headers.host.indexOf("192.168.") > -1 || request.headers.host.indexOf("10.") > -1;
	this.readContent = true;
	this.excludeTemplateModel = false;
	this.retryStrategy = new Object()
	this.variables = new Object();
	this.sync = 0;

	this.pc = new PageController(this);

	if (this.local) {
		console.log("Request for " + this.uri + " received.");
		console.log("-> WebPage init: " + this.name + " :: " + this.ext);
	}
}

module.exports = WebPage;

WebPage.prototype.init = function(uri) {
	this.data = "";

	this.filename = process.getRealPath(uri);
	this.name = uri.substring(uri.lastIndexOf("/")+1);
	this.ext = "";

	if (fs.existsSync(this.filename) && fs.statSync(this.filename).isDirectory()) {
		this.filename += "index.html";
		this.name = "index";
		this.ext = "html";
	}

	if (this.name.indexOf(".") > -1) {
		this.ext = this.name.substring(this.name.lastIndexOf(".")+1).toLowerCase();
		this.name = this.name.substring(0, this.name.lastIndexOf("."));
	}

	if (this.ext == "") {
		this.ext = "html";
		this.filename += ".html";
	}
}

WebPage.prototype.open = function() {
	var methodName = this.name.substring(0, 1).toLowerCase() + this.name.substring(1);
	var method = this.pc[methodName] || this.pc[this.name.toLowerCase()] || this.pc[this.name.toUpperCase()] || this.pc[this.name];

	if (typeof method == "function")
		method.call(this.pc);

	if (this.readContent) {
		if (this.data)
			this.complete();
		else {
			var self = this;

			fs.exists(this.filename, function(exists) {
				if (!exists) {
					if (typeof method == "function") {
						self.complete();
						return;
					}

					console.log("File location not found: " + self.filename);

					self.response.writeHead(404, {"Content-Type": "text/plain"});
					self.response.write("404 Not Found\n");
					self.response.end();
					return;
				}
				else {
					if (self.local)
						console.log("File location: " + self.filename);

					fs.readFile(self.filename, "binary", function (err, data) {
						if (err) {
							console.log(err);

							self.response.writeHead(500, {"Content-Type": "text/plain"});
							self.response.write(err + "\n");
							self.response.end();
							return;
						}

						self.data = data;
						self.complete();
					});
				}
			});
		}
	}
}

WebPage.prototype.complete = function(wait) {
	if ((!wait && this.completeStarted) || this.ready) return;
	this.completeStarted = true;

	if (this.sync == 0) {
		this.response.statusCode = 200;

		if (!this.excludeTemplateModel && ((!mimes[this.ext] && !this.data instanceof Buffer) || (mimes[this.ext] || "").indexOf("text") == 0))
			this.data = this.prepareTemplate(this.data);

		if (mimes[this.ext])
			this.response.setHeader("Content-Type", mimes[this.ext]);

		if (mimes[this.ext] && mimes[this.ext].indexOf("text") == 0) {
			this.response.setHeader("Content-Length", Buffer.byteLength(this.data, "utf8"));
/*
			this.response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");	// HTTP 1.1
			this.response.setHeader("Pragma", "no-cache");										// HTTP 1.0
			this.response.setHeader("Expires", 0);												// Proxies
*/
		}
		else
			this.response.setHeader("Content-Length", this.data.length);

		if (mimes[this.ext] && mimes[this.ext].indexOf("text") == 0)
			this.response.write(this.data);
		else
			this.response.write(this.data, "binary");

		this.response.end();
	}
	else {
		var self = this;

		setTimeout(function() {
			self.complete(true);
		}, 100);
	}
}

/**
 * name page variables referrer, not applicable when option response is true
 * options {
 * 		location: STRING | DATA, 	request url
 *		method: GET | POST ...		defaults to GET
 * 		response: BOOL,				set response as page response
 * 		binary: BOOL,				requested content is binary
 * 		body: STRING | BUFFER,		when method is POST or PUT, body to send
 * 		retryer: STRING,			name in retry strategy
 * 		callback: FUNCTION			not required, recieves response as argument
 * }
 */
WebPage.prototype.requestContent = function(name, options) {
	var self = this;
	var location = options.location;
	var retryer = options.retryer;
	var protocol;

	if (retryer) {
		if (!this.retryStrategy[retryer])
			this.retryStrategy[retryer] = 3;

		this.retryStrategy["Error" + retryer + this.retryStrategy[retryer]] = false;
	}

	if (typeof location == "string")
		location = url.parse(location);
	else if (!location.protocol)
		location.protocol = "http:";

	if (location.protocol == "https:")
		protocol = https;
	else
		protocol = http;

	if (options.method) {
		location.method = options.method;
		// location.headers = {
		// 	"Content-Type": mimes[this.ext],
		// 	"Content-Length": options.body.length
		// };
	}

	this.sync++;
	var request = protocol.request(location, function(response) {
		var chunks = new Array();

		if (!options.binary)
			response.setEncoding("utf8");

		// console.log("statusCode: ", response.statusCode);
		// console.log("headers: ", response.headers);

		response.on("data", function(chunk) {
			chunks.push(chunk);
		});

		response.on("end", function() {
			var content = options.binary?Buffer.concat(chunks):chunks.join("");

			if (!retryer || !self.retryStrategy["Error" + retryer + self.retryStrategy[retryer]]) {
				if (options.response)
					self.data = content;
				else
					self.variables[name] = content;

				self.sync--;

				if (options.callback) options.callback(this);
			}
			else {
				setTimeout(function() {
					self.requestContent(name, props);
					self.sync--;
				}, 150);
			}

			if (retryer && self.retryStrategy[retryer] < 3)
				console.log("Request content response end after error (" + (3-self.retryStrategy[retryer]) + " :: " + "Error" + retryer + self.retryStrategy[retryer] + " :: " + self.retryStrategy["Error" + retryer + self.retryStrategy[retryer]] + "): " + content);
		});
	});

	if (options.body) request.write(options.body);
	request.end();

	request.on("error", function(error) {
		if (retryer && self.retryStrategy[retryer] > 0) {
			self.retryStrategy[retryer]--;
			self.retryStrategy["Error" + retryer + self.retryStrategy[retryer]] = true;

			console.log("retry" + retryer + " " + (3-self.retryStrategy[retryer]));
		}
		else
			console.error("Request content failed: " + error);

		self.sync--;
	});
}

WebPage.prototype.retry = function(error, retryer, fn, options) {
	var self = this;

	if (!options) options = new Object();
	if (!options["RetryCount"]) options["RetryCount"] = 3;
	if (!options["Interval"]) options["Interval"] = 100;
	if (!this.retryStrategy[retryer]) this.retryStrategy[retryer] = options["RetryCount"];

	if (this.retryStrategy[retryer] > 0) {
		this.retryStrategy[retryer]--;

		console.log("retry" + retryer + ": " + (3-page.retryStrategy[retryer]));

		self.sync++;
		setTimeout(function() {
			fn();
			self.sync--;
		}, options["Interval"]);
	}
	else
		console.log("Retry strategy failed on " + retryer + ": " + error);
}

WebPage.prototype.forward = function(uri) {
	this.init(uri);
	this.open();
}

WebPage.prototype.redirect = function(location) {
	this.ready = true;

	this.response.statusCode = 302;
	this.response.setHeader("location", location);

/*
		"Cache-Control": "public",
		"Date": new Date().toGMTString(),
		"Server": "Node/" + process.version,
		"Content-Length": "0",
		"Connection": "Close",
*/

	this.response.end();
}

WebPage.prototype.getCookies = function() {
	if (!this.cookies) {
		this.cookies = new Object();

		if (this.request.headers.cookie) {
			var cookies = this.request.headers.cookie.split(";");

			for (var i = 0; i < cookies.length; i++) {
				var parts = cookies[i].match(/(.*?)=(.*)$/);
				this.cookies[parts[1].trim()] = (parts[2] || "").trim();
			}
		}
	}

	return this.cookies;
}

WebPage.prototype.getCookie = function(name) {
	return this.getCookies()[name] || null;
}

WebPage.prototype.setCookie = function(name, value, minutes, domain, path) {
	var cookies = this.response.getHeader("Set-Cookie");
	if (!cookies) cookies = [];

	var expires = (new Date()).getTime() + minutes * 60 * 1000;

	var cookie = name + "=" + value + ";";

	if (domain)
		cookie += "domain=" + domain + ";";

	if (path)
		cookie += "path=" + path + ";"

	cookie += "expires=" + (new Date(expires)).toUTCString();

	cookies.push(cookie);

	this.response.setHeader("Set-Cookie", cookies);
}

WebPage.prototype.removeCookie = function(name) {
	if (!cookies) cookies = [];

	cookies.push(name + "=deleted; expires=Thu, 01 Jan 1970 00:00:00 GMT");

	this.response.setHeader("Set-Cookie", cookies);
}

WebPage.prototype.getTemplateVariables = function(template) {
	var result = new Array();
	var expr = new RegExp("(\\$\\w+?\\$)|(\\$\\w+{.+?}\\$)", "gi");

	while (matcher = expr.exec(template)) {
		var name = matcher[0].substring(1, matcher[0].length-1);
		result.push(name);
	}

	return result;
}

WebPage.prototype.prepareTemplate = function(template) {
	var variables = this.getTemplateVariables(template);

	variables.forEach(function(name) {
		if (!this.variables[name] && this.variables[name] != "") console.log("Variable " + name + " missing in " + this.name + "." + this.ext);
		template = template.replace(RegExp("\\$" + name + "\\$", "gi"), this.variables[name]);
	}, this);

	return template;
}

WebPage.prototype.getForm = function() {
	var self = this;
	var form = new formidable.IncomingForm();

	if (this.local) {
		form.on("progress", function(bytesReceived, bytesExpected){
			var percent = (bytesReceived / bytesExpected * 100) | 0;
			console.log("-> Uploading: %" + percent + "\r");
		});

		form.on("error", function(err) {console.log("->" + err);});
		form.on("aborted", function() {console.log("-> Aborted");});
		form.on("end", function() {console.log("-> upload done");});
	}
	//else
		//this.readContent = false;

	form.debug = function(err, fields, files) {
		if (err)
			console.log("-> parse finished with error: " + err);
		else {
			if (self.local) {
				console.log("-> parse finished");

				for (var name in fields)
					console.log(name + "=" + fields[name]);

				for (var name in files)
					console.log(name + "=" + files[name]["path"] + " :: " + files[name]["name"] + " :: " + files[name]["type"] + " :: " + files[name]["size"]);

				self.data += util.inspect({fields: fields, files: files});
				self.data += "<br />";
			}
		}
	}

	return form;
}