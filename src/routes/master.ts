import * as  Boom from 'boom'
import { Util } from '../util';
import * as Joi from 'joi'
import * as JWT from 'jsonwebtoken';
import { request } from 'http';
const mongoObjectId = require('mongodb').ObjectId;
module.exports = [
    {  // Get Master
        method: 'GET',
        path: '/master/{id?}',
        config: {
            auth: false,
            tags: ['api'],
            description: 'Get Inventory',
            validate: {
                params: {
                    id: Joi.any()
                }
            }
        }, handler: async (request, reply) => {
            try {
                const mongo = Util.getDb(request)

                let params = request.params
                let res: any = "";

                if (params.id) {
                    res = await mongo.collection('master').findOne({ _id: mongoObjectId(params.id) })
                    res.unitId = await mongo.collection('unit').findOne({ id: mongoObjectId(res.unitId) })
                    res.unitPriceId = await mongo.collection('unitPrice').findOne({ id: mongoObjectId(res.unitPriceId) })
                    res.categoryId = await mongo.collection('category').findOne({ id: mongoObjectId(res.categoryId) })
                    res.userId = await mongo.collection('user').findOne({ id: mongoObjectId(res.userId) })
                } else {
                    res = await mongo.collection('master').find().toArray()
                    for (const index in res) {
                        res[index].unitId = await mongo.collection('unit').findOne({ id: mongoObjectId(res.unitId[index]) })
                        res[index].unitPriceId = await mongo.collection('unitPrice').findOne({ id: mongoObjectId(res.unitPriceId[index]) })
                        res[index].categoryId = await mongo.collection('category').findOne({ id: mongoObjectId(res.categoryId[index]) })
                        res[index].userId = await mongo.collection('user').findOne({ id: mongoObjectId(res.userId[index]) })
                    }
                }

                return {
                    statusCode: 200,
                    message: "OK",
                    data: res
                }
            } catch (error) {
                console.log(error)
                return (Boom.badGateway(error))
            }
        }
    },
    {  // Insert Master
        method: 'POST',
        path: '/master/insert',
        config: {
            auth: false,
            tags: ['api'],
            description: 'Insert Master ',
            notes: 'Insert Master ',
            validate: {
                payload: {
                    masterName: Joi.any(),
                    masterDesc: Joi.any(),
                    masterPrice: Joi.any(),
                    masterCost: Joi.any(),
                    masterBarCode: Joi.any(),
                    masterDateCreate: Joi.any(),
                    unitPriceId: Joi.any(),
                    unitId: Joi.any(),
                    imageMasterId: Joi.any(),
                    userId: Joi.any(),
                    categoryId: Joi.any(),
                }
            }
        },
        handler: async (request, reply) => {
            try {
                const mongo = Util.getDb(request)
                let payload = request.payload
                payload.masterDateCreate = Date.now()
                let insert = await mongo.collection('master').insert(payload)
                return ({
                    statusCode: 200,
                    massage: "OK"
                })
            } catch (error) {
                console.log(error)
                return (Boom.badGateway(error))
            }

        }
    }
]