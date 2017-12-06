function ApiService() {
	$ = jQuery;
	this.ORIGIN = 'https://wacom-drawt.github.io';
	this.MOCK_TREE_URL = "https://my-json-server.typicode.com/wacom-drawt/wacom-drawt.github.io/graph";
	this.REAL_TREE_URL = "https://drawtwacom.herokuapp.com/get_graph";
	this.SUBMIT_IMAGE_URL = "https://drawtwacom.herokuapp.com/submit";

	this.getTree = function (onSuccess, onFail, isMock) {

		var treeUrl = isMock ? this.MOCK_TREE_URL : this.REAL_TREE_URL;
		var xhr = createCORSRequest('GET', treeUrl);
		// xhr.withCredentials = true;
		xhr.onload = function () {
			var responseText = xhr.responseText;
			var tree = isMock ? getMockData().graph : getGraphFromResponse(JSON.parse(responseText));
			onSuccess(tree);
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
		// xhr.withCredentials = true;
		xhr.onload = function () {
			var responseText = xhr.responseText;
			onSuccess(JSON.parse(responseText));
		};
		xhr.onerror = function () {
			console.log('Problem branching from node');
		};

		xhr.send();
	};

	this.submitDrawing = function(newNodeId, imageURI, onSuccess, onFail){
		
		var xhr = createCORSRequest('POST', this.SUBMIT_IMAGE_URL);
		// xhr.withCredentials = true;
		xhr.onload = function () {
			var responseText = xhr.responseText;
			onSuccess(JSON.parse(responseText));
		};
		xhr.onerror = function () {
			console.log('Problem posting new image');
		};

		var data = {
			node_id: newNodeId,
			drawing: imageURI
		};
		xhr.setRequestHeader("Access-Control-Allow-Headers", "X-Requested-With, Content-Type");
		xhr.setRequestHeader('Access-Control-Request-Method', 'POST');
		xhr.setRequestHeader("Access-Control-Allow-Origin", '*');
		xhr.setRequestHeader('Access-Control-Request-Headers', 'Content-Type, Authorization');
		// xhr.setRequestHeader("Access-Control-Allow-Headers", "X-Requested-With, Content-Type");
		xhr.send(JSON.stringify(data));
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

function getGraphFromResponse(treeFromResponse, rootId){
	//children_node_ids
	if(!rootId){
		rootId = 0;
	}
	$ = $ || jQuery;
	var firstNode = treeFromResponse.graph[rootId];
	var nodesToFix = [firstNode];
	while(nodesToFix.length){
		currNode = nodesToFix.pop();
		currNode.children_node_ids.forEach(function(childId){
			var childNode = treeFromResponse.graph[childId];
			if(!currNode.children){
				currNode.children = [];
			}
			if(!childNode.children && childNode){
				childNode.children = [];
			}
			currNode.children.push(childNode);
			nodesToFix.push(childNode);
		});
	}
	return firstNode;

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
			// "drawing": "https://img00.deviantart.net/7a8a/i/2008/223/8/0/1st_wacom_hand_drawing_by_0_ash_0.png",
			"drawing": "data:image/png;base64,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",
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