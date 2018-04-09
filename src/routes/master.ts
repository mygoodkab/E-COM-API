import * as  Boom from 'boom';
import { Util } from '../util';
import * as Joi from 'joi';
import * as JWT from 'jsonwebtoken';
import { request } from 'http';
const mongoObjectId = require('mongodb').ObjectId;
module.exports = [
    {  // GET All/By ID Master
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
                //ถ้ามี parameter id ให้ค้นหาข้อมูลตาม id
                let resultMaster: any = params.id ? await mongo.collection('master').findOne({ _id: mongoObjectId(params.id) }) : await mongo.collection('master').find({ isUse: true }).toArray()
                //ถ้ามี paramter id ข้อมูลที่ res จะเป็นแบบ Object สามารถ Assign ค่าได้เลยได้เลย
                //ดึงข้อมูลจากข้อมูล table อื่นจาก Reference Id
                if (params.id) {
                    // If no data 
                    if(!resultMaster){
                        return (Boom.badData(`Can't find ID ${params.masterId}`))
                    }
                    resultMaster.unitInfo = await mongo.collection('unit').findOne({ _id: mongoObjectId(resultMaster.unitId) })
                    resultMaster.unitPriceInfo = await mongo.collection('unitPrice').findOne({ _id: mongoObjectId(resultMaster.unitPriceId) })
                    resultMaster.categoryInfo = await mongo.collection('category').findOne({ _id: mongoObjectId(resultMaster.categoryId) })
                    resultMaster.userInfo = await mongo.collection('users').findOne({ _id: mongoObjectId(resultMaster.userId) })
                    resultMaster.masterLog  = await mongo.collection('master-log').find({ masterId: resultMaster._id.toString() }).toArray()
                }
                //ถ้าข้อมูลไม่มี paramter id ข้อมูล res ที่ได้จะเป็นแบบ Array จะต้อง loop เพื่อ Assign ค่าที่ละตำแหน่ง
                //ดึงข้อมูลจากข้อมูล table อื่นจาก Reference Id
                else {
                    for (let index in resultMaster) {
                        resultMaster[index].unitInfo = await mongo.collection('unit').findOne({ _id: mongoObjectId(resultMaster[index].unitId) })
                        resultMaster[index].unitPriceInfo = await mongo.collection('unitPrice').findOne({ _id: mongoObjectId(resultMaster[index].unitPriceId) })
                        resultMaster[index].categoryInfo = await mongo.collection('category').findOne({ _id: mongoObjectId(resultMaster[index].categoryId) })
                        resultMaster[index].userInfo = await mongo.collection('users').findOne({ _id: mongoObjectId(resultMaster[index].userId) })
                    }
                }
                return {
                    statusCode: 200,
                    message: "OK",
                    data: resultMaster
                }
            } catch (error) {
                console.log(error)
                return (Boom.badGateway(error))
            }
        }
    },
    {  // POST Master
        method: 'POST',
        path: '/master',
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
                    masterBarcode: Joi.any(),
                    unitPriceId: Joi.any().required(),
                    unitId: Joi.any().required(),
                    imageMasterId: Joi.any(),
                    userId: Joi.any().required(),
                    categoryId: Joi.any().required(),
                }
            }
        },
        handler: async (request, reply) => {
            try {
                const mongo = Util.getDb(request)

                let payload = request.payload
                //บันทึกวันเวลาที่บันทึก
                payload.masterDateCreate = Date.now()

                //สถานะการใช้งาน
                payload.isUse = true

                //เพิ่มข้อมูลลงฐานข้อมูล
                let insert = await mongo.collection('master').insert(payload)

                // Get latsest ID
                let latestInsert = await mongo.collection('master').find({}).sort({ _id: -1 }).limit(1).toArray();

                // Create & Insert Category-Log
                let log = Object.assign({}, payload)
                log.masterId = latestInsert[0]._id.toString()
                Util.writeLog(request, log, 'master-log', 'Insert')

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
    {  // PUT Master
        method: 'PUT',
        path: '/master',
        config: {
            auth: false,
            tags: ['api'],
            description: 'Insert Master ',
            notes: 'Insert Master ',
            validate: {
                payload: {
                    masterId: Joi.any().required(),
                    masterName: Joi.any(),
                    masterDesc: Joi.any(),
                    masterPrice: Joi.any(),
                    masterCost: Joi.any(),
                    masterBarcode: Joi.any(),
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

                // Check No Data
                let res = await mongo.collection('master').findOne({ _id: mongoObjectId(payload.masterId) })
                if (!res) {
                    return (Boom.badData(`Can't find ID ${payload.masterId}`))
                }

                // Create Update Info & Update 
                let updateInfo = Object.assign({}, payload)
                delete updateInfo.masterId
                updateInfo.masterLatestUpdate = Date.now()
                let update = await mongo.collection('master').update({ _id: mongoObjectId(payload.masterId) }, { $set: updateInfo })

                // Create & Insert Log
                Util.writeLog(request, payload, 'master-log', 'Update')

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
    },

]