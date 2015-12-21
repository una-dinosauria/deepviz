
var createKDTree = require("static-kdtree")

// Global variables
var imsize = 128; // Size of images in the tile

var imageWidth 	 = 32;
var	imageHeight  = 32;
var	total_images = 850;   // total images in the big tile
var	per_row      = Math.ceil(Math.sqrt( total_images ));   // images per row in the big tile
var	nrows        = Math.ceil(Math.sqrt( total_images ));   // total number of rows in the big tile
var width  	     = per_row * imageWidth;
var height 		 = nrows *  imageHeight;

var base = d3.select("#vis");

// Add an external canvas for cascaded resizing
var oc = document.createElement('canvas'),
	octx = oc.getContext('2d');
oc.width  = imsize;
oc.height = imsize;

// Add a canvas
var chart = base.append("canvas")
.attr( "width", width)
.attr("height", height)
.attr("id","canvas");

var context = chart.node().getContext("2d");

// Load image names, image features and embedding
var im_names;     // image names. Keys in im_features and im_embedding
var im_features;  // 4096-dimensional descriptor of each image.
var im_embedding; // 2-dimensional t-sne embedding of each image


// Load all the things
// Load the image names
var im_names_response = "";
$.ajax({
	type: "GET",
	url: "js/data/names.json",
	success: function( im_names_response ) {
		im_names = im_names_response.names;

		// -- Trim the names. Removes the last \n
		var n_names = im_names.length;
		for ( i=0; i<n_names; i++) {
			im_names[i] = $.trim( im_names[i] );
		}
	},
	dataType: "json"
})

// Load the image features
var im_features_response = "";
$.ajax({
	type: "GET",
	url: "js/data/features.json",
	success: function( im_features_response ) {
		im_features = im_features_response;
	},
	dataType: "json"
})

// Load the tsne embedding
var im_embedding_response = "";
$.ajax({
	type: "GET",
	url: "js/data/embedding.json",
	success: function( im_embedding_response ) {
		im_embedding = im_embedding_response;
		//gridify_tsne();
	},
	dataType: "json"
})

// We will load the big tile here
var image = new Image();
image.src = 'imgs/facespics_128/bigtile.jpg';

var g_xs = [];
var g_ys = [];
var g_focus = [];
var g_brushes  = [];
var g_contexts = [];
var g_similarities = []; // indices
var g_similarities_values = []; //values
var g_extent = [0, 10]
var g_domain = g_extent[1] - g_extent[0];

var q_idx = 0;
q_idx ++;

// CREATE THE SUMMARY PLOT AT THE TOP
var g_margin = {top: 10, right: 10, bottom: 25, left: 30},
	g_width  = 800 - g_margin.left - g_margin.right,
	g_height = 130 - g_margin.top -  g_margin.bottom;

var g_x = d3.scale.linear().range([0, g_width]);
var g_y = d3.scale.linear().range([g_height, 0]);

var xAxis = d3.svg.axis().scale(g_x).orient("bottom").ticks(10);
var yAxis = d3.svg.axis().scale(g_y).orient("left").tickValues([0, 0.25, 0.5, 0.75]);

var svg_summary = d3.select("#summary")
	.append("svg")
	.attr("width", g_width  + g_margin.left + g_margin.right)
	.attr("height",g_height + g_margin.top  + g_margin.bottom)
	.attr("style", "float: left")
	.append("g")
	.attr("transform",
		  "translate(" + g_margin.left + "," + g_margin.top + ")");

g_x.domain( [0, total_images-1] )
g_y.domain( [0, 0.75] );

g_valueline = d3.svg.line()
	.x(function(d) { return g_x(d.idx); })
	.y(function(d) { return g_y(d.distance); });

svg_summary.append("g")
	.attr("class", "x axis")
	.attr("transform", "translate(0," + g_height + ")")
	.call(xAxis);

svg_summary.append("g")
	.attr("class", "y axis")
	.call(yAxis);

// NOW ADD THE BRUSH
var brush = d3.svg.brush()
	.x( g_x )
 	.extent( g_extent )
 	.clamp( true )
 	.on( "brush", function(){ brushed(0)} ); // Pass local_idx by closure

g_brushes.push( brush );

svg_summary.append("g")
	.attr('id', 'brush' + 0)
	.attr('class', 'brush')
	.call( brush )
	.selectAll('rect')
	.attr('height', g_height);

var assignedTree;
var assigned = new Array( total_images );

$.when( image, im_names_response, im_features_response, im_embedding_response )
	.done({ function() {
		gridify_tsne();
	}});


// Draw images with size of 32 x 32. We want 28x28 images on each side.
function gridify_tsne() {
	var s1 = new StopWatch();
	s1.Start();

	context.clearRect(0,0,width, height);

	// Scale the tsne embedding to sort-of match the size of the canvas
	var max_x = -Number.MAX_VALUE;
	var min_x =  Number.MAX_VALUE;
	var max_y = -Number.MAX_VALUE;
	var min_y =  Number.MAX_VALUE;

	var n_names = im_names.length;
	for ( i=0; i<n_names; i++ ) {
		// Get the coordinates
		coords = im_embedding[ im_names[i] ];
		x = coords[0]; y = coords[1];

		// Update max and mins
		if ( x < min_x ) { min_x = x };
		if ( x > max_x ) { max_x = x };
		if ( y < min_y ) { min_y = y };
		if ( y > max_y ) { max_y = y };
	}

	for ( i=0; i<n_names; i++ ) {
		// Make everything zero-based
		im_embedding[ im_names[i] ][0] -= min_x;
		im_embedding[ im_names[i] ][1] -= min_y;

		// Scale
		im_embedding[ im_names[i]][0] *= (width-16)  / (2*max_x);
		im_embedding[ im_names[i]][1] *= (height-16) / (2*max_y);
	}

	// Define points over a grid
	var grid  = new Array( per_row * nrows );
	var taken = new Array( per_row * nrows );

	grididx = 0;
	for ( i=0; i<per_row; i++) {
		for ( j=0; j<nrows; j++) {
			grid[ grididx ] = [(i*32)+16, (j*32)+16]
				taken[ grididx ] = false;
			grididx++
		}
	}
	var gridTree = createKDTree( grid );

	// Make clones of grid and taken
	var subgrid  =  grid.slice(0);
	var subtaken = taken.slice(0);

	// Keep track of which images have been assigned to a spot on the grid
	all_assigned = false;
	for (i=0; i<total_images; i++) { assigned[i] = false; };

	while ( !all_assigned ) { // While there are points left to assign...

		// Create a kd-tree for fast nn
		var tree = createKDTree( subgrid )

			// Restructure the embedding so that it is gridified
			imcounter = 0;
		k = 100;

		outer1:
			for ( i=0; i<nrows; i++ ) {
				for ( j=0; j<per_row; j++ ) {

					if (imcounter >= total_images) {break outer1;}
					if (assigned[ imcounter ] ){ imcounter++; continue; }

					// Current embedding
					x = im_embedding[ im_names[imcounter] ][0];
					y = im_embedding[ im_names[imcounter] ][1];

					// Look for the 10 nearest neghbours in the grid
					nns = tree.knn( [x,y], k );

					// Traverse the nns and stick to the first one that is free
					for ( ii=0; ii<k; ii++ ) {

						// If this point has already been taken, move on.
						if ( subtaken[ nns[ii] ] ) { continue; }

						// Else we have to tag it in the grid structure. Get the actual coordinates there.

						// Assign the points for the embedding
						im_embedding[ im_names[imcounter] ] = subgrid[ nns[ii] ];

						// Find the index in the original grid
						idx = gridTree.nn( subgrid[nns[ii]] );

						taken[ idx ]        = true; // Mark it as taken globally
						subtaken[ nns[ii] ] = true; // Mark it as taken locally

						assigned[ imcounter ] = true; // Mark the image as assigned
						break;
					}

					imcounter++;

				} // for j<per_row
			} // for i<nrows

		n_unassigned = 0;
		for (i=0; i<total_images; i++) { if( !assigned[i] ){ n_unassigned++ }}

		all_assigned = n_unassigned == 0;

		// Make a subgrid with the points in the grid that have not been assigned
		subgrid = grid.slice(0);
		for (i=per_row * nrows; i>=0; i--) {
			if ( taken[i] ) {
				subgrid.splice(i, 1);
			}
		}
		subtaken = new Array( n_unassigned );
		for (i=0; i<n_unassigned; i++) { subtaken[i]=false; }


	} // while !all_assigned

	// Count how many images were assigned\
	assigned_points = new Array( total_images );
	assigned_names  = new Array( total_images );
	for (i=0; i<total_images; i++) {
		if (assigned[i]) {
			assigned_points[i] = im_embedding[ im_names[i]];
			assigned_names[i]  = im_names[i];
		} else {
			assigned_points[i] = [Number.MAX_VALUE, Number.MAX_VALUE];
		}
	}

	// Make a tree with the assigned points
	assignedTree = createKDTree( assigned_points );

	context.fillRect(0,0,width,height);

	imcounter = 0;
	outer2:
		for ( i=0; i<nrows; i++ ) {
			for ( j=0; j<per_row; j++ ) {

				if (imcounter >= total_images) {break outer2;}

				x = im_embedding[ im_names[imcounter] ][0] - 16;
				y = im_embedding[ im_names[imcounter] ][1] - 16;

				if( assigned[imcounter] ){
					/*** Draw with multiple resizes ***/
					// Load into external canvas -- down to 64x64
					octx.drawImage(image,
							j*imsize, i*imsize, // Read at this position in the tile
							imsize, imsize, // Read this much from the tile
							0,0, 64, 64);

					// Draw in the display canvas -- down to 32x32
					context.drawImage( oc,
							0, 0, 64, 64,
							x, y, 32, 32);

					context.strokeStyle='#000000';
					context.strokeRect(x, y, 32, 32);
					context.strokeRect(x, y, 32, 32);
				} else {
					context.strokeStyle='#ff0000';
				}

				imcounter++;
			}
		}

	s1.Stop();
	console.log('Rendering took ' + s1.ElapsedMilliseconds +  'ms' )
};

// Function that gets indices that sort an array.
// Inspired from http://stackoverflow.com/a/3730579/1884420
function sort_indices( the_array ) {
	// Create a temporary array with indices
	temp = [];
	for (var i in the_array) {
		temp.push([the_array[i], i]);
	}
	// Sor the original array
	temp.sort(function(left, right) {
		return left[0] > right[0] ? -1 : 1;
	});
	// Recover the indices
	var indices = [];
	for (var j in temp) {
		indices.push( Number( temp[j][1] ) );
	}
	return indices;
};

// === OVER FUNCTION. FIND AND HIGHLIGHT IN QUERIES ===
d3.select("#canvas").on("mousemove", function() {
	var mouse = d3.mouse(this);
	nn        = assignedTree.nn( mouse );
	highlighter( nn );
});

// === Function that highlights in the plots ===
function highlighter( nearest ) {

	if (nearest == undefined) {
		console.log( 'nearest is undefined :(' );
		return;
	}

	for (var i=0; i<g_similarities.length; i++) {
		ithsimilarities = g_similarities[i];
		var nsimilarities = ithsimilarities.length;

		// Find the image in the similarities
		for (var j=0; j<nsimilarities; j++) {

			if (nearest == ithsimilarities[j] ) {

				g_focus[i].attr("transform", "translate(" + g_xs[i](j) + "," + g_ys[i]( g_similarities_values[i][j] ) + ")");
				break
			}
			g_focus[i].attr("transform", "translate(" + -100 + "," + -100 + ")");
		}
	}
}

// === QUERY FUNCTION. GET DISTANCES. SORT. CREATE PLOT ===
d3.select("#canvas").on("mousedown", function() {

	nn = assignedTree.nn( d3.mouse(this ) );
	run_query( nn );
});

g_queries = [];

function run_query( nn ) {

	for (var i=0; i<g_queries.length; i++) {
		if ( g_queries[i] == nn ) {
			console.log('already queried' );
			return;
		}
	};

	g_queries.push( nn );

	// === COMPUTE THE RANKING ===
	// What is the image that we are hovering on?
	im_name = assigned_names[ nn ];
	console.log( im_name );

	// Get the feature of the image
	feat =  im_features[im_name];

	// Fill the distances with zeros
	var distances = Array.apply(null, Array(total_images)).map( Number.prototype.valueOf, 0);
	var d         = 4096; // Dimensionality of each feature

	// Compute a ranking frmo this feature to all the other images
	for (i=0; i<total_images; i++) {
		jth_feat = im_features[ im_names[i] ];
		for(j=0; j<d; j++) {
			distances[i] += feat[j] * jth_feat[j];
		}
	}
	// Get the sorting indices
	distances_srted_idx = sort_indices( distances );
	distances_srtd      = distances.slice(0);
	distances_srtd.sort( function(a,b){return b-a}); // sort max-to-min

	distances_srted_idx.shift();
	distances_srtd.shift();

	g_similarities.push( distances_srted_idx );
	g_similarities_values.push( distances_srtd );

	var data = [];
	for (var i=0; i<distances_srtd.length; i++ ) {
		data.push( {idx: Number(i), distance: distances_srtd[i]} );
	}


	// === CREATE A NEW DIV AND PUT THE IMAGE THERE
	var div = d3.select("#queries")
		.append("div")
		.attr('style', 'float:left');

	// Add the image

	var img = div.append('img')
		.attr('src','imgs/facespics_128/' + im_name)
		.attr('style', 'border:solid; float:left');

	var local_nn = nn;
	console.log(nn, local_nn);
	img.on("mousemove", function() {
		highlighter(local_nn);
	});

	// === NOW ACTUALLY DO THE PLOT
	var margin = {top: 10, right: 5, bottom: 8, left: 35},
	p_width = 790 - imsize - margin.left - margin.right,
	p_height = 70 - margin.top - margin.bottom;

	// Set the ranges
	var x = d3.scale.linear().range([0, p_width]);
	var y = d3.scale.linear().range([p_height, 0]);

	// Define the axes
	var xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(10);
	var yAxis = d3.svg.axis().scale(y).orient("left").tickValues([0, 0.25, 0.5, 0.75]);

	// Define the line
	var valueline = d3.svg.line()
		.x(function(d) { return x(d.idx); })
		.y(function(d) { return y(d.distance); });

	// Add a cute little close button
	div.append('span')
		.attr("class", "close")
		.html("x")

	// Add the svg canvas
	var svg = div
		.append("svg")
		.attr("width", p_width + margin.left + margin.right)
		.attr("height",p_height + margin.top + margin.bottom)
		.attr("style", "float: left")
		.append("g")
		.attr("transform",
				"translate(" + margin.left + "," + margin.top + ")");

	// Scale the range of the data
	x.domain(d3.extent(data, function(d) { return d.idx; }));
	y.domain( [0, 0.75] );

	g_xs.push( x );
	g_ys.push( y );

	var local_idx = q_idx; // Remember the index of this query.

	// Add the valueline path.
	var color = colorbrewer.Dark2[6][local_idx-1];
	svg.append("path")
		.attr("class", "line")
		.attr("style", 'stroke: ' + color)
		.attr("d", valueline(data));

	svg_summary.append("path")
		.attr("class", "line")
		.attr("style", 'stroke: ' + color)
		.attr("d", g_valueline(data));

	// Add the X Axis
	svg.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + p_height + ")")
		.call(xAxis);

	// Add the Y Axis
	svg.append("g")
		.attr("class", "y axis")
		.call(yAxis);

	// ADD THE FOCUS
	var focus = svg.append( "g" )
		.attr("class","focus")
		//.style("display","none");

	focus.append("circle").attr("r",4.5);
	g_focus.push( focus );

	// NOW ADD THE BRUSH
	var brush = d3.svg.brush()
		.x( x )
		.extent( g_extent )
		//.clamp( true )
		.on( "brush", function(){ brushed(local_idx)} ); // Pass local_idx by closure

	q_idx++;

	// Add the brush to the global observer
	g_brushes.push( brush );

	svg.append("g")
		.attr('id', 'brush' + local_idx)
		.attr('class', 'brush')
		.call( brush )
		.selectAll('rect')
		.attr('height', p_height);

	// CREATE THE CANVAS THAT EXPLORES THE QUERY
	var qcanvas = div
		.append("canvas")
		.attr("width", p_width + 40 )
		.attr("height", 64 )
		.attr("style", "float:left bottom")

	qcanvas.on("mousemove", function() {
		// Highlight in plot
		var mouse = d3.mouse( this );
		highlighter( g_similarities[ local_idx-1 ][ g_extent[0] + Math.floor( mouse[0] / 64 ) ] );
	});

	qcanvas.on("click", function() {
		var mouse = d3.mouse( this );
		var imidx = g_extent[0] + Math.floor( mouse[0] / 64 );
		//console.log( imidx );
		//console.log( imidx, im_names[ g_similarities[ local_idx-1 ][ imidx ]] );
		run_query( g_similarities[ local_idx-1 ][ imidx ] );

	});

	// DRAW THE RETRIEVED IMAGES
	qcontext   = qcanvas.node().getContext("2d");
	g_contexts.push( qcontext );

	redraw_queries( local_idx );
};

// Keep a list of all the brushes here

function brushed( idx ) {
	// Get the extent of the brush that is being updated.
	g_extent = g_brushes[ idx ].extent();
	g_extent = g_extent.map( Math.floor  );

	// Prevent brush resizing -- TODO ugly, still has handlers.
	g_extent[1] = g_extent[0] + g_domain;

	// Update the position of the other brushes
	for( var i=0; i<g_brushes.length; i++ ) {
		g_brushes[i].extent( g_extent );

		// Force them to repaint
		d3.select("#brush" + i).call( g_brushes[i] );

		if ( i != 0 ) {
			redraw_queries( i );
		}
	}
}

function redraw_queries( i ) {

	// for (var i=0; i<g_brushes.length; i++ ) {

	// Update the images
	qcontext = g_contexts[i-1];
	imcounter = 0;

	for (var j=g_extent[0]; j<=g_extent[1]; j++) {
		// Row and column in the tile
		idx = g_similarities[i-1][j];//distances_srted_idx[ i ];
		imrow = Math.floor( idx / per_row );
		imcol = ( idx % nrows );

		// Paint the images
		qcontext.drawImage( image,
				imcol*imsize, imrow*imsize, // Start reading here
				imsize, imsize, // Read this much
				imcounter*64, 0, 64, 64 );

		qcontext.strokeRect(imcounter*64, 0, 64, 64);

		imcounter++
	}
}

// ===  Stopwatch class (http://stackoverflow.com/a/1210765) === /
StopWatch = function() {
	this.StartMilliseconds   = 0;
	this.ElapsedMilliseconds = 0;
}

StopWatch.prototype.Start = function() {
	this.StartMilliseconds = new Date().getTime();
}

StopWatch.prototype.Stop = function() {
	this.ElapsedMilliseconds = new Date().getTime() - this.StartMilliseconds;
}
