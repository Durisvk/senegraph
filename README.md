# Senegraph

### HapiJS plugin connecting SenecaJS and GraphQL:

Do you like **Microservices**?
Do you like **GraphQL**?

Me too! Let me then propose this simple plugin for *HapiJS* to you. It's fairly simple and flexible tool for creating API endpoints.

### Installation:
```
npm install --save senegraph
```

### Usage:

Here is a simple setup for *HapiJS*:

```javascript
import * as hapi from 'hapi';
import { senegraph, hapiql } from 'senegraph';

// setup Hapi server
const server = hapi.Server();
server.connection({ port: 3000 });

// register the plugins
server.register([{
    register: senegraph,
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
                done(new Error('You forgot to tell me who you are');
        });
    }
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
