(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){


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

$(document).ready(function() {
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
			gridify_tsne();
		},
		dataType: "json"
	})
});

// We will load the big tile here
var image = new Image();

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
	console.log( im_names.length );

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

	// Define a grid
	var grid = new Array( per_row );
	for ( i=0; i<per_row; i++) {
		grid[i] = new Array( nrows );
	}



	// Draw points in a grid all along the canvas
	for ( i=0; i<nrows; i++ ) {
		for ( j=0; j<per_row; j++ ) {
			grid[i][j] = i*32, j*32;
			context.strokeRect( j*32, i*32, 32, 32 );
			context.strokeRect( (j*32)+16, (i*32)+16, 2, 2);
		}
	}

	imcounter = 0;
	for ( i=0; i<nrows; i++ ) {
		for ( j=0; j<per_row; j++ ) {

			if (imcounter-1 > total_images) {break;}

			x = im_embedding[ im_names[imcounter] ][0] - 0;
			y = im_embedding[ im_names[imcounter] ][1] + 0;


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

			/*** Draw with a single resize
			context.drawImage( image,
				j*imsize, i*imsize, // Read at this position in the tile
				imsize, imsize,     // Read this much from the tile
				x, y, 32, 32); **/

			context.lineWidth=1;
			context.strokeRect(x, y, 32, 32);

			imcounter++;
		}
	}

	console.log( im_embedding )
	s1.Stop();
	console.log('Rendering took ' + s1.ElapsedMilliseconds +  'ms' )
};

image.src = 'imgs/facespics_128/bigtile.jpg';

// Create fisheye distortions for x and y coordinates
function mousemove() {
	var mouse = d3.mouse(this);
	//render();
}

// Add a mouse listener to the canvas
d3.select("#canvas")
	.on("mousemove", mousemove);

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

},{}]},{},[1]);
