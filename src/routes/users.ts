import * as  Boom from 'boom'
import { Util } from '../util';
import * as Joi from 'joi'
import * as JWT from 'jsonwebtoken';
const mongoObjectId = require('mongodb').ObjectId;

module.exports = [
    {  // Insert user profile
        method: 'POST',
        path: '/users/insert',
        config: {
            auth: false,
            tags: ['api'],
            description: 'Insert user data',
            notes: 'Insert user data',
            validate: {
                payload: {
                    username: Joi.string().required(),
                    password: Joi.string().required(),
                    type: Joi.string()
                }
            }
        },
        handler: async (request, reply) => {
            try {
                const mongo = Util.getDb(request)
                let payload = request.payload
                payload.password = Util.hash(payload.password)
                console.log(payload)
                let insert = await mongo.collection('users').insert(payload)
                return ({
                    statusCode: 200,
                    msg: "OK"
                })
            } catch (error) {
                return (Boom.badGateway(error))
            }

        }
    },
    {  // Select all user
        method: 'GET',
        path: '/users',
        config: {
            auth:false,
            tags: ['api'],
            description: 'Select all user ',
            notes: 'Select all user '
        },
        handler: async (request, reply) => {
            const mongo = Util.getDb(request)
            try {
                let select = await mongo.collection('users').find().toArray()
                return ({
                    statusCode: 200,
                    msg: "OK",
                    data: select
                })
            } catch (error) {
                return (Boom.badGateway(error))
            }

        }
    },
    {  //login
        method: 'POST',
        path: '/login',
        config:
            {
                auth: false,
                tags: ['api'],
                description: 'Check login',
                notes: 'Check login',
                validate: {
                    payload: {
                        username: Joi.string().required(),
                        password: Joi.string().required(),
                    }
                }
            },
        handler: async (request, reply) => {
            let mongo = Util.getDb(request)
            let payload = request.payload
            payload.password = Util.hash(payload.password)
            try {
                const login = await mongo.collection('users').findOne({ username: payload.username, password: payload.password })
                if (login) {
                    delete login.password
                    const token = JWT.sign(login, Util.jwtKey())
                    return ({
                        statusCode: 200,
                        message: "Login success",
                        data: login,
                        token: JWT.sign(login, Util.jwtKey())
                    })
                } else {
                    return (Boom.notFound("Invaild username or password"))
                }
            } catch (error) {
                return (Boom.badGateway(error))
            }

        }
    }
] 