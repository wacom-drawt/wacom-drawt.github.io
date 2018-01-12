function ApiService() {
	$ = jQuery;
	this.ORIGIN = 'https://wacom-drawt.github.io';
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

	this.submitDrawing = function (parentNodeId, imageURI, onSuccess, onFail) {

		$.ajax({
			type: "POST",
			url: "https://drawtwacom.herokuapp.com/submit",
			data: {
				drawing: imageURI,
				parent_node_id: parentNodeId
			}
		}).done(function (newNodeId) {
			onSuccess(newNodeId);
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

	//let tree = fixNodeIds(treeFromResponse); //TODO: uncomment after "submit" uses new ids as well
	let tree = treeFromResponse;

	//children_node_ids
	if (!rootId) {
		rootId = 0;
	}
	$ = $ || jQuery;
	var firstNode = tree.graph[rootId];
	var nodesToFix = [firstNode];
	while (nodesToFix.length) {
		currNode = nodesToFix.pop();
		currNode.children_node_ids.forEach(function (childId) {
			var childNode = tree.graph[childId];
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

function fixNodeIds(tree) {
	//prefix IDs with "node_" - https://stackoverflow.com/questions/70579/what-are-valid-values-for-the-id-attribute-in-html
	let NODE_PREFIX = 'node_';
	let fixedTree = tree.map(function (node) {
		node.id = NODE_PREFIX + node.node_id;
		return node;
	});
	return fixedTree;
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
			"drawing": "//preview.ibb.co/nMkvjb/node0001.jpg",
			"is_finished": true,
			"children": [{
				"node_id": 1,
				"user_id": 2,
				"state": "done",
				"parent_node_id": 0,
				"drawing": "//preview.ibb.co/fbEXVG/node0002.jpg",
				"is_finished": true,
				"children": [{
					"node_id": 10,
					"user_id": 2,
					"state": "done",
					"parent_node_id": 3,
					"drawing": "//preview.ibb.co/mTu5jb/node0011.jpg",
					"is_finished": true,
					"children": [

						{
							"node_id": 11,
							"user_id": 2,
							"state": "done",
							"parent_node_id": 10,
							"drawing": "//preview.ibb.co/cFfd4b/node0012.jpg",
							"is_finished": true,
							"children": [


								{
									"node_id": 12,
									"user_id": 2,
									"state": "done",
									"parent_node_id": 11,
									"drawing": "//preview.ibb.co/fnRJ4b/node0013.jpg`",
									"is_finished": true,
									"children": []
								}


							]
						}

					]
				}]
			},
				{
					"node_id": 2,
					"user_id": 2,
					"state": "done",
					"parent_node_id": 0,
					"drawing": "//preview.ibb.co/dR2ajb/node0003.jpg",
					"is_finished": true,
					"children": [{
						"node_id": 4,
						"user_id": 2,
						"state": "done",
						"parent_node_id": 2,
						"drawing": "//preview.ibb.co/nGCEcw/node0005.jpg",
						"is_finished": true,
						"children": []
					},
						{
							"node_id": 5,
							"user_id": 2,
							"state": "done",
							"parent_node_id": 2,
							"drawing": "//preview.ibb.co/cZUSxw/node0006.jpg",
							"is_finished": true,
							"children": []
						},
						{
							"node_id": 6,
							"user_id": 2,
							"state": "done",
							"parent_node_id": 2,
							"drawing": "//preview.ibb.co/ikfZcw/node0007.jpg",
							"is_finished": true,
							"children": [{
								"node_id": 7,
								"user_id": 2,
								"state": "done",
								"parent_node_id": 2,
								"drawing": "//preview.ibb.co/f0dnxw/node0008.jpg",
								"is_finished": true,
								"children": [

									{
										"node_id": 11,
										"user_id": 2,
										"state": "done",
										"parent_node_id": 10,
										"drawing": "//preview.ibb.co/cFfd4b/node0012.jpg",
										"is_finished": true,
										"children": [


											{
												"node_id": 12,
												"user_id": 2,
												"state": "done",
												"parent_node_id": 11,
												"drawing": "//preview.ibb.co/fnRJ4b/node0013.jpg`",
												"is_finished": true,
												"children": []
											}


										]
									}

								]
							},
								{
									"node_id": 8,
									"user_id": 2,
									"state": "done",
									"parent_node_id": 2,
									"drawing": "//preview.ibb.co/gArkjb/node0009.jpg",
									"is_finished": true,
									"children": []
								},
								{
									"node_id": 9,
									"user_id": 2,
									"state": "done",
									"parent_node_id": 2,
									"drawing": "//preview.ibb.co/jk1wqG/node0010.jpg",
									"is_finished": true,
									"children": [{
										"node_id": 10,
										"user_id": 2,
										"state": "done",
										"parent_node_id": 3,
										"drawing": "//preview.ibb.co/mTu5jb/node0011.jpg",
										"is_finished": true,
										"children": [

											{
												"node_id": 11,
												"user_id": 2,
												"state": "done",
												"parent_node_id": 10,
												"drawing": "//preview.ibb.co/cFfd4b/node0012.jpg",
												"is_finished": true,
												"children": [


													{
														"node_id": 12,
														"user_id": 2,
														"state": "done",
														"parent_node_id": 11,
														"drawing": "//preview.ibb.co/fnRJ4b/node0013.jpg`",
														"is_finished": true,
														"children": [

															{
																"node_id": 11,
																"user_id": 2,
																"state": "done",
																"parent_node_id": 10,
																"drawing": "//preview.ibb.co/cFfd4b/node0012.jpg",
																"is_finished": true,
																"children": [


																	{
																		"node_id": 12,
																		"user_id": 2,
																		"state": "done",
																		"parent_node_id": 11,
																		"drawing": "//preview.ibb.co/fnRJ4b/node0013.jpg`",
																		"is_finished": true,
																		"children": [

																			{
																				"node_id": 11,
																				"user_id": 2,
																				"state": "done",
																				"parent_node_id": 10,
																				"drawing": "//preview.ibb.co/cFfd4b/node0012.jpg",
																				"is_finished": true,
																				"children": [


																					{
																						"node_id": 12,
																						"user_id": 2,
																						"state": "done",
																						"parent_node_id": 11,
																						"drawing": "//preview.ibb.co/fnRJ4b/node0013.jpg`",
																						"is_finished": true,
																						"children": []
																					}


																				]
																			}

																		]
																	}


																]
															}

														]
													}


												]
											}

										]
									}]
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
					"drawing": "//preview.ibb.co/dBgkjb/node0004.jpg",
					"is_finished": true,
					"children": [{
						"node_id": 10,
						"user_id": 2,
						"state": "done",
						"parent_node_id": 3,
						"drawing": "//preview.ibb.co/mTu5jb/node0011.jpg",
						"is_finished": true,
						"children": [

							{
								"node_id": 11,
								"user_id": 2,
								"state": "done",
								"parent_node_id": 10,
								"drawing": "//preview.ibb.co/cFfd4b/node0012.jpg",
								"is_finished": true,
								"children": [


									{
										"node_id": 12,
										"user_id": 2,
										"state": "done",
										"parent_node_id": 11,
										"drawing": "//preview.ibb.co/fnRJ4b/node0013.jpg`",
										"is_finished": true,
										"children": [{
											"node_id": 10,
											"user_id": 2,
											"state": "done",
											"parent_node_id": 3,
											"drawing": "//preview.ibb.co/mTu5jb/node0011.jpg",
											"is_finished": true,
											"children": [

												{
													"node_id": 11,
													"user_id": 2,
													"state": "done",
													"parent_node_id": 10,
													"drawing": "//preview.ibb.co/cFfd4b/node0012.jpg",
													"is_finished": true,
													"children": [


														{
															"node_id": 12,
															"user_id": 2,
															"state": "done",
															"parent_node_id": 11,
															"drawing": "//preview.ibb.co/fnRJ4b/node0013.jpg`",
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

						]
					}]
				}
			]
		}
	};
}