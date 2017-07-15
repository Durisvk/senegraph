# Senegraph

### HapiJS plugin connecting SenecaJS and GraphQL:

Do you like **Microservices**?
Do you like **GraphQL**?

Me too! Let me then propose this simple plugin for *HapiJS* and *Express Middleware* to you. It's fairly simple and flexible tool for creating API endpoints.

### Installation:
```
npm install --save senegraph
```

### Usage:

##### HAPI JS :
Here is a simple setup for *HapiJS*:

```javascript
import * as hapi from 'hapi';
import { senegraphHapi, hapiql } from 'senegraph';

// setup Hapi server
const server = new hapi.Server();
server.connection({ port: 3000 });

// register the plugins
server.register([{
    register: senegraphHapi,
    options: senegraphOptions,
}, {
    register: hapiql,
    options: {
        path: '/graphiql' // Optional default '/graphiql'
        hapiqlOptions: {
            endpointURL: '/graphql', // required - pointing to the graphQL route
        },
    },
}], (err) => {
    if(err) {
        throw err;
    }
    server.start((error) => {
        if (error) {
          throw error;
        }
        server.log('info', `Server running at: ${server.info.uri}`);
    });
});
```

Now the `senegraphOptions` variable can look like this:

```javascript
const senegraphOptions = {
    // Setting up the seneca microservices
    setupSeneca: (seneca) => {
        // we can return a promise if we need it
        // to wait for some async operation
        seneca.add({ role: 'greeter', cmd: 'sayHello' }, (message, done) => {
            if(message.user) {
                done(null, { message: 'Hello ' + message.user });
            } else {
                done(new Error('You forgot to tell me who you are'));
            }
        });
    },
    // Setting up the schema (for this example it's pretty simple
    // but you can for example split it into multiple modules
    schema: `
        type Query {
            hello(name: String!): String
        }
    `,
    resolvers: {
        Query: {
            // third argument is context, which contains
            // the seneca that we can use for our purpose
            hello: (root, { name }, { seneca }) => {
                // we need to use promise
                // but we could use bluebird's Promisify
                // on seneca, check the links below
                return new Promise((resolve, reject) => {
                    seneca.act({
                        role: 'greeter',
                        cmd: 'sayHello',
                        user: name,
                    }, (err, greetings) => {
                        if(err) {
                            reject(err);
                        } else {
                            resolve(greetings.message);
                        }
                    });
                });
            }
        }
    }
}
```

To split the schema and/or resolvers into multiple modules take a look at this:
http://dev.apollodata.com/tools/graphql-tools/generate-schema.html#modularizing

To modularize SenecaJS into multiple files take a look at this:
http://jakepruitt.com/2015/02/09/beginners-guide-to-seneca-js.html

To promisify seneca take a look at this:
http://senecajs.org/docs/tutorials/seneca-with-promises.html

-----------------

What if you need to make action for every request called upon your `graphql`
endpoint? What if you need to provide some additional context and/or root value
for your resolvers?

Here's how you do that:

```javascript
  const senegraphOptions = {
    schema: mySchema,
    resolvers: {
      Query: {
        hello: ({ myRootData }, args, { seneca, myContextData }) => {
          // use myRootData and myContextData
          return 'world';
        }
      }
    },
    // This function is called before every request
    // on your graphql endpoint:
    perRequest: (seneca) => {
      // It can either return a value or a Promise
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            // returns context used in the next graphql call
            context: { myContextData: 'random data1' },
            rootValue: { myRootData: 'random data2' },
          });
        }, 200);
      });
    }
  }
```

cool isn't it? You can do for example authentication on every single request.

## API

**SenegraphHapi options:**

|    schema   |                              String!                             |                                       Containing the schema as string. This option is required.                                       |
|:-----------:|:----------------------------------------------------------------:|:-------------------------------------------------------------------------------------------------------------------------------------:|
|  resolvers  |                              Object!                             |                               Containing the resolvers of your graphql schema. This option is required.                               |
| setupSeneca |                      Function (seneca) => {}                     |                                       Is being called at the beginning. This option is optional.                                      |
|     path    |                              String                              |                                Default: '/graphql', Sets the API endpoint url. This option is optional                                |
|   methods   |                    Array ['GET', 'POST', ...]                    |                      Default: ['GET', 'POST'], Sets the method accepted by the endpoint. This option is optional                      |
|  perRequest | Promise<Object> OR Function<Object> OR Function<Promise<Object>> | Is being called on every request. Can be Promise or function returning object or function returning  Promise. This option is optional |


+ You can add a senecaOptions to modify the logging or so.

Check out this video: https://youtu.be/VWPVrJU2upw


##### EXPRESS :

```js
import * as Express from 'express'
import { senegraphExpress, expressiql }

const app = Express();

app.use('/graphql', senegraphExpress(senegraphOptions));
app.use('/graphiql', expressiql({ endpointURL: '/graphql' }));

app.listen(3000)
```

Now the senegraphOptions could look the same as in Hapi example...

## API

**SenegraphExpress Options:**

|    schema   |                              String!                             |                                       Containing the schema as string. This option is required.                                       |
|:-----------:|:----------------------------------------------------------------:|:-------------------------------------------------------------------------------------------------------------------------------------:|
|  resolvers  |                              Object!                             |                               Containing the resolvers of your graphql schema. This option is required.                               |
| setupSeneca |                      Function (seneca) => {}                     |                                       Is being called at the beginning. This option is optional.                                      |
|  perRequest | Promise<Object> OR Function<Object> OR Function<Promise<Object>> | Is being called on every request. Can be Promise or function returning object or function returning  Promise. This option is optional |


+ You can add a senecaOptions to modify the logging or so.
