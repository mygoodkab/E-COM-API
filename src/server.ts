
import * as Hapi from 'hapi';
import * as HapiAuth from 'hapi-auth-jwt2';
import * as hapiMongodb from 'hapi-mongodb';
import * as hapiRouter from 'hapi-router';
import * as hapiSwagger from 'hapi-swagger';
import * as inert from 'inert';
import * as path from 'path';
import * as vision from 'vision';
import { Util } from './util';
import { config } from './config';

// tslint:disable:max-line-length no-console no-var-requires
//const config = require('./config.json');
// tslint:disable-next-line:no-var-requires
const Pack = require('./../package');
const optionsSwagger = {
    auth: false,
    info: {
        title: 'API Documentation',
        version: Pack.version,
    },
    securityDefinitions: {
        jwt: {
            type: 'apiKey',
            name: 'Authorization',
            in: 'header'
        }
    },
    security: [{ jwt: [] }]
};
// Config Mongodb
const optionsMongo = {
    decorate: true,
    settings: {
        poolSize: 10,
    },
    url: 'mongodb://' + config.mongodb.address + ':' + config.mongodb.port,
};
// Route to route file
const optionAutoRoute = { routes: path.join('dist', 'routes', '*.js') };
// create new server instance
const server = new Hapi.Server({
    port: config.hapi.port,
    routes: {
        cors: true,
    },
});

// register plugins, wrapped in async/await
async function liftOff() {
    try {
        await server.register([
            {
                plugin: HapiAuth,
            },
            {
                options: optionsMongo,
                plugin: hapiMongodb,
            },
            {
                plugin: vision,
            },
            {
                plugin: inert,
            },

            {
                options: optionAutoRoute,
                plugin: hapiRouter,
            },
            {
                options: optionsSwagger,
                plugin: hapiSwagger,
            },

        ]);
        await server.auth.strategy('jwt', 'jwt', {
            key: Util.jwtKey(),
            validate,
            verifyOptions: { maxAge: config.token.timeout },
        });
        // Event 'request'
        await server.events.on('request', (request: any, event: any, tags: any) => {
            if (tags.error) {
                // tslint:disable-next-line:no-console
                console.log(`Request ${event.request} error: ${event.error ? event.error.message : 'unknown'}`);
            }
        });
        // Event 'respones'
        await server.events.on('response', (request: any) => {
            console.log(`IP Address : ${request.info.remoteAddress} ${request.method.toUpperCase()} ${request.url.path} | Status code : ${request.response.statusCode} | Respond Time : ${(request.info.responded - request.info.received)} ms`);
        });
        await server.auth.default('jwt');
        await server.start();
        console.log('Server running at:', server.info.uri);
    } catch (err) {
        console.log(err);
    }

}
liftOff();

// create validate for jwt
function validate(decoded, request, callback) {
    if (decoded) {
        return { isValid: true };
    } else {
        return { isValid: false };
    }
}
