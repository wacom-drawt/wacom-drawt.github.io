var server = {
	users: [],
	net: [],

	init: function() {
		$("iframe").each(function(i, iframe) {
			var user = {};
			user.id = i;
			user.name = iframe.name;
			user.target = iframe;
			user.window = iframe.contentWindow;

			server.users.push(user);
			server.net.push(new Array());
		});
	},

	getSessionID: function(userName) {
		var result;

		for (var i = 0; i < this.users.length; i++) {
			var user = this.users[i];

			if (userName == user.name) {
				user.client = user.window.client;
				result = user.id;

				break;
			}
		}

		return result;
	},

	send: function(recipients, sender, data) {
		recipients.forEach(function(recipient) {
			var callback = (function(recipient, sender, data) {
				return function() {
					server.users[recipient].client.receive(sender, data);
				}
			})(recipient, sender, data);

			this.latency(recipient, callback);
		}, this);
	},

	latency: function(recipient, callback) {
		var queue = this.net[recipient];
		if (callback) this.net[recipient].push(callback);

		if (!queue.locked) {
			queue.locked = true;

			setTimeout(function(queue, recipient) {
				queue.shift().call(server);
				queue.locked = false;
				if (queue.length > 0) server.latency(recipient);
			}, Math.randomInt(50, 100), queue, recipient);
		}
	},

	receive: function(sender, data, compose) {
		var recipients = [];

		this.users.forEach(function(user) {
			if (!compose || user.id != sender)
				recipients.push(user.id);
		}, this);

		this.send(recipients, sender, data);
	},

	clear: function() {
		this.users.forEach(function(user) {
			this.latency(user.id, function() {
				user.window.WILL.super.clear();
			});
		}, this);
	}
};

$(document).ready(function() {
	$(".Wrapper").css("height", $(window).height());
	server.init();
});