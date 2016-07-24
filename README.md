# leafless
LeafLess is a lite Web Framework, with built in generator coroutines for easy async in your routes

### Installation
`npm install --save leafless`

### Quick Usage
```javascript
// require leafless
let LL = require('leafless');

// create a new leafless instance
let app = new LL();

// create your route handlers

//the home handler
app.route('/', class HomeHandler {
    // the http methods should be generator functions, or a function that returns an iterable
    *get(ctx) {
        return 'Hello World'
    }
});

// posts handler
class PostsHandler {
    // fetch post with given id
    *get(ctx) {
        
        try {
            let id = ctx.params.id
            if (id !== undefined) {
                // the function getPostFromDB returns a Promise
                let post = yield getPostFromDB(id);

                return { // will be sent to client as application/json
                    title: post.title,
                    body: post.body
                }
            } else {
                let posts = yield getAllPostsFromDB()
                return posts;
            }
        } catch (e) {
            return { error: 'oops! something happened'}
        }
    
    // save post with given id to db
    *post(ctx) { 
        // get the http POST body
        let post = yield ctx.getBody();
        
        // yielding promises makes it easy to write async code
        let sanitizedPost = yield sanitizePost(post);
        let saved = yield savePosttoDB(sanitizedPost);
        
        return {
            postId = saved.id;
        }
    }
}

app.route('/posts', PostsHandler);
app.route('/posts/:id', PostsHandler);

// start the server
app.listen(3000);
```
