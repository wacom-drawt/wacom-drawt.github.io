function update() {

	var nodes = flatten(root),
		links = d3.layout.tree().links(nodes);

	// Restart the force layout.
	force
		.nodes(nodes)
		.links(links)
	force.linkDistance(function (link) {
		console.log(link);
		return (link.source.weight + link.target.weight) * 10;
	})
	//.distance(100)
		.start();

	// Update the links…
	link = link.data(links, function (d) {
		return d.target.id;
	});

	// Exit any old links.
	link.exit().remove();

	// Enter any new links.
	link.enter().insert("line", ".node")
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

	// Update the nodes…
	node = node.data(nodes, function (d) {
		return d.id;
	});//.style("fill", color);

	// Exit any old nodes.
	node.exit().remove();

	// Enter any new nodes.
	node.enter().append("circle")
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
			return "url(#" + d.node_id + ")";
		})
        // .style("fill", color)
        .on("click", dblclicknode)
        .on("mouseenter", handleMouseEnter)
        .on("mouseout", handleMouseOut)
        .call(drag);

}

function getSize(d) {
	if (d.children) {
		return d.children.length > 0 ? d.children.length : 1;
	} else {
		return 1
	}
}

function tick() {
	link.attr("x1", function (d) {
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

	node.attr("cx", function (d) {
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
function saveImagesAsPatternsInCanvas(canvasObj, root) {
	var data = flatten(root);
	var svg = canvasObj;

	svg.append("defs")
		.selectAll("pattern")
		.data(data)
		.enter()
		.append("pattern")
		// This id will help finding the image later
		.attr('id', function (d, i) {
			return d.node_id;
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
		.attr('width', '300%')
		.attr('height', '300%')
		.append("image")
		.attr("xlink:href", function (d) {
			return d.drawing;
		})
		.attr('width', 50)
		.attr('height', 50);
}


// Toggle children on click.
function dblclicknode(d) {
	if (!d3.event.defaultPrevented) {
		if (d.children) {
			d._children = d.children;
			d.children = null;
		} else {
			d.children = d._children;
			d._children = null;
		}
		if (d.node_id) {
			modalOpener.openModal({
				type: modalOpener.types.EDITOR,
				node: d
			});
		} else {
			console.log(d);
			console.log('didnt click node.');
		}

		update();
	}

}

var isZoomedAfterClick = false;

function handleMouseEnter(d, i) {
    if (isZoomedAfterClick) { return;}
    d3.select(this).transition()
        .ease("elastic")
        .duration("500")
        .attr("r", Math.sqrt(getSize(d)*50)*2);
}

function handleMouseOut(d, i) {
    if (isZoomedAfterClick) { return;}
    d3.select(this).transition()
        .ease("quad")
        .delay("100")
        .duration("200")
        .attr("r", Math.sqrt(getSize(d)*50));
}

// Returns a list of all nodes under the root.
function flatten(root) {
	var nodes = [], i = 0;

	function recurse(node) {
		if (node.children) node.children.forEach(recurse);
		if (!node.id) node.id = ++i;
		nodes.push(node);
	}

	recurse(root);
	return nodes;
}

var scaleZoom = 100;

function transition(svg, nodeToFocus) {

    if (isZoomedAfterClick) {scaleZoom = 400};

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

    // show button

    // give center position: nodeToFocus.x, nodeToFocus.y

    isZoomedAfterClick = false;

}

function centralizeRoot(d) {

    d3.select('svg').call(transition, d);


}