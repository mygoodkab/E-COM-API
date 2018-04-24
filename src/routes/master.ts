import * as  Boom from 'boom';
import * as Joi from 'joi';
import * as JWT from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { Util } from '../util';
import { config } from '../config';
const mongoObjectId = ObjectId;

module.exports = [
    {  // GET All/By ID Master
        method: 'GET',
        path: '/master/{id?}',
        config: {
            auth: false,
            description: 'Get Inventory',
            tags: ['api'],
            validate: {
                params: {
                    id: Joi.string().optional().description('id Master'),
                },
            },
        },
        handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const params = req.params;
                const find: any = { isUse: true, };

                if (params.id === '{id}') { delete params.id; }
                if (params.id) { find._id = mongoObjectId(params.id); }

                const res = await mongo.collection('master').find(find).toArray();

                for (const index in res) {
                    // res[index].unitInfo = await mongo.collection('unit').findOne({ _id: mongoObjectId(res[index].unitId) });
                    // res[index].unitPriceInfo = await mongo.collection('unitPrice').findOne({ _id: mongoObjectId(res[index].unitPriceId) });
                    res[index].categoryInfo = await mongo.collection('category').findOne({ _id: mongoObjectId(res[index].categoryId) });
                    res[index].userInfo = await mongo.collection('users').findOne({ _id: mongoObjectId(res[index].userId) });
                    if (params.id) { res[index].masterLog = await mongo.collection('master-log').find({ masterId: res[index]._id.toString() }).toArray(); }
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
    {  // POST Master
        method: 'POST',
        path: '/master',
        config: {
            auth: false,
            description: 'Insert Master',
            notes: 'Insert Master',
            tags: ['api'],
            validate: {
                payload: {
                    barcode: Joi.string().regex(config.regex).required(),
                    cost: Joi.number().integer().min(1),
                    desc: Joi.string().description('Master description'),
                    name: Joi.string().min(1).max(100).regex(config.regex)
                        .optional().description('Master name'),
                    price: Joi.number().integer().min(1).description('Sell price'),
                    categoryId: Joi.string().length(24).optional().description('id Category'),
                    imageId: Joi.string().length(24).optional().description('id Image'),
                    unitId: Joi.string().optional().description('id unitId'),
                    sku: Joi.string().description('Stock keeping unit'),
                    brand: Joi.string().description('Brand'),
                    model: Joi.string().description('Model'),
                    size: Joi.string().description('Size'),
                    weight: Joi.string().description('Weight'),
                    color: Joi.string().description('Color'),
                    // unitPriceId: Joi.string().length(24).optional().description('id unitPriceId'),
                    userId: Joi.string().length(24).optional().description('id userId'),
                },
            },
        },
        handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const payload = req.payload;
                // บันทึกวันเวลาที่บันทึก
                payload.masterDateCreate = Date.now();

                // สถานะการใช้งาน
                payload.isUse = true;

                // เพิ่มข้อมูลลงฐานข้อมูล
                const insert = await mongo.collection('master').insert(payload);

                // Get latsest ID
                const latestInsert = await mongo.collection('master')
                    .find({}).sort({ _id: -1 }).limit(1).toArray();

                // Create & Insert Category-Log
                const log = Object.assign({}, payload);
                log.masterId = latestInsert[0]._id.toString();
                const writeLog = await Util.writeLog(req, log, 'master-log', 'insert');

                return ({
                    massage: 'OK',
                    statusCode: 200,
                });

            } catch (error) {
                return (Boom.badGateway(error));
            }

        },

    },
    {  // PUT Master
        method: 'PUT',
        path: '/master',
        config: {
            auth: false,
            description: 'Insert Master ',
            notes: 'Insert Master ',
            tags: ['api'],
            validate: {
                payload: {
                    barcode: Joi.string().regex(config.regex),
                    categoryId: Joi.string().length(24).optional().description('id Category'),
                    cost: Joi.number().integer().min(1),
                    desc: Joi.number().integer().min(1).description('Master description'),
                    imageMasterId: Joi.string().description('id Image'),
                    masterId: Joi.string().length(24).optional().description('id Master').required(),
                    name: Joi.string().min(1).max(100).regex(config.regex)
                        .optional().description('Category name'),
                    price: Joi.number().integer().min(1).description('Sell price'),
                    unitId: Joi.string().optional().description('id unitId'),
                    sku: Joi.string().description('Stock keeping unit'),
                    brand: Joi.string().description('Brand'),
                    model: Joi.string().description('Model'),
                    size: Joi.string().description('Size'),
                    weight: Joi.string().description('Weight'),
                    color: Joi.string().description('Color'),
                    // unitPriceId: Joi.string().length(24).optional().description('id unitPriceId'),
                    userId: Joi.string().length(24).optional().description('id userId'),
                },
            },
        },
        handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const payload = req.payload;

                // Check No Data
                const res = await mongo.collection('master')
                    .findOne({ _id: mongoObjectId(payload.masterId) });

                if (!res) {
                    return (Boom.badData(`Can't find ID ${payload.masterId}`));
                }

                // Create Update Info & Update
                const updateInfo = Object.assign({}, payload);
                delete updateInfo.masterId;
                updateInfo.mdt = Date.now();
                const update = await mongo.collection('master')
                    .update({ _id: mongoObjectId(payload.masterId) }, { $set: updateInfo });

                // Create & Insert Log
                const writeLog = await Util.writeLog(req, payload, 'master-log', 'update');

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
    {  // Delete Master
        method: 'DELETE',
        path: '/master/{id}',
        config: {
            auth: false,
            description: 'check Inventory before delete Master',
            notes: 'check Inventory before delete Master ',
            tags: ['api'],
            validate: {
                params: {
                    id: Joi.string().length(24).required().description('id category'),
                },
            },
        },
        handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const params = req.params;
                const res = await mongo.collection('inventory').findOne({ masterId: params.id });
                if (res) { return (Boom.badGateway('CAN NOT DELETE Data is used in inventory')); }
                const del = await mongo.collection('master').deleteOne({ _id: mongoObjectId(params.id) });

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
    { // Get Master Filter
        method: 'GET',
        path: '/master/filter',
        config: {
            auth: false,
            description: 'Get Inventory-Log',
            tags: ['api'],
            validate: {
                options: {
                    allowUnknown: true,
                },
                query: {
                    masterId: Joi.string().length(24).optional().description('id master'),
                    barcode: Joi.string().optional().description('Barcode'),
                },
            },
        },
        handler: async (req, reply) => {
            try {
                const db = Util.getDb(req);
                const query = req.query;
                const find: any = { isUse: true };
                // Loop from key in payload to check query string and assign value to find/sort/limit data
                for (const key in query) {
                    switch (key) {
                        case 'barcode':
                            find.barcode = query.barcode;
                            break;
                        case 'masterId':
                            find._id = mongoObjectId(query.masterId);
                            break;
                        default:
                            find[key] = query[key];
                            break;
                    }
                }
                const inventoryLogs = await db.collection('master').find(find).toArray();

                return {
                    data: inventoryLogs,
                    message: 'OK',
                    statusCode: 200,
                };
            } catch (error) {
                return Boom.badGateway(error.message, error.data);
            }
        },
    },
];
