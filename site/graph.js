// Use this function when addressing tree, we might move the tree someplace else
// and we'll change it via this function.
function getRoot() {
	// TODO: we shouldn't save the tree on global scope..
	// TODO: do the same for global var "links" & "nodes"
	return window.root;
}

function update() {

	var nodesArray = flatten(getRoot()),
		linksArray = d3.layout.tree().links(nodesArray);

	// Restart the force layout.
	force
		.nodes(nodesArray)
		.links(linksArray)
	force.linkDistance(function (link) {
		var factor = (drawt && drawt.isMock) ? 7 : 10;
		return (link.source.weight + link.target.weight) * factor;
	})
	//.distance(100)
		.start();

	updateLinks(linksArray);
	updateNodes(nodesArray);
	setFinishedNodesClickAction();
	setUnfinishedNodesColor();

}

function updateLinks(linksArray) {
	// Update the links…
	links = links.data(linksArray, function (d) {
		return d.target.id;
	});

	// Exit any old links.
	links.exit().remove();

	// Enter any new links.
	links.enter().insert("line", ".node")
		.attr("class", "link")
		.attr("x1", function (d) {
			return d.source.x;
		})
		.attr("y1", function (d) {
			return d.source.y;
		})
		.attr("x2", function (d) {
			return d.target.x;
		})
		.attr("y2", function (d) {
			return d.target.y;
		});
}

function updateNodes(nodesArray) {
	// Update the nodes…
	nodes = nodes.data(nodesArray, function (d) {
		return d.id;
	});//.style("fill", color);

	// Exit any old nodes.
	nodes.exit().remove();

	// Enter any new nodes.
	nodes.enter().append("circle")
		.attr("class", "node")
		.attr("cx", function (d) {
			return d.x;
		})
		.attr("cy", function (d) {
			return d.y;
		})
		.attr("r", function (d) {
			return Math.sqrt(getSize(d) * 50);
		})
		.attr("fill", function (d) {
			return "url(#fill_" + d.node_id + ")";
		})
		.call(drag)
}


function setFinishedNodesClickAction() {
	d3.selectAll("circle")
		.filter(function (d, i) {
			return d.is_finished;
		})
		.on("click", handleMouseClick)
		.on("mouseenter", handleMouseEnter)
		.on("mouseout", handleMouseOut);
}

//TODO: finish this function
function setUnfinishedNodesColor() {
	d3.selectAll("circle")
		.filter(function (d, i) {
			return !d.is_finished;
		})
	// PROBLEM: THIS OVERRIDES BG IMAGE (the drawing the user just made)..
	//.style("fill", "#000")
	//.style("fill-opacity", 0.6)
}

function getSize(d) {
	if (d.children) {
		return d.children.length > 0 ? d.children.length : 1;
	} else {
		return 1
	}
}

function tick() {
	links.attr("x1", function (d) {
		return d.source.x;
	})
		.attr("y1", function (d) {
			return d.source.y;
		})
		.attr("x2", function (d) {
			return d.target.x;
		})
		.attr("y2", function (d) {
			return d.target.y;
		});

	nodes.attr("cx", function (d) {
		return d.x;
	})
		.attr("cy", function (d) {
			return d.y;
		});
}

// Color leaf nodes orange, and packages white or blue.
function color(d) {
	return d._children ? "#b7b7b7" : d.children ? "#b7b7b7" : "#b7b7b7";
}

// Makes sure all nodes drawings are available as patterns
//
function createThumbnails(canvasObj, root) {

	// Defaults
	root = root || getRoot();
	var svg = canvasObj || d3.select("svg");
	var data = flatten(root);

	svg
		.append("defs")
		.selectAll("pattern")
		.data(data)
		.enter()
		.append("pattern")
		// This id will help finding the image later
		.attr('id', function (d, i) {
			return "fill_" + d.node_id; //gotta have letter at beginning of id
		})
		// Image will start filling by this offset
		.attr("viewBox", function (d, i) {
			return "0 10 100 100";
		})
		// This will make the image
		.attr("patternContentUnits", function (d, i) {
			return "objectBoundingBox";
		})
		// Image size
		.attr('width', '350%')
		.attr('height', '350%')
		.append("image")
		.attr("xlink:href", function (d) {
			return d.drawing;
		})
		.attr('width', 50)
		.attr('height', 50);
}

function addThumbnail(node) {
	var data = flatten(node);
	d3.selectAll("defs")
		.append("pattern")
		.data(data)
		.attr('id', function (d, i) {
			return "fill_" + d.node_id; //gotta have letter at beginning of id
		})
		// Image will start filling by this offset
		.attr("viewBox", function (d, i) {
			return "0 10 100 100";
		})
		// This will make the image
		.attr("patternContentUnits", function (d, i) {
			return "objectBoundingBox";
		})
		// Image size
		.attr('width', '350%')
		.attr('height', '350%')
		.append("image")
		.attr("xlink:href", function (d) {
			return d.drawing;
		})
		.attr('width', 50)
		.attr('height', 50);
}

// Toggle children on click.
function handleMouseClick(d) {
	if (!d3.event.defaultPrevented) {
		if (d.node_id) {
			modalOpener.openModal({
				type: modalOpener.types.EDITOR,
				node: d
			});
		} else {
			drawt.debug('didn\'t click node.');
			drawt.debug(d);
		}
		update();
	}
}

var isZoomedAfterClick = false;

function handleMouseEnter(d, i) {
	var drawing = {};
	if (drawt && drawt.isDebug) {
		drawing["hovered_drawing_" + d.node_id] = d.drawing;
		console.log(drawing);
	}
	if (isZoomedAfterClick) {
		return;
	}
	d3.select(this).transition()
		.ease("elastic")
		.duration("500")
		.attr("r", Math.sqrt(getSize(d) * 50) * 2);
}

function handleMouseOut(d, i) {
	if (isZoomedAfterClick) {
		return;
	}
	d3.select(this).transition()
		.ease("quad")
		.delay("100")
		.duration("200")
		.attr("r", Math.sqrt(getSize(d) * 50));
}

// Returns a list of all nodes under the root.
function flatten(root) {
	var nodes = [], i = 0;

	function recurse(node) {
		if (node.children) node.children.forEach(recurse);
		if (!node.id) node.id = node.node_id;
		nodes.push(node);
	}

	recurse(root);
	return nodes;
}

var scaleZoom = 100;

function transition(svg, nodeToFocus) {

	if (isZoomedAfterClick) {
		scaleZoom = 400
	}
	;

	isZoomedAfterClick = true;

	var svgW = $('svg').width();
	var svgH = $('svg').height();

	start = [svgW / 2, svgH / 2, 100];
	end = [nodeToFocus.x, nodeToFocus.y, scaleZoom];


	// change is zoomed to false
	// make original node smalled with end

	var i = d3.interpolateZoom(start, end);
	svg
		.attr("transform", transform(start))
		.transition()
		.delay(250)
		.duration(i.duration * 2)
		.attrTween("transform", function () {
			return function (t) {
				return transform(i(t));
			};
		});
	;

	function transform(p) {
		var zoom = p[2];
		var k = svgH / zoom;
		var translateX = ((start[0] - p[0]) * k);
		var translateY = ((start[1] - p[1]) * k);
		link.style("stroke-width", 1 + (k * 0.000000001))
		node.style("stroke-width", 1 + (k * 0.000000001));

		return "translate(" + translateX + "," + translateY + ")scale(" + k + ")";
	}

	// TODO: raaz left this comment: "show button"
	// TODO: raaz left this comment: "give center position: nodeToFocus.x, nodeToFocus.y"
	isZoomedAfterClick = false;

}

//TODO: decide whether we want to use this or not. (currently not being used)
function centralizeRoot(d) {
	d3.select('svg').call(transition, d);
}

function addNodeToTree(node, parentId) {

	// Recursively find parent and update //TODO: keep reference to parent instead!
	function addNodeToParentRec(currNode) {
		if (currNode.node_id == parentId) {
			currNode.children.push(node);
			return true;
		} else if (!currNode.children.length) {
			return false;
		}
		for (var i = 0; i < currNode.children.length; i++) {
			if (addNodeToParentRec(currNode.children[i])) {
				return true;
			}
		}
		return false;
	}

	var isNodeAdded = addNodeToParentRec(getRoot());
	if (!isNodeAdded) {
		drawt.debug('Failed adding node to graph!');
		drawt.debug(node);
		return;
	}

	addThumbnail(node);
	update();

	api.submitDrawing(parentId, node.drawing,
		//on success
		function (newNodeId) {
			node.node_id = newNodeId;
			node.id = parseInt(newNodeId);
			node.is_finished = true;
			addThumbnail(node);
			update();
		},
		//on failure
		function () {
			drawt.debug('failed adding new picture..');
		});
}