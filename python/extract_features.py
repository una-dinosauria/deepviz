
import numpy as np
import caffe
import h5py

import image_resizer

import os, sys, glob


imdir    = '../imgs/facespics-bak/';
imfname  = 'images.csv';

# Set up the network
net = caffe.Net('models/VGG_ILSVRC_16_layers_deploy.prototxt',
                'models/VGG_ILSVRC_16_layers.caffemodel',
                caffe.TEST);

# Create a data transformer (preprocessor)
transformer = caffe.io.Transformer( {'data': net.blobs['data'].data.shape} );
transformer.set_transpose('data', (2,0,1));
transformer.set_mean('data', np.array([103.939, 116.779, 123.68])) # mean pixel
transformer.set_raw_scale('data', 255)  # the reference model operates on images in [0,255] range instead of [0,1]
transformer.set_channel_swap('data', (2,1,0))

net.blobs['data'].reshape(1,3,224,224)

# Count how many images are there and save the names to a textfile
nimages = 0;

with open( imfname, 'w') as csvfile:
  for fname in os.listdir( imdir ):
    if fname.endswith(".jpg") or fname.endswith(".png"):

      # Increase the counter
      nimages = nimages + 1;

      # Write the name to the csv file
      csvfile.write( fname + '\n' );


# Make space for the features
features = np.zeros( (4096, nimages) );

imcounter = 0;

with open( imfname, 'r' ) as myfile:
    data = myfile.readlines();

# Go through all the images in the directoryi
for fname in data:
  fname = fname.strip();
  if fname.endswith(".jpg") or fname.endswith(".png") :

    im = caffe.io.load_image( imdir + fname );
    net.blobs['data'].data[...] = transformer.preprocess('data', im );

    print('Working on image {0} / {1}'.format( imcounter+1,  nimages ) );
    out = net.forward();

    features[:, imcounter] = np.squeeze( net.blobs['fc7'].data );
    imcounter = imcounter + 1;

    print('Predicted class is #{}.'.format(out['prob'][0].argmax()))

# Save the features to an h5 file
h5f = h5py.File('vgg_features.h5', 'w')
h5f.create_dataset('features', data=features)
h5f.close()
