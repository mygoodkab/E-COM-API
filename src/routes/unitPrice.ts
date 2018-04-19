import * as  Boom from 'boom';
import * as Joi from 'joi';
import * as JWT from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { Util } from '../util';
import { config } from '../config';
const mongoObjectId = ObjectId;

module.exports = [
    {  // GET Unit Price
        method: 'GET',
        path: '/unitPrice/{id?}',
        config: {
            auth: false,
            description: 'Get unitPrice',
            tags: ['api'],
            validate: {
                params: {
                    id: Joi.string().optional().description('id unit price'),
                },
            },
        }, handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const params = req.params;

                // Get unitPrice Info & Log
                let res;
                if (params.id === '{id}') { delete params.id; }
                if (params.id) {
                    res = await mongo.collection('unitPrice').findOne({ _id: mongoObjectId(params.id) });
                    res.unitPriceLog = await mongo.collection('unitPrice-log').find({ unitPriceId: res._id.toString() }).toArray();
                } else {
                    res = await mongo.collection('unitPrice').find({ isUse: true }).toArray();
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
    {  // POST Unit Price
        method: 'POST',
        path: '/unitPrice',
        config: {
            auth: false,
            description: 'Insert unitPrice ',
            notes: 'Insert unitPrice ',
            tags: ['api'],
            validate: {
                payload: {
                    name: Joi.string().min(1).max(100).regex(config.regex).optional()
                        .description('unit price name'),
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

                const insert = await mongo.collection('unitPrice').insert(payload);

                // Get latsest ID
                const latestInsert = await mongo.collection('unitPrice').find({}).sort({ _id: -1 }).limit(1).toArray();

                // Create & Insert unit price-Log
                const log = Object.assign({}, payload);
                log.unitPriceId = latestInsert[0]._id.toString();
                const writeLog = await Util.writeLog(req, log, 'unitPrice-log', 'insert');

                return ({
                    massage: 'OK',
                    statusCode: 200,
                });

            } catch (error) {
                return (Boom.badGateway(error));
            }
        },

    },
    {  // PUT unitPrice
        method: 'PUT',
        path: '/unitPrice',
        config: {
            auth: false,
            description: 'Update unitPrice ',
            notes: 'Update unitPrice ',
            tags: ['api'],
            validate: {
                payload: {
                    name: Joi.string().min(1).max(100).regex(config.regex).optional()
                        .description('unit name'),
                    unitPriceId: Joi.string().length(24).required().description('id unitPrice'),
                    userId: Joi.string().length(24).required().description('id unitPrice'),
                },
            },
        },
        handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const payload = req.payload;

                // Check No Data
                const res = await mongo.collection('unitPrice').findOne({ _id: mongoObjectId(payload.unitPriceId) });
                if (!res) {
                    return (Boom.badData(`Can't find ID ${payload.unitPriceId}`));
                }

                // Create Update Info & Update unitPrice
                const updateInfo = {
                    mdt: Date.now(),
                    name: payload.name,
                };
                const update = await mongo.collection('unitPrice')
                    .update({ _id: mongoObjectId(payload.unitPriceId) }, { $set: updateInfo });

                // Create & Insert unitPrice-Log
                const writeLog = await Util.writeLog(req, payload, 'unitPrice-log', 'update');

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
    {  // Delete Unit
        method: 'DELETE',
        path: '/unitPrice/{id}',
        config: {
            auth: false,
            description: 'check Master before delete unitPrice ',
            notes: 'check Master before delete unitPrice',
            tags: ['api'],
            validate: {
                params: {
                    id: Joi.string().length(24).required().description('id unitPrice'),
                },
            },
        },
        handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const params = req.params;
                const res = await mongo.collection('master').findOne({ unitPriceId: params.id });
                if (res) { return (Boom.badGateway('CAN NOT DELETE Data is used in master')); }
                const del = await mongo.collection('unitPrice').deleteOne({ _id: mongoObjectId(params.id) });

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
