import * as  Boom from 'boom'
import { Util } from '../util';
import * as Joi from 'joi'
import * as JWT from 'jsonwebtoken';
import { request } from 'http';
const mongoObjectId = require('mongodb').ObjectId;
module.exports = [
    {  // Get Unit Price
        method: 'GET',
        path: '/unitPrice/{id?}',
        config: {
            auth: false,
            tags: ['api'],
            description: 'Get unitPrice',
            validate: {
                params: {
                    id: Joi.any()
                }
            }
        }, handler: async (request, reply) => {
            try {
                const mongo = Util.getDb(request)
                let params = request.params
                let res = params.id ? await mongo.collection('unitPrice').findOne({ _id: mongoObjectId(params.id) }) : await mongo.collection('unitPrice').find({ isUse: true }).toArray()
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
    {  // Insert Unit Price
        method: 'POST',
        path: '/unitPrice/insert',
        config: {
            auth: false,
            tags: ['api'],
            description: 'Insert unitPrice ',
            notes: 'Insert unitPrice ',
            validate: {
                payload: {
                    unitPriceName: Joi.any(),
                    unitPriceDateCreate: Joi.any(),
                    userId: Joi.any(),
                }
            }
        },
        handler: async (request, reply) => {
            try {
                const mongo = Util.getDb(request)
                let payload = request.payload

                //วันเวลาที่สร้าง
                payload.unitPriceDateCreate = Date.now()

                //สถานะการใช้งาน
                payload.isUse = true

                let insert = await mongo.collection('unitPrice').insert(payload)

                // Get latsest ID
                let latestInsert = await mongo.collection('unitPrice').find({}).sort({ _id: -1 }).limit(1).toArray();

                // Create & Insert Category-Log
                let log = Object.assign({}, payload)
                log.unitPriceId = latestInsert[0]._id.toString()
                Util.writeLog(request, log, 'unitPrice-log', 'Insert')

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
    {  // Update unitPrice
        method: 'POST',
        path: '/unitPrice/update',
        config: {
            auth: false,
            tags: ['api'],
            description: 'Update unitPrice ',
            notes: 'Update unitPrice ',
            validate: {
                payload: {
                    unitPriceId: Joi.any().required(),
                    unitPriceName: Joi.any(),
                    userId: Joi.any().required(),
                }
            }
        },
        handler: async (request, reply) => {
            try {
                const mongo = Util.getDb(request)
                let payload = request.payload

                // Check No Data
                let res = await mongo.collection('unitPrice').findOne({ _id: mongoObjectId(payload.unitPriceId) })
                if (!res) {
                    return (Boom.badData(`Can't find ID ${payload.unitPriceId}`))
                }

                // Create Update Info & Update unitPrice
                let updateInfo = {
                    unitPriceName: payload.unitPriceName,
                    unitPriceLatestUpdate: Date.now()
                }
                let update = await mongo.collection('unitPrice').update({ _id: mongoObjectId(payload.unitPriceId) }, { $set: updateInfo })

                // Create & Insert unitPrice-Log
                Util.writeLog(request, payload, 'unitPrice-log', 'Update')

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