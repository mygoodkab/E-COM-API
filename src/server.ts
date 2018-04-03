
import * as Hapi from 'hapi';
import * as hapiMongodb from 'hapi-mongodb';
import * as HapiAuth from 'hapi-auth-jwt2';
import * as hapiSwagger from 'hapi-swagger';
import * as hapiRouter from 'hapi-router';
import * as inert from 'inert';
import * as vision from 'vision';
import * as path from 'path';
import { Util } from './util';
const config = require('./config.json')
const Pack = require('./../package');
const optionsSwagger = {
    auth: false,
    info: {
        'title': 'API Documentation',
        'version': Pack.version
    }
};
// Config Mongodb
const optionsMongo = {
    url: 'mongodb://' + config.mongodb.address + ':' + config.mongodb.port,
    settings: {
        poolSize: 10
    },
    decorate: true
}
// Route to route file
const optionAutoRoute = { routes: path.join('dist', 'routes', '*.js') };
// create new server instance
const server = new Hapi.Server({
    port: config.hapi.port
})
// create validate for jwt
function validate(decoded, request, callback) {
    return { isValid: true }
}
// register plugins, wrapped in async/await
async function liftOff() {
    try {
        await server.register([
            {
                plugin: HapiAuth
            },
            {
                plugin: hapiMongodb,
                options: optionsMongo
            },
            {
                plugin: vision
            },
            {
                plugin: inert
            },

            {
                plugin: hapiRouter,
                options: optionAutoRoute
            },
            {
                plugin: hapiSwagger,
                options: optionsSwagger
            }

        ])
        await server.auth.strategy('jwt', 'jwt', {
            key: Util.jwtKey(),
            validate: validate,
            verifyOptions: { ignoreExpiration: true }
        });
        // Event 'request' 
        await server.events.on('request', (requestL: any, event: any, tags: any) => {
            if (tags.error) {
                console.log(`Request ${event.request} error: ${event.error ? event.error.message : 'unknown'}`);
            }
        });
        // Event 'respones'
        await server.events.on('response', (request: any) => {
            console.log("IP Address : "+ request.info.remoteAddress + ' | ' + request.method.toUpperCase() + ' ' + request.url.path + ' | Status code : ' + request.response.statusCode + ' | Respond Time : ' + (request.info.responded - request.info.received) + ' ms');
        });

        await server.auth.default('jwt');
        await server.start()
        console.log('Server running at:', server.info.uri);
    }
    catch (err) {
        console.log(err)
    }

}
liftOff()
