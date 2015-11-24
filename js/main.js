
var pica = require('pica')

// TODO this should somehow come from an external file
// Global variables
var width  			 = 28*32,
		height 			 = 28*32,
		imageWidth 	 = 32,
		imageHeight  = 32,
		total_images = 837,   // total images in the big tile
		can_fit      = 28*28, // total number of images we can fit in the canvas
		per_row      = Math.floor(65500/128),   // images per row in the big tile
		nrows        = 4;     // total number of rows in the big tile

var base = d3.select("#vis");

// Add an external canvas for cascaded resizing
var oc = document.createElement('canvas'),
    octx = oc.getContext('2d');
  oc.width  = 128;
  oc.height = 128;

// Add a canvas
var chart = base.append("canvas")
  .attr( "width", width)
  .attr("height", height);

var context = chart.node().getContext("2d");

// We will load the big tile here
var image = new Image();

// Draw images with size of 32 x 32. We want 28x28 images on each side.
image.onload = function() {

	imcounter = 0;

	for ( i=0; i<nrows; i++ ) {
		for ( j=0; j<per_row; j++ ) {

			if (imcounter-1 > total_images) {break;}

      /*** Draw with multiple resizes ***/
      // Load into external canvas -- down to 128x128
      octx.drawImage(image,
        j*128, i*128, 128, 128,
        0,0, 128, 128);

      // Down to 64x64
      octx.drawImage( oc, 0, 0, 64, 64);
			//octx.drawImage( oc, 0, 0, 128, 128, 0, 0,  64, 64);

      // Draw in the display canvas -- down to 32x32
      context.drawImage( oc,
        0, 0, 64, 64,
        (imcounter%28)*32, Math.floor(imcounter/28)*32, 32, 32 );

      /*** Draw with a single resize ***/
      // context.drawImage( image,
      //   j*128, i*128, 128, 128,
      //   (imcounter%28)*32, Math.floor(imcounter/28)*32, 32, 32 );

			// Draw a rectangle around each image
			context.lineWidth=1;
      context.strokeRect(
				(imcounter%28)*32, Math.floor(imcounter/28)*32, 32, 32);


			imcounter++;
		}
	}
}; // image.onload
image.src = 'imgs/facespics_128/bigtile.jpg';


// // Create an in memory only element of type 'custom'
// var detachedContainer = document.createElement("custom");
//
// // Create a d3 selection for the detached container. We won't
// // actually be attaching it to the DOM.
// var dataContainer = d3.select(detachedContainer);
//
// // Function to create our custom data containers
// function drawCustom(data) {
//   var scale = d3.scale.linear()
//     .range([10, 390])
//     .domain(d3.extent(data));
//
//   var dataBinding = dataContainer.selectAll("custom.rect")
//     .data(data, function(d) { return d; });
//
//   dataBinding
//     .attr("size", 8)
//     .transition()
//     .duration(1000)
//     .attr("size", 15)
//     .attr("fillStyle", "green");
//
//   dataBinding.enter()
//       .append("custom")
//       .classed("rect", true)
//       .attr("x", scale)
//       .attr("y", 100)
//       .attr("size", 8)
//       .attr("fillStyle", "red");
//
//   dataBinding.exit()
//     .attr("size", 8)
//     .transition()
//     .duration(1000)
//     .attr("size", 5)
//     .attr("fillStyle", "lightgrey");
// }
//
// // Function to render out to canvas our custom
// // in memory nodes
// function drawCanvas() {
//
//   // clear canvas
//   context.fillStyle = "#fff";
//   context.rect(0,0,chart.attr("width"),chart.attr("height"));
//   context.fill();
//
//   // select our dummy nodes and draw the data to canvas.
//   var elements = dataContainer.selectAll("custom.rect");
//   elements.each(function(d) {
//     var node = d3.select(this);
//
//     context.beginPath();
//     context.fillStyle = node.attr("fillStyle");
//     context.rect(node.attr("x"), node.attr("y"), node.attr("size"), node.attr("size"));
//     context.fill();
//     context.closePath();
//
//   })
// }
//
// d3.timer(drawCanvas);
// drawCustom([1,2,13,20,23]);
// drawCustom([1,2,12,16,20]);
