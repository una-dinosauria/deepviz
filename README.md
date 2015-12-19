## Deepviz: A tool for quick inspection of deep visual similarities

This is a tool to visualize the similarities captured by deep learning features on small datasets of up to ~1000 images.

I finished this project in December 2015 as the final project of the 
[CSPC 547 -- Infoviz](http://www.cs.ubc.ca/~tmm/courses/547-15/) course taught by
[Tamara Munzner](https://www.cs.ubc.ca/~tmm/) at the [University of British Columbia](https://www.cs.ubc.ca/).

## Roadmap

* `/python` contains code for data gathering (i.e., downloading images from twitter using 
[tweepy](https://github.com/tweepy/tweepy)) and computing deep features using [Caffe](http://caffe.berkeleyvision.org/).
* `/js` contains the bulk of the javascript code that runs the interface.

## Compiling

To compile the code install the dependencies and generate the bundle using [browserify](http://browserify.org/):

```bash
cd js/
npm install -g browserify
npm install -i static-kdtree
browserify main.js -o bundle.js
```

## Using your own dataset
The code works out of the box for a dataset compiled from the twitter account [Faces in things](https://twitter.com/facespics).
If you want to use your own dataset you will have to generate the low-dimensional with a working implementation of
[t-SNE](https://lvdmaaten.github.io/tsne/).

## Licence
MIT
