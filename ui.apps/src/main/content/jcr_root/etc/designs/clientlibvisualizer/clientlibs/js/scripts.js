(function () {
    var clientlibToVisualize = "guides.touchAuthoring",
        serverUrl = "/content/freeworks/visualizeclientlibs.json?clientlib=",
        getNodes = function (clientlibs, nodeIndex, clientlibToVisualize) {
            return clientlibs.map(function (clientlib, index) {
                clientlib.categories.forEach(function (cat) {
                    if (nodeIndex[cat] == null) {
                        nodeIndex[cat] = index
                    }
                });
                var node = {
                    category : clientlib.categories.join(","),
                    path : clientlib.path
                };
                if (clientlib.categories.indexOf(clientlibToVisualize) > -1) {
                    node.highlight = true;
                }
                return node;
            })
        },
        createLinks = function (nodes, links, clientlibs, nodeIndex) {
            clientlibs.forEach(function (clientlib, index) {
                clientlib.deps.forEach(function (dep) {
                    if (nodeIndex[dep.categories[0]] == null) {
                        nodes.push({
                            category : dep.categories.join(","),
                            path : dep.path
                        });
                        dep.categories.forEach(function (cat) {
                            nodeIndex[cat] = nodes.length - 1;
                        });
                    }
                    links.push({
                        source : index,
                        target : nodeIndex[dep.categories[0]],
                        type : "dependent"
                    });
                });
                clientlib.embeds.forEach(function (embed) {
                    if (nodeIndex[embed.categories[0]] == null) {
                        nodes.push({
                            category : embed.categories.join(","),
                            path : embed.path
                        });
                        embed.categories.forEach(function (cat) {
                            nodeIndex[cat] = nodes.length - 1;
                        });
                    }
                    links.push({
                        source : index,
                        target : nodeIndex[embed.categories[0]],
                        type : "embed"
                    })
                });
            });
        },
        Visualizer = {
            visualizeClientlib : function (clientLibCategory) {
                var url = serverUrl + clientLibCategory;
                d3.select('svg').remove();
                d3.json(url, function (error, clientlibs) {
                    if (clientlibs != null) {
                        var nodeIndex = {},
                            nodes = getNodes(clientlibs, nodeIndex, clientLibCategory),
                            links = [],
                            width = 1400,
                            height = 480,
                            svg = d3.select('#canvas').append('svg')
                                .attr('width', width)
                                .attr('height', height)
                                .attr("version", "1.1")
                                .attr("xmlns", "http://www.w3.org/2000/svg"),
                            radius = 8;
                        createLinks(nodes, links, clientlibs, nodeIndex);
                        var tick = function () {
                            paths.attr("d", linkArc);
                            //circles.attr("transform", transform);
                            circles.attr("cx", function (d) {
                                return d.x = Math.max(radius, Math.min(width - radius, d.x));
                            })
                                .attr("cy", function (d) {
                                    return d.y = Math.max(radius, Math.min(height - radius, d.y));
                                });
                            text.attr("x", function (d) {
                                return d.x = Math.max(radius, Math.min(width - radius, d.x));
                            })
                                .attr("y", function (d) {
                                    return d.y = Math.max(radius, Math.min(height - radius, d.y));
                                });
                        };
                        var linkArc = function (d) {
                            var dx = d.target.x - d.source.x,
                                dy = d.target.y - d.source.y,
                                dr = Math.sqrt(dx * dx + dy * dy);
                            return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
                        };
                        var transform = function (d) {
                            return "translate(" + d.x + "," + d.y + ")";
                        };
                        window.force = d3.layout.force()
                            .charge(-300)
                            .size([width, height])
                            .linkDistance(100)
                            .nodes(nodes)
                            .links(links).on("tick", tick);
                        svg.append("defs").selectAll("marker")
                            .data(["embed", "dependent"])
                            .enter().append("marker")
                            .attr("id", function (d) {
                                return d;
                            })
                            .attr("viewBox", "0 -5 10 10")
                            .attr("refX", 15)
                            .attr("refY", -1.5)
                            .attr("markerWidth", 6)
                            .attr("markerHeight", 6)
                            .attr("orient", "auto")
                            .append("path")
                            .attr("d", "M0,-5L10,0L0,5");
                        var paths = svg.append('g').selectAll('.link')
                            .data(links)
                            .enter().append('path')
                            .attr('class', function (d) {
                                return 'link ' + d.type
                            })
                            .attr("marker-end", function (d) {
                                return "url(#" + d.type + ")";
                            });
                        var svgNodes = svg.append('g').selectAll('.node')
                            .data(nodes);
                        var newSvgNodes = svgNodes.enter().append("g").attr("class", "node")
                            .on("mouseover", function () {
                                d3.select(this).selectAll("circle")
                                    .transition()
                                    .duration(250)
                                    .attr("r", radius + 4);
                                d3.select(this).selectAll("text")
                                    .transition()
                                    .duration(250)
                                    .style("display", "block")
                                    .style("font-size", "14px");
                            })
                            .on("mouseout", function () {
                                d3.select(this).selectAll("circle")
                                    .transition()
                                    .duration(250)
                                    .attr("r", radius);
                                d3.select(this).selectAll("text")
                                    .transition()
                                    .duration(250)
                                    .style("display", function () {
                                        return ($("#hidelabels").text().trim() == "Show Labels") ? "none" : "block";
                                    })
                                    .style("font-size", "10px");
                            });
                        newSvgNodes.append('circle')
                            .attr('r', 8)
                            .call(force.drag);
                        newSvgNodes.append("text")
                            .attr("x", 8)
                            .attr("y", ".31em");
                        svgNodes.exit().remove();
                        var circles = svgNodes.selectAll('circle')
                            .attr('class', function (d) {
                                return (d.highlight ? "highlight" : "")
                            });
                        var text = svgNodes.selectAll('text')
                            .text(function (d) {
                                return d.category;
                            });
                        force.start();
                    }
                })
            }
        },
        copy = function (original, copyStyles) {
            var duplicate = original.cloneNode(false);
            if (copyStyles) {
                duplicate.setAttribute("style", getStyleString(original));
            }
            var children = original.childNodes,
                tags = ["circle", "text", "path"];
            for (var i =0; i < children.length; i++) {
                var child = children[i];
                var newChild;
                if (!(tags instanceof Text) && tags.indexOf(child.tagName) > -1) {
                     newChild = copy(child, true)
                } else {
                    newChild = copy(child, false);
                }
                duplicate.appendChild(newChild);
            }
            return duplicate;
        },
        getStyleString = function (elem) {
            var styles = getComputedStyle(elem),
                styleStr = "",
                i = 0;
            for (i = 0; i < styles.length; i++) {
                styleStr += styles[i] + ":" + styles[styles[i]] + ((i < (styles.length - 1)) ? ";" : "");
            }
            return styleStr;
        },
        generateDownloadLink = function () {
            debugger;
            var canvasClone = copy($("#canvas")[0], false),
                svgClone = $("svg", canvasClone);
            var svg = $(canvasClone).html(),
                b64 = btoa(svg),
                anchor = $("#anchor");
            if (anchor.length == 0) {
                anchor = $("<a />").attr({
                    "id" : "anchor",
                    "href-lang" : "image/svg+xml",
                    "title" : "download.svg"
                }).text("Download");
                $("body").prepend(anchor);
            }
            anchor.attr({
                "href" : "data:image/svg+xml;base64,\n"+b64
            });
        },
        visualize = function () {
            var clientlibName = $("#clientlib-name").val();
            Visualizer.visualizeClientlib(clientlibName);
        },
        hideLabels = function () {
            var text = $(this).text().trim();
            if (text == "Hide Labels") {
                $('.node text').hide();
                $(this).text("Show Labels");
            } else {
                $('.node text').show();
                $(this).text("Hide Labels");
            }
        };
    $(function () {
        $("#visualize").click(visualize);
        $("#hidelabels").click(hideLabels);
        $("#generateDownloadLink").click(generateDownloadLink);
        visualize();
    })
}());