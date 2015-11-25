
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
      //**
      // context.drawImage( image,
      //   j*imsize, i*imsize,
      //   imsize, imsize,
      //   (imcounter%28)*32, Math.floor(imcounter/28)*32,
      //   32, 32 );
      //**/

      context.drawImage( image,
        j*imsize, i*imsize,
        imsize, imsize,
        xFisheye( (imcounter%28)*32 ), yFisheye(Math.floor(imcounter/28)*32),
        xFisheye( (imcounter%28)*32 + 32) - xFisheye((imcounter%28)*32),
        yFisheye(Math.floor(imcounter/28)*32 + 32) - yFisheye(Math.floor(imcounter/28)*32));

			// Draw a rectangle around each image
			context.lineWidth=1;
      context.strokeRect(
				xFisheye((imcounter%28)*32), yFisheye(Math.floor(imcounter/28)*32),
        xFisheye( (imcounter%28)*32 + 32) - xFisheye((imcounter%28)*32),
        yFisheye(Math.floor(imcounter/28)*32 + 32) - yFisheye(Math.floor(imcounter/28)*32));

			imcounter++;
		}
	}

  s1.Stop();
  console.log('Rendering took ' + s1.ElapsedMilliseconds +  'ms' )
}

// function render() {
//   // Draw the columns
//   for( i=0; i<=28; i++) {
//     context.beginPath();
//     context.moveTo(xFisheye(i*32), 0);
//     context.lineTo(xFisheye(i*32), height);
//     context.stroke();
//     console.log("rendering at " + xFisheye(i*32))
//   }
//
//   // Draw the rows
//   for( i=0; i<=28; i++) {
//     context.beginPath();
//     context.moveTo(0,     yFisheye(i*32));
//     context.lineTo(width, yFisheye(i*32));
//     context.stroke();
//     console.log("rendering at " + yFisheye(i*32))
//   }
// }



image.onload = function() {
  render();
};
image.src = 'imgs/facespics_128/bigtile.jpg';

// Create fisheye distortions for x and y coordinates
var xFisheye = d3.fisheye.scale(d3.scale.identity).domain([0, width]).focus(16*28);
    yFisheye = d3.fisheye.scale(d3.scale.identity).domain([0, height]).focus(16*28);

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
