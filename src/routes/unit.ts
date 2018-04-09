import * as  Boom from 'boom'
import { Util } from '../util';
import * as Joi from 'joi'
import * as JWT from 'jsonwebtoken';
import { request } from 'http';
const mongoObjectId = require('mongodb').ObjectId;
module.exports = [
    {  // GET Unit
        method: 'GET',
        path: '/unit/{id?}',
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

                // GET  Unit Info
                let res = params.id ? await mongo.collection('unit').findOne({ _id: mongoObjectId(params.id) }) : await mongo.collection('unit').find({ isUse: true }).toArray()

                // GET log
                params.id ? res.unitLog = await mongo.collection('unit-log').find({ unitId: res._id.toString() }).toArray() : "";

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
    {  // POST Unit
        method: 'POST',
        path: '/unit',
        config: {
            auth: false,
            tags: ['api'],
            description: 'Insert unit ',
            notes: 'Insert unit ',
            validate: {
                payload: {
                    unitName: Joi.any(),
                    unitDateCreate: Joi.any(),
                    userId: Joi.any(),
                }
            }
        },
        handler: async (request, reply) => {
            try {
                const mongo = Util.getDb(request)
                let payload = request.payload

                //วันเวลาที่สร้าง
                payload.unitDateCreate = Date.now()

                //สถานะการใช้งาน
                payload.isUse = true
                let insert = await mongo.collection('unit').insert(payload)

                // Get latsest ID
                let latestInsert = await mongo.collection('unit').find({}).sort({ _id: -1 }).limit(1).toArray();

                // Create & Insert unit-Log
                let log = Object.assign({}, payload)
                log.unitId = latestInsert[0]._id.toString()
                Util.writeLog(request, log, 'unit-log', 'Insert')

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
    {  // PUT unit
        method: 'PUT',
        path: '/unit',
        config: {
            auth: false,
            tags: ['api'],
            description: 'Insert unit ',
            notes: 'Insert unit ',
            validate: {
                payload: {
                    unitId: Joi.any().required(),
                    unitName: Joi.any(),
                    userId: Joi.any().required(),
                }
            }
        },
        handler: async (request, reply) => {
            try {
                const mongo = Util.getDb(request)
                let payload = request.payload

                // Check No Data
                let res = await mongo.collection('unit').findOne({ _id: mongoObjectId(payload.unitId) })
                if (!res) {
                    return (Boom.badData(`Can't find ID ${payload.unitId}`))
                }

                // Create Update Info & Update unit
                let updateInfo = {
                    unitName: payload.unitName,
                    unitLatestUpdate: Date.now()
                }
                let update = await mongo.collection('unit').update({ _id: mongoObjectId(payload.unitId) }, { $set: updateInfo })

                // Create & Insert unit-Log
                Util.writeLog(request, payload, 'unit-log', 'Update')

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