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

	this.branchFrom = function (node, onSuccess, onFail, debug) {
		var params = {
			node_id: node.node_id
		};
		if (debug) {
			params['debug'] = debug;
		}
		var queryParams = $.param(params);

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

	this.submitDrawing = function (newNodeId, imageURI, onSuccess, onFail) {

		$.ajax({
			type: "POST",
			url: "https://drawtwacom.herokuapp.com/submit",
			data: {
				drawing: imageURI,
				node_id: newNodeId
			}
		}).done(function (o) {
			onSuccess(o);
		});
		return;

		// NOT WORKING WHYYYY
		// var xhr = createCORSRequest('POST', this.SUBMIT_IMAGE_URL);
		// // xhr.withCredentials = true;
		// xhr.onload = function () {
		// 	var responseText = xhr.responseText;
		// 	onSuccess(JSON.parse(responseText));
		// };
		// xhr.onerror = function () {
		// 	console.log('Problem posting new image');
		// };
		//
		// xhr.setRequestHeader("Access-Control-Allow-Headers", "*");
		// // xhr.setRequestHeader("Access-Control-Allow-Origin", '*');
		// // xhr.setRequestHeader('Access-Control-Request-Method', 'POST');
		// // xhr.setRequestHeader('Access-Control-Request-Headers', 'Content-Type, Authorization');
		// // xhr.setRequestHeader("Access-Control-Allow-Headers", "X-Requested-With, Content-Type");
		//
		// var data = {
		// 	node_id: newNodeId,
		// 	drawing: imageURI,
		// 	is_test: 'yes it is'
		// };
		// var strData = JSON.stringify(data);
		// xhr.send(strData);
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

function getGraphFromResponse(treeFromResponse, rootId) {
	//children_node_ids
	if (!rootId) {
		rootId = 0;
	}
	$ = $ || jQuery;
	var firstNode = treeFromResponse.graph[rootId];
	var nodesToFix = [firstNode];
	while (nodesToFix.length) {
		currNode = nodesToFix.pop();
		currNode.children_node_ids.forEach(function (childId) {
			var childNode = treeFromResponse.graph[childId];
			if (!currNode.children) {
				currNode.children = [];
			}
			if (!childNode.children && childNode) {
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
			"node_id": 0,
			"user_id": 2,
			"state": "done",
			"parent_node_id": null,
			"drawing": "https://preview.ibb.co/nMkvjb/node0001.jpg",
			"is_finished": true,
			"children": [{
				"node_id": 1,
				"user_id": 2,
				"state": "done",
				"parent_node_id": 0,
				"drawing": "https://preview.ibb.co/fbEXVG/node0002.jpg",
				"is_finished": true,
				"children": []
			},
				{
					"node_id": 2,
					"user_id": 2,
					"state": "done",
					"parent_node_id": 0,
					"drawing": "https://preview.ibb.co/dR2ajb/node0003.jpg",
					"is_finished": true,
					"children": [{
						"node_id": 4,
						"user_id": 2,
						"state": "done",
						"parent_node_id": 2,
						"drawing": "https://preview.ibb.co/nGCEcw/node0005.jpg",
						"is_finished": true,
						"children": []
					},
						{
							"node_id": 5,
							"user_id": 2,
							"state": "done",
							"parent_node_id": 2,
							"drawing": "https://preview.ibb.co/cZUSxw/node0006.jpg",
							"is_finished": true,
							"children": []
						},
						{
							"node_id": 6,
							"user_id": 2,
							"state": "done",
							"parent_node_id": 2,
							"drawing": "https://preview.ibb.co/ikfZcw/node0007.jpg",
							"is_finished": true,
							"children": [{
								"node_id": 7,
								"user_id": 2,
								"state": "done",
								"parent_node_id": 2,
								"drawing": "https://preview.ibb.co/f0dnxw/node0008.jpg",
								"is_finished": true,
								"children": []
							},
								{
									"node_id": 8,
									"user_id": 2,
									"state": "done",
									"parent_node_id": 2,
									"drawing": "https://preview.ibb.co/gArkjb/node0009.jpg",
									"is_finished": true,
									"children": []
								},
								{
									"node_id": 9,
									"user_id": 2,
									"state": "done",
									"parent_node_id": 2,
									"drawing": "https://preview.ibb.co/jk1wqG/node0010.jpg",
									"is_finished": true,
									"children": []
								}
							]
						}
					]
				},
				{
					"node_id": 3,
					"user_id": 2,
					"state": "done",
					"parent_node_id": 0,
					"drawing": "https://preview.ibb.co/dBgkjb/node0004.jpg",
					"is_finished": true,
					"children": [{
						"node_id": 10,
						"user_id": 2,
						"state": "done",
						"parent_node_id": 3,
						"drawing": "https://preview.ibb.co/mTu5jb/node0011.jpg",
						"is_finished": true,
						"children": [

							{
								"node_id": 11,
								"user_id": 2,
								"state": "done",
								"parent_node_id": 10,
								"drawing": "https://preview.ibb.co/cFfd4b/node0012.jpg",
								"is_finished": true,
								"children": [


									{
										"node_id": 12,
										"user_id": 2,
										"state": "done",
										"parent_node_id": 11,
										"drawing": "https://preview.ibb.co/fnRJ4b/node0013.jpg`",
										"is_finished": true,
										"children": []
									}


								]
							}

						]
					}]
				}
			]
		}
	};
}