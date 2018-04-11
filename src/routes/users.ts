import * as  Boom from 'boom';
import * as Joi from 'joi';
import * as JWT from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { Util } from '../util';

const mongoObjectId = ObjectId;

module.exports = [
    {  // Insert user profile
        method: 'POST',
        path: '/users',
        config: {
            auth: false,
            description: 'Insert user data',
            notes: 'Insert user data',
            tags: ['api'],
            validate: {
                payload: {
                    username: Joi.string().min(1).max(20).regex(/^[a-zA-Z0-9_.-]+/).required(),
                    password: Joi.string().min(1).max(100).regex(/^[a-zA-Z0-9]+/).required()
                        .description('password'),
                    type: Joi.string().valid(['admin', 'super-adim', 'staff']),
                },
            },
        },
        handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const payload = req.payload;
                // วันเวลาที่สร้าง
                payload.password = Util.hash(payload.password);
                // สถานะการใช้งาน
                payload.isUse = true;
                const insert = await mongo.collection('users').insert(payload);
                return ({
                    msg: 'OK',
                    statusCode: 200,
                });
            } catch (error) {
                return (Boom.badGateway(error));
            }
        },

    },
    {  // Select all user
        method: 'GET',
        path: '/users/{id?}',
        config: {
            description: 'Select all user ',
            notes: 'Select all user ',
            tags: ['api'],
            validate: {
                params: {
                    id: Joi.string().optional().description('id user'),
                },
            },
        }, handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const params = req.params;

                // Get info
                if (params.id === '{id}') { delete params.id; }
                const res = params.id
                    ? await mongo.collection('users').findOne({ _id: mongoObjectId(params.id) })
                    : await mongo.collection('users').find({ isUse: true }).toArray();

                return ({
                    data: res,
                    msg: 'OK',
                    statusCode: 200,
                });

            } catch (error) {
                return (Boom.badGateway(error));
            }
        },

    },
    {  // Login
        method: 'POST',
        path: '/login',
        config: {
            auth: false,
            description: 'Check login',
            notes: 'Check login',
            tags: ['api'],
            validate: {
                payload: {
                    password: Joi.string().min(1).max(100).regex(/^[a-zA-Z0-9]+/).required().description('password'),
                    username: Joi.string().min(1).max(20).regex(/^[a-zA-Z0-9_.-]+/).required(),
                },
            },
        },
        handler: async (req, reply) => {
            const mongo = Util.getDb(req);
            const payload = req.payload;
            payload.password = Util.hash(payload.password);
            try {
                const login = await mongo.collection('users').findOne({ username: payload.username, password: payload.password, isUse: true });
                if (login) {
                    delete login.password;
                    // login.iat = new Date().getTime();
                    const token = JWT.sign(login, Util.jwtKey(), { expiresIn: '1m' });
                    return ({
                        data: token,
                        message: 'Login success',
                        statusCode: 200,
                    });
                } else {
                    return (Boom.notFound('Invaild username or password'));
                }
            } catch (error) {
                return (Boom.badGateway(error));
            }
        },

    },
];
