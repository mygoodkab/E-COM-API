import * as  Boom from 'boom';
import * as Joi from 'joi';
import * as JWT from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { Util } from '../util';

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
                    id: Joi.string().length(24).optional().description('id Master'),
                },
            },
        },
        handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const params = req.params;
                // ถ้ามี parameter id ให้ค้นหาข้อมูลตาม id
                let res;
                // ถ้ามี paramter id ข้อมูลที่ res จะเป็นแบบ Object สามารถ Assign ค่าได้เลยได้เลย
                // ดึงข้อมูลจากข้อมูล table อื่นจาก Reference Id
                if (params.id === '{id}') { delete params.id; }
                if (params.id) {
                    // If no data
                    res = await mongo.collection('master').findOne({ _id: mongoObjectId(params.id) });
                    if (!res) {
                        return (Boom.badData(`Can't find ID ${params.masterId}`));
                    }
                    res.unitInfo = await mongo.collection('unit')
                        .findOne({ _id: mongoObjectId(res.unitId) });

                    res.unitPriceInfo = await mongo.collection('unitPrice')
                        .findOne({ _id: mongoObjectId(res.unitPriceId) });

                    res.categoryInfo = await mongo.collection('category')
                        .findOne({ _id: mongoObjectId(res.categoryId) });

                    res.userInfo = await mongo.collection('users')
                        .findOne({ _id: mongoObjectId(res.userId) });

                    res.masterLog = await mongo.collection('master-log')
                        .find({ masterId: res._id.toString() }).toArray();
                } else {
                    res = await mongo.collection('master').find({ isUse: true }).toArray();
                    for (const index in res) {
                        if (res.hasOwnProperty(index)) {
                            res[index].unitInfo = await mongo.collection('unit')
                                .findOne({ _id: mongoObjectId(res[index].unitId) });

                            res[index].unitPriceInfo = await mongo.collection('unitPrice')
                                .findOne({ _id: mongoObjectId(res[index].unitPriceId) });

                            res[index].categoryInfo = await mongo.collection('category')
                                .findOne({ _id: mongoObjectId(res[index].categoryId) });

                            res[index].userInfo = await mongo.collection('users')
                                .findOne({ _id: mongoObjectId(res[index].userId) });
                        }
                    }
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
                    barcode: Joi.string().regex(/^[a-zA-Z0-9]+/).required(),
                    categoryId: Joi.string().length(24).optional().description('id Category'),
                    cost: Joi.number().integer().min(1),
                    desc: Joi.number().integer().min(1).description('Master description'),
                    imageMasterId: Joi.string().length(24).optional().description('id Image'),
                    name: Joi.string().min(1).max(100).regex(/^[a-zA-Z0-9_.-]+/)
                        .optional().description('Category name'),
                    price: Joi.number().integer().min(1).description('Sell price'),
                    unitId: Joi.string().length(24).optional().description('id unitId'),
                    unitPriceId: Joi.string().length(24).optional().description('id unitPriceId'),
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
                    barcode: Joi.string().regex(/^[a-zA-Z0-9]+/).required(),
                    categoryId: Joi.string().length(24).optional().description('id Category'),
                    cost: Joi.number().integer().min(1),
                    desc: Joi.number().integer().min(1).description('Master description'),
                    imageMasterId: Joi.string().length(24).optional().description('id Image'),
                    masterId: Joi.string().length(24).optional().description('id Master'),
                    name: Joi.string().min(1).max(100).regex(/^[a-zA-Z0-9_.-]+/)
                        .optional().description('Category name'),
                    price: Joi.number().integer().min(1).description('Sell price'),
                    unitId: Joi.string().length(24).optional().description('id unitId'),
                    unitPriceId: Joi.string().length(24).optional().description('id unitPriceId'),
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
];
