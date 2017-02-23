# Introduction

Leafless is a new, **Zero Dependency** web framework written in es6, 
leveraging es6 generators and/or es7 async-await for better looking async functions, and expressive error handling.

# Installation
Its recommended to use Leafless is tested with node `v6.5.0` and above. However
**Async-Await** is only available on node `v7 --harmony`

```bash

$ npm install leafless
$ node app.js

```

# Hello World
use generator functions or async-await out of the box  

```js
var Leafless = require('leafless');
var app = new Leafless({});

app.route('/', class HomeHandler {
  *get(ctx) {
    let hello = yield Promise.resolve({hello: 'world'});
    return hello
  }
})
app.listen(3000)
```

### Hello World (Async-Await)
```js
var Leafless = require('leafless');
var app = new Leafless({});

app.route('/', class HomeHandler {
  async get(ctx) {
    let hello = await Promise.resolve({hello: 'world'});
    return hello
  }
})
app.listen(3000)
```

# Usage
## Leafless instance
you create a leafless instance by calling it's constructor, and providing the options
```js
  var Leafless = require('leafless');
  var options = {}
  var app = new Leafless(options);
```
### options
#### ssl/tls

set up https server by passing in an ssl object, that contains the key and certificate
```js
 let app = new Leafless({
  ssl: {
    key: fs.readFileSync('path_to_.key'),
    cert: fs.readFileSync('path_to.cert')
  }
 })
```
leafless will automatically run on https, if the ssl option is passed in  

## app.route(`path:string, handler:class`)
app.route sets up routing for your url paths  
 - **path** the first argument, can be `strings | string patterns | regular expressions`  
 - **handler** the second argument is class that implements http methods `(get | post | put... )` as generator or async functions  

 for example...  
 ```js
 class Handler {
   async get(ctx) {
      return ['cs101', 'phy204', 'lit403']
   }

   async post(ctx) {
     return 'use GET http method'
   }
 }

 app.route('/classes', Handler);
 ```

 - your methods should expect one argument **[ctx](#ctx)**


## ctx
the ctx object is passed as a parameter to the handler's methods

### ctx.getBody() -> Promise
yield or await this, to get the contents of the http body
 eg.  
 ```js
  class Handler {
    *post(ctx) {
      let body = yield ctx.getBody();
    }
  }
 ```
 - if the request content type is `application/json`, it's internally run through `JSON.parse` and the resulting object returned  

 - otherwise, the raw `Buffer` is returned

### ctx.params
contains url parameters
eg.
```js
  class Handler {
    *get(ctx) {
      let { name, id } = ctx.params;
      return `your name is ${name} and your id is ${id}`;
    }
  }

  app.route('/:name/:id', Handler);
```  

### ctx.query
contains the url query parameters
eg.  
if the requested url is `/?name=peter&id=1002`  
`ctx.query -> {name: "peter", id: 1002 }`


### ctx.setStatus(`status:number`)
set the Response http status

### ctx.getRequestHeaders()
returns the request headers

### ctx.setHeader(`key:string, value:string`)
set a http Response header

## app.static(`path:string, dir:string, options:object`)
Leafless ships with a built in static file server. To use it, provide  
 - the path to which to serve static files
 - the directory on the file system from which to server static files
 - options (optional)  

eg. `app.static('/static', 'public', {})`

## app.listen(`...`)
pass a port number to app.listen, to start the server