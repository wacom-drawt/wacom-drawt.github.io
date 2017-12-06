function ApiService() {
	$ = jQuery;
	this.MOCK_TREE_URL = "https://my-json-server.typicode.com/wacom-drawt/wacom-drawt.github.io/graph";
	this.REAL_TREE_URL = "https://drawtwacom.herokuapp.com/get_graph";

	this.getTree = function (onSuccess, onFail, isMock) {
		var treeUrl = isMock ? this.MOCK_TREE_URL : this.REAL_TREE_URL;
		var xhr = createCORSRequest('GET', treeUrl);
		xhr.withCredentials = true;
		xhr.onload = function () {
			var responseText = xhr.responseText;
			onSuccess(JSON.parse(responseText));
		};
		xhr.onerror = function () {
			console.log('Problem getting graph from server');
		};
		xhr.send();
	};

	this.branchFrom = function(node, onSuccess, onFail){
		var queryParams = $.param({
			node_id: node.node_id
		});
		var url = "https://drawtwacom.herokuapp.com/branch?" + queryParams;
		var xhr = createCORSRequest('GET', url);
		xhr.withCredentials = true;
		xhr.onload = function () {
			var responseText = xhr.responseText;
			onSuccess(JSON.parse(responseText));
		};
		xhr.onerror = function () {
			console.log('Problem branching from node');
		};
	};

	//from https://www.html5rocks.com/en/tutorials/cors/
	function createCORSRequest(method, url) {
		var xhr = new XMLHttpRequest();
		if ("withCredentials" in xhr) {
			// Check if the XMLHttpRequest object has a "withCredentials" property.
			// "withCredentials" only exists on XMLHTTPRequest2 objects.
			xhr.open(method, url, true);
		} else if (typeof XDomainRequest != "undefined") {
			// Otherwise, check if XDomainRequest.
			// XDomainRequest only exists in IE, and is IE's way of making CORS requests.
			xhr = new XDomainRequest();
			xhr.open(method, url);
		} else {
			// Otherwise, CORS is not supported by the browser.
			xhr = null;
		}
		return xhr;
	}
}

function getMockData() {
	return {
		"node_id": 0,
		"user_id": null,
		"graph": {
			"node_id": 1,
			"user_id": 1,
			"state": "done",
			"parent_node_id": null,
			"drawing": "https://img00.deviantart.net/7a8a/i/2008/223/8/0/1st_wacom_hand_drawing_by_0_ash_0.png",
			"is_finished": true,
			"children": [
				{
					"node_id": 2,
					"user_id": 2,
					"state": "done",
					"parent_node_id": null,
					"drawing": "https://i.ytimg.com/vi/ZOghdsWDHFc/maxresdefault.jpg",
					"is_finished": true,
					"children": []
				},
				{
					"node_id": 3,
					"user_id": 3,
					"state": "done",
					"parent_node_id": null,
					"drawing": "https://i0.wp.com/kirileonard.com/wp-content/uploads/2013/08/kiri_leonard_pumpkin_birdies_web.jpg",
					"is_finished": true,
					"children": [
						{
							"node_id": 4,
							"user_id": 2,
							"state": "done",
							"parent_node_id": null,
							"drawing": "https://img00.deviantart.net/4d6f/i/2012/306/d/d/jack_o__lantern_trio_by_the_ht_wacom_man-d5jplps.jpg",
							"is_finished": true,
							"children": []
						},
						{
							"node_id": 5,
							"user_id": 4,
							"state": "done",
							"parent_node_id": null,
							"drawing": "https://img00.deviantart.net/7a8a/i/2008/223/8/0/1st_wacom_hand_drawing_by_0_ash_0.png",
							"is_finished": true,
							"children": []
						}
					]
				}
			]
		}
	}
		;
}