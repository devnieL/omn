# omn [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url]
> An object mapping tool.

In a past software project, I implemented a feature where the data layer could be configured to use MongoDB or PostgreSQL as the system of records by setting only an environment variable, this is the distilled result; the objective is to have an standard `model` layer that could be used on different DBs with just a line of configuration, another core thing is to encourage the use of OOJS.

## Work in progress
- [ ] Basic support for MongoDB using `mongoose` as part of the adapter. (CRUD).
- [ ] Use a first version on my blog.
- [ ] Add `graphql` support dinamically for each class that uses `omn`.
- [ ] Publish on NPM as soon is successfully implemented on my blog.


## Notes

I'm planning to use `omn` on my other personal projects, and because it's part of a data layer, it's top priority.

## License

MIT © [devniel](http://devniel.com)


[npm-image]: https://badge.fury.io/js/omn.svg
[npm-url]: https://npmjs.org/package/omn
[travis-image]: https://travis-ci.org/devnieL/omn.svg?branch=master
[travis-url]: https://travis-ci.org/devnieL/omn
[daviddm-image]: https://david-dm.org/devnieL/omn.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/devnieL/omn
