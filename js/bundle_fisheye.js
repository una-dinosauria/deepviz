(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

// var pica = require('pica')

// TODO this should somehow come from an external file
// Global variables
var imsize = 128; // Size of images in the tile

var width  			 = 28*32,
		height 			 = 28*32,
		imageWidth 	 = 32,
		imageHeight  = 32,
    xSteps       = d3.range(0, width, 32),
    ySteps       = d3.range(0, height, 32),
		total_images = 836,   // total images in the big tile
		per_row      = Math.ceil(Math.sqrt( 836 )),   // images per row in the big tile
		nrows        = Math.ceil(Math.sqrt( 836 ));     // total number of rows in the big tile

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

// We will load the big tile here
var image = new Image();

// Draw images with size of 32 x 32. We want 28x28 images on each side.
function render() {
  var s1 = new StopWatch();
  s1.Start();

  imcounter = 0;
  //context.clearRect(0,0,32*28,32*28);

	for ( i=0; i<nrows; i++ ) {
		for ( j=0; j<per_row; j++ ) {

			if (imcounter-1 > total_images) {break;}

      /*** Draw with multiple resizes ***/
      /**
      // Load into external canvas -- down to 64x64
      octx.drawImage(image,
        j*imsize, i*imsize, // Read at this position in the tile
        imsize, imsize, // Read this much from the tile
        0,0, 64, 64);

      // Draw in the display canvas -- down to 32x32
      context.drawImage( oc,
        0, 0, 64, 64,
        (imcounter%28)*32, Math.floor(imcounter/28)*32, 32, 32 );

      /*** Draw with a single resize ***/
      x1 = xFisheye( (imcounter%28)*32 );
      x2 = xFisheye( (imcounter%28)*32 + 32);
      y1 = yFisheye(Math.floor(imcounter/28)*32);
      y2 = yFisheye(Math.floor(imcounter/28)*32 + 32);


      if( (x2-x1) > (y2-y1) ) {

        r = (y2-y1) / (x2-x1); // The difference ratio

        imcenter  = i*imsize + (imsize/2);
        read_from = imcenter - (r/2)*imsize;
        read_to   = imcenter + (r/2)*imsize;

        context.drawImage( image,
          j*imsize, read_from,
          imsize,   read_to - read_from,
          x1, y1, x2-x1, y2-y1 );

      } else {

        r = (x2-x1) / (y2-y1); // The difference ratio

        imcenter  = j*imsize + (imsize/2);
        read_from = imcenter - (r/2)*imsize;
        read_to   = imcenter + (r/2)*imsize;

        context.drawImage( image,
          read_from, i*imsize,
          read_to - read_from,   imsize,
          x1, y1, x2-x1, y2-y1 );
      }

      // context.drawImage( image,
      //   j*imsize, i*imsize,
      //   imsize, imsize,
      //   x1, y1, x2-x1, y2-y1);

			// Draw a rectangle around each image
			context.lineWidth=1;
      context.strokeRect(x1, y1, x2-x1, y2-y1);

			imcounter++;
		}
	}

  s1.Stop();
  console.log('Rendering took ' + s1.ElapsedMilliseconds +  'ms' )
}

image.onload = function() {
  render();
};
image.src = 'imgs/facespics_128/bigtile.jpg';

// Create fisheye distortions for x and y coordinates
var fisheye_distortion = 2;
$("#slide").on("input change", function() {
  fisheye_distortion = this.value;
  //xFisheye.focus( width / 2 );
  //yFisheye.focus( height / 2 );
  xFisheye.distortion( fisheye_distortion );
  yFisheye.distortion( fisheye_distortion );
  render();
});

var xFisheye = d3.fisheye
  .scale(d3.scale.identity)
  .domain([0, width])
  .focus(16*28)
  .distortion( fisheye_distortion );
var yFisheye = d3.fisheye
  .scale(d3.scale.identity)
  .domain([0, height])
  .focus(16*28)
  .distortion( fisheye_distortion );

function mousemove() {
  var mouse = d3.mouse(this);
  xFisheye.focus(mouse[0])
  yFisheye.focus(mouse[1])
  render();
}
// Add a mouse listener to the canvas
d3.select("#canvas")
  .on("mousemove", mousemove);

// d3.timer(render);

/*** Stopwatch "class." (from http://stackoverflow.com/a/1210765) ***/
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
