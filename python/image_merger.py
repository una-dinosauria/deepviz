
from PIL import Image
import numpy as np
import os

# Get all the images from a directory and make a
# single big picture out of them.

dirname = '../imgs/FacesPics/';
fnames = os.listdir( dirname );

# Each image must already have this size
imsize = 224;

totalimgs = 0;

# Count all the images in the folder
for f in fnames:
	# Skip if not an image
	if not f.endswith('png') and not f.endswith('jpg'):
		continue

	totalimgs = totalimgs + 1;

print( 'There are {0} images in total'.format( totalimgs ) );

# Create a large array to put the images in
bigtile = np.zeros( (imsize, imsize*totalimgs, 3), dtype=np.uint8 );
imcounter = 1;

# Loop through the images again
for f in fnames:
	# Skip if not an image
	if not f.endswith('png') and not f.endswith('jpg'):
		continue

	# Read the image
	im = Image.open( dirname + f );
	im = np.asarray( im, dtype="uint8" )

	print( 'Working on image {0}: {1}, size {2}'.format( imcounter, f, im.shape ) );

	bigtile[:, imsize*(imcounter-1):imsize*imcounter, 1:3 ] = im[:,:,1:3];
	imcounter = imcounter + 1;
	#if imcounter == 11:
	#	break;

# Keep only the images that we actually read
bigtile = bigtile[:, 1:(imcounter-1)*imsize, :];

#Save the numpy array as a big image
im = Image.fromarray( bigtile );
im.save("bigtile.png");

