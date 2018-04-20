import * as  Boom from 'boom';
import * as Joi from 'joi';
import * as JWT from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { Util } from '../util';
import { config } from '../config';
const mongoObjectId = ObjectId;
// tslint:disable:max-line-length
module.exports = [
    {  // GET Category
        method: 'GET',
        path: '/category/{id?}',
        config: {
            auth: false,
            description: 'Get Inventory',
            tags: ['api'],
            validate: {
                params: {
                    id: Joi.string().optional().description('id category'),
                },
            },
        }, handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const params = req.params;
                const find: any = { isUse: true, };

                if (params.id === '{id}') { delete params.id; }
                if (params.id) { find._id = mongoObjectId(params.id); }

                // GET category info
                const res = await mongo.collection('category').find(find).toArray();

                // GET category-log & parent
                for (const key in res) {
                    res[key].categoryLog = await mongo.collection('category-log').find({ categoryId: res[key]._id.toString() }).toArray();
                    if (res[key].categoryId) { res[key].parentCategory = await mongo.collection('category').findOne({ _id: mongoObjectId(res[key].categoryId) }); }
                }

                return {
                    statusCode: 200,
                    message: 'OK',
                    data: res,
                };

            } catch (error) {
                return (Boom.badGateway(error));
            }
        },

    },
    {  // POST Category
        method: 'POST',
        path: '/category',
        config: {
            auth: false,
            description: 'Insert Category ',
            notes: 'Insert Category',
            tags: ['api'],
            validate: {
                payload: {
                    name: Joi.string().min(1).max(100).regex(config.regex).optional().description('Category name'),
                    userId: Joi.string().length(24).required().description('id user'),
                    imageId: Joi.string().length(24).optional().description('id Image'),
                    categoryId: Joi.string().length(24).optional().description('id Image'),
                },
            },
        },
        handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const payload = req.payload;

                // Create Info & Insert Category
                const insertInfo = Object.assign({}, payload);
                delete insertInfo.userId;
                insertInfo.crt = Date.now();
                insertInfo.isUse = true;
                const insert = await mongo.collection('category').insert(insertInfo);

                // Get latsest ID
                const latestInsert = await mongo.collection('category').find({}).sort({ _id: -1 }).limit(1).toArray();

                // Create & Insert Category-Log
                const log = Object.assign({}, payload);
                log.categoryId = latestInsert[0]._id.toString();
                const writeLog = await Util.writeLog(req, log, 'category-log', 'insert');

                return ({
                    massage: 'OK',
                    statusCode: 200,
                });

            } catch (error) {
                return (Boom.badGateway(error));
            }

        },

    },
    {  // PUT Category
        method: 'PUT',
        path: '/category',
        config: {
            auth: false,
            description: 'Insert Master ',
            notes: 'Insert Master ',
            tags: ['api'],
            validate: {
                payload: {
                    categoryId: Joi.string().length(24).required().description('id category'),
                    name: Joi.string().min(1).max(100).regex(config.regex).optional()
                        .description('Category name'),
                    userId: Joi.string().length(24).required().description('id user'),
                },
            },
        },
        handler: async (req, reply) => {
            try {
                const mongo = Util.getDb(req);
                const payload = req.payload;

                // Check No Data
                const res = await mongo.collection('category').findOne({ _id: mongoObjectId(payload.categoryId) });
                if (!res) {
                    return (Boom.badData(`Can't find ID ${payload.categoryId}`));
                }

                // Create Update Info & Update Category
                const updateInfo = {
                    mdt: Date.now(),
                    name: payload.name,
                };
                const update = await mongo.collection('category')
                    .update({ _id: mongoObjectId(payload.categoryId) }, { $set: updateInfo });

                // Create & Insert Category-Log
                const writeLog = await Util.writeLog(req, payload, 'category-log', 'update');

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
    {  // Delete Category
        method: 'DELETE',
        path: '/category/{id}',
        config: {
            auth: false,
            description: 'Delete category and check Master ',
            notes: 'Delete category and check Master ',
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
                const res = await mongo.collection('master').findOne({ categoryId: params.id });
                if (res) { return (Boom.badGateway('CAN NOT DELETE Data is used in master')); }
                const del = await mongo.collection('category').deleteOne({ _id: mongoObjectId(params.id) });

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
