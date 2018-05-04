import * as Boom from 'boom';
import * as Joi from 'joi';
import * as JWT from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { Util } from '../util';
import { config } from '../config';
const mongoObjectId = ObjectId;

module.exports = [
    {  // GET Inventory
        method: 'GET',
        path: '/inventory/{id?}',
        config: {
            auth: false,
            description: 'Get Inventory',
            tags: ['api'],
            validate: {
                params: {
                    id: Joi.string().optional().description('id Inventory'),
                },
            },
        }, handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const params = req.params;

                // Data is Object or Array
                let res;
                if (params.id === '{id}') { delete params.id; }
                if (params.id) {
                    res = await mongo.collection('inventory').findOne({ _id: mongoObjectId(params.id) });
                    res.masterInfo = await mongo.collection('master').findOne({ _id: mongoObjectId(res.masterId) });
                    res.inventoryLog = await mongo.collection('inventory-log').find({ metadata: { $elemMatch: { inventoryId: res._id.toString() } } }).toArray();
                } else {
                    res = await mongo.collection('inventory').find().toArray();
                    for (const index in res) {
                        if (res.hasOwnProperty(index)) {
                            res[index].masterInfo = await mongo.collection('master')
                                .findOne({ _id: mongoObjectId(res[index].masterId) });
                        }
                    }
                }
                return {
                    data: res,
                    message: 'OK',
                    statusCode: 200,
                };
            } catch (error) {
                return (Boom.badGateway);
            }
        },

    },
    {  // POST Import/Export Item
        method: 'POST',
        path: '/inventory/import-export',
        config: {
            auth: false,
            description: 'Import/Export Inventory',
            tags: ['api'],
            validate: {
                payload: {
                    metadata: Joi.array().items([{
                        amount: Joi.number().min(1).max(100).integer().required().description('number of import/export item'),
                        barcode: Joi.string().regex(config.regex).required().description('barcode master'),
                    }]).required(),
                    method: Joi.string().valid(['import', 'export']).required().description('method to update inventory'),
                    userId: Joi.string().length(24).required().description('id user'),
                },
            },
        }, handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const payload = req.payload;

                // Loop from Number of Barcode to import/export each item
                for (const index in payload.metadata) {
                    if (payload.metadata.hasOwnProperty(index)) {
                        const resMaster = await mongo.collection('master').findOne({ barcode: payload.metadata[index].barcode });
                        const resInventory = await mongo.collection('inventory').findOne({ barcode: payload.metadata[index].barcode });
                        // Check is new barcode
                        if (!resMaster) {
                            return {
                                message: `Can't find Product Barcode ${payload.metadata[index].masterBarcod}`,
                                statusCode: 403,
                            };
                        }
                        // if export amount less than inventory 
                        if (payload.method === 'export') {
                            if (resInventory.amountInStock - payload.metadata[index].amount < 0) {
                                return {
                                    message: `Export Error : Product Barcode ${payload.metadata[index].masterBarcod} is less than inventory`,
                                    statusCode: 403,
                                };
                            }
                        }
                    }
                }
                // If can find all barcode
                for (const index in payload.metadata) {
                    const resMaster = await mongo.collection('master').findOne({ barcode: payload.metadata[index].barcode });
                    const resInventory = await mongo.collection('inventory').findOne({ barcode: payload.metadata[index].barcode });


                    // If item is exsist will import/export
                    if (payload.method === 'import') {

                        // If item is not exsist will insert
                        if (resInventory) {
                            payload.metadata[index].inventoryId = resInventory._id.toString();
                            await mongo.collection('inventory').update({ _id: mongoObjectId(resInventory._id) },
                                { $inc: { amountInStock: payload.metadata[index].amount } },
                                { $set: { mdt: Date.now() } })
                        } else {
                            const inventory = {
                                amountInOrder: 0,
                                amountInShipping: 0,
                                amountInStock: payload.metadata[index].amount,
                                crt: Date.now(),
                                barcode: resMaster.barcode,
                                masterId: resMaster._id,
                            };
                            const insertInventory = await mongo.collection('inventory').insert(inventory);

                        }

                    } else {
                        await mongo.collection('inventory').update({ _id: mongoObjectId(resInventory._id) },
                            { $inc: { amountInStock: -payload.metadata[index].amount } },
                            { $set: { mdt: Date.now() } });
                    }
                }

                // Create LOG
                const log = Object.assign({}, payload);
                log.crt = Date.now();
                const insertInventoryLog = await mongo.collection('inventory-log').insert(log);

                return {
                    message: 'OK',
                    statusCode: 200,
                };

            } catch (error) {
                return (Boom.badGateway(error));
            }
        },

    },
    {  // POST Adjust
        method: 'POST',
        path: '/inventory/adjust',
        config: {
            auth: false,
            description: 'Adjust Inventory',
            tags: ['api'],
            validate: {
                payload: {
                    amount: Joi.number().min(1).max(100).required().description('number of import item'),
                    inventoryId: Joi.string().length(24).required().description('inventory id'),
                    userId: Joi.string().length(24).required().description('user id'),
                },
            },
        }, handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const payload = req.payload;

                // Create log info as import/export log format
                const log = Object.assign({}, payload);
                log.metadata = {
                    amount: payload.amount,
                    inventoryId: payload.inventoryId,
                };
                log.method = 'adjust';
                log.crt = Date.now();
                delete log.amount;
                delete log.inventoryId;

                // Update จำนวน Item
                const insertInventoryLog = await mongo.collection('inventory-log').insert(log);
                const updateInventory = await mongo.collection('inventory')
                    .update({ _id: mongoObjectId(payload.inventoryId) },
                        { $set: { amountInStock: payload.amount, mdt: Date.now() } });

                return {
                    message: 'OK',
                    statusCode: 200,
                };

            } catch (error) {
                return (Boom.badGateway(error));
            }
        },

    },
    {  // GET Inventory
        method: 'GET',
        path: '/inventory/log',
        config: {
            auth: false,
            description: 'Get Inventory-Log',
            tags: ['api'],
            validate: {
                options: {
                    allowUnknown: true,
                },
                query: {
                    begin: Joi.number().integer().min(0).optional().description('begin datetime in unix crt'),
                    end: Joi.number().integer().min(0).optional().description('end datetime in unix crt'),
                    inventoryId: Joi.string().length(24).optional().description('id inventory'),
                    limit: Joi.number().integer().min(1).optional().description('number of data to be shown'),
                    sort: Joi.number().integer().valid([1, -1]).optional().description('1 for asc & -1 for desc'),
                },
            },
        },
        handler: async (req, reply) => {
            try {
                const db = Util.getDb(req);
                const payload = req.query;
                const options: any = { query: {}, sort: {}, limit: 0 };

                // Loop from key in payload to check query string and assign value to find/sort/limit data
                for (const key in payload) {
                    switch (key) {
                        case 'begin':
                        case 'end':
                            if (options.query.crt === undefined) {
                                options.query.crt = {};
                            }
                            options.query.crt = key === 'begin'
                                ? { $gte: payload[key] }
                                : { $lte: payload[key] };
                            break;
                        case 'sort':
                            options.sort = { crt: payload[key] };
                            break;
                        case 'limit':
                            options.limit = payload[key];
                            break;
                        case 'inventoryId':
                            options.query.metadata = { $elemMatch: { inventoryId: payload.inventoryId } };
                            break;
                        default:
                            options.query[key] = payload[key];
                            break;
                    }
                }
                const inventoryLogs = await db.collection('inventory-log').find(options.query).sort(options.sort).limit(options.limit).toArray();

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
