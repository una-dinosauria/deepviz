
from __future__ import division
from PIL import Image
import os, sys, glob

# Final size of the image
imsize = (224, 224)

# Return a central crop of an image
def central_crop( im, w, h ):

	minsize = min( w, h )
	if minsize == w:
		# left, upper, right, lower
		im = im.crop( (0, int(h/2 - w/2), w, int(h/2 + w/2)) );
	else:
		im = im.crop( ( int(w/2 - h/2), 0, int(w/2 + h/2), h) );

	return im


# Crops and resize an image
def crop_and_resize( fname ):
	try:
		im = Image.open( fname )
		w, h = im.size

		# Take a central crop and resize
		im = central_crop( im, w, h );
		im = im.resize( imsize, Image.BICUBIC );

	except Exception,e:
		print str(e)

	return im


# Resizes all the images in a directory
def resize_dir( imdir ):

	# TODO hardcoded a jpg ending for images
	for fname in os.listdir( imdir ):
		if fname.endswith(".jpg") or fname.endswith(".png"):
			print( imdir + fname )
			im = crop_and_resize( imdir + fname );
			im.save( imdir + fname );
