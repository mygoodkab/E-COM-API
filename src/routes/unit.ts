import * as  Boom from 'boom';
import * as Joi from 'joi';
import * as JWT from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { Util } from '../util';
import { config } from '../config';
const mongoObjectId = ObjectId;

module.exports = [
    {  // GET Unit
        method: 'GET',
        path: '/unit/{id?}',
        config: {
            auth: false,
            description: 'Get Unit',
            tags: ['api'],
            validate: {
                params: {
                    id: Joi.string().optional().description('id unit'),
                },
            },
        }, handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const params = req.params;
                const find: any = { isUse: true, };
                // GET  Unit Info
                let res;
                // GET log
                if (params.id === '{id}') { delete params.id; }
                if (params.id) { find._id = mongoObjectId(params.id); }

                res = await mongo.collection('unit').find(find).toArray();

                for (const key in res) {
                        res[key].unitLog = await mongo.collection('unit-log').find({ unitId: res[key]._id.toString() }).toArray();
                }

                return {
                    data: res,
                    message: 'OK',
                    statusCode: 200,
                };

            } catch (error) {
                return (Boom.badGateway(error));
            }
        },

    },
    {  // POST Unit
        method: 'POST',
        path: '/unit',
        config: {
            auth: false,
            description: 'Insert unit ',
            notes: 'Insert unit ',
            tags: ['api'],
            validate: {
                payload: {
                    name: Joi.string().min(1).max(100).regex(config.regex).optional()
                        .description('Unit name'),
                    userId: Joi.string().length(24).required().description('id user'),
                },
            },
        },
        handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const payload = req.payload;

                // Create Date
                payload.crt = Date.now();

                // Status's using
                payload.isUse = true;
                const insert = await mongo.collection('unit')
                    .insert(payload);

                // Get latsest ID
                const latestInsert = await mongo.collection('unit')
                    .find({}).sort({ _id: -1 }).limit(1).toArray();

                // Create & Insert unit-Log
                const log = Object.assign({}, payload);
                log.unitId = latestInsert[0]._id.toString();
                Util.writeLog(req, log, 'unit-log', 'insert');

                return ({
                    massage: 'OK',
                    statusCode: 200,
                });

            } catch (error) {
                return (Boom.badGateway(error));
            }

        },

    },
    {  // PUT unit
        method: 'PUT',
        path: '/unit',
        config: {
            auth: false,
            description: 'Insert unit ',
            notes: 'Insert unit ',
            tags: ['api'],
            validate: {
                payload: {
                    name: Joi.string().min(1).max(100).regex(config.regex).optional()
                        .description('unit name'),
                    unitId: Joi.string().length(24).required().description('id unit'),
                    userId: Joi.string().length(24).required().description('id user'),
                },
            },
        },
        handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const payload = req.payload;

                // Check No Data
                const res = await mongo.collection('unit')
                    .findOne({ _id: mongoObjectId(payload.unitId) });

                if (!res) {
                    return (Boom.badData(`Can't find ID ${payload.unitId}`));
                }

                // Create Update Info & Update unit
                const updateInfo = {
                    mdt: Date.now(),
                    name: payload.name,
                };

                const update = await mongo.collection('unit')
                    .update({ _id: mongoObjectId(payload.unitId) }, { $set: updateInfo });

                // Create & Insert unit-Log
                const writeLog = await Util.writeLog(req, payload, 'unit-log', 'update');

                return ({
                    massage: 'OK',
                    statusCode: 200,
                });

            } catch (error) {
                return (Boom.badGateway(error));
            }

        },

    },
    {  // Delete Unit
        method: 'DELETE',
        path: '/unit/{id}',
        config: {
            auth: false,
            description: 'check Master before delete Unit ',
            notes: 'check Master before delete Unit',
            tags: ['api'],
            validate: {
                params: {
                    id: Joi.string().length(24).required().description('id unit'),
                },
            },
        },
        handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const params = req.params;
                const res = await mongo.collection('master').findOne({ unitId: params.id });
                if (res) { return (Boom.badGateway('CAN NOT DELETE Data is used in master')); }
                const del = await mongo.collection('unit').deleteOne({ _id: mongoObjectId(params.id) });

                // Return 200
                return ({
                    massage: 'OK',
                    statusCode: 200,
                });

            } catch (error) {
                return (Boom.badGateway(error));
            }

        },

    },
];
