# fms

[![Build Status](https://travis-ci.org/f/f.png?branch=master)](https://travis-ci.org/f/f)

> test

## About
This is a FileMaker Adapter for feathers.js. It makes it trivial to create a feathers service for any FileMaker Layout.  For non FileMaker people, a layout is a Table with a defined set of fields, and related records

This currently passes all but two tests in the feathers-service-test suite. There is not an easy way to do a a true POST, which would require nulling fields. we just do a PATCH instead. We also do not support the $in and $nin query filters.  We may in the future.

Support for $or is limited. Only single fields will work.

## License

Copyright Todd geist(c) 2016

Licensed under the [MIT license](LICENSE)
