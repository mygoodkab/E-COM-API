import * as  Boom from 'boom'
import { Util } from '../util';
import * as Joi from 'joi'
import * as JWT from 'jsonwebtoken';
import { request } from 'http';
const mongoObjectId = require('mongodb').ObjectId;
module.exports = [
    {  // Get Category
        method: 'GET',
        path: '/category/{id?}',
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

                // Get Cateogory Info
                let res = params.id ? await mongo.collection('category').findOne({ _id: mongoObjectId(params.id) }) : await mongo.collection('category').find({isUse:true}).toArray()

                // Get log
                params.id ? res.categoryLog = await mongo.collection('category-log').find({ categoryId: res._id.toString() }).toArray() : "";

                //Return 200
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
    {  // Insert Category
        method: 'POST',
        path: '/category/insert',
        config: {
            auth: false,
            tags: ['api'],
            description: 'Insert Master ',
            notes: 'Insert Master ',
            validate: {
                payload: {
                    categoryName: Joi.any(),
                    categoryDateCreate: Joi.any(),
                    userId: Joi.any(),
                }
            }
        },
        handler: async (request, reply) => {
            try {
                const mongo = Util.getDb(request)
                let payload = request.payload

                // Create Info & Insert Category
                let insertInfo = Object.assign({}, payload)
                delete insertInfo.userId
                insertInfo.categoryDateCreate = Date.now()
                insertInfo.isUse = true
                let insert = await mongo.collection('category').insert(insertInfo)

                // Get latsest ID
                let latestInsert = await mongo.collection('category').find({}).sort({ _id: -1 }).limit(1).toArray();

                // Create & Insert Category-Log
                let log = Object.assign({}, payload)
                log.categoryId = latestInsert[0]._id.toString()
                Util.writeLog(request, log, 'category-log', 'Insert')

                return ({
                    statusCode: 200,
                    massage: "OK"
                })

            } catch (error) {
                console.log(error)
                return (Boom.badGateway(error))
            }

        }
    },
    {  // Update Category
        method: 'POST',
        path: '/category/update',
        config: {
            auth: false,
            tags: ['api'],
            description: 'Insert Master ',
            notes: 'Insert Master ',
            validate: {
                payload: {
                    categoryId: Joi.any().required(),
                    categoryName: Joi.any(),
                    userId: Joi.any().required(),
                }
            }
        },
        handler: async (request, reply) => {
            try {
                const mongo = Util.getDb(request)
                let payload = request.payload

                // Check No Data
                let res = await mongo.collection('category').findOne({ _id: mongoObjectId(payload.categoryId) })
                if (!res) {
                    return (Boom.badData(`Can't find ID ${payload.categoryId}`))
                }

                // Create Update Info & Update Category
                let updateInfo = {
                    categoryName: payload.categoryName,
                    categoryLatestUpdate: Date.now()
                }
                let update = await mongo.collection('category').update({ _id: mongoObjectId(payload.categoryId) }, { $set: updateInfo })

                // Create & Insert Category-Log
                Util.writeLog(request, payload, 'category-log', 'Update')

                // Return 200
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