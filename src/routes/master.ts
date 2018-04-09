import * as  Boom from 'boom'
import { Util } from '../util';
import * as Joi from 'joi'
import * as JWT from 'jsonwebtoken';
import { request } from 'http';
const mongoObjectId = require('mongodb').ObjectId;
module.exports = [
    {  // Get All/By ID Master
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
                let resultMaster: any = params.id ? await mongo.collection('master').findOne({ _id: mongoObjectId(params.id) }) : await mongo.collection('master').find().toArray()
                //ถ้ามี paramter id ข้อมูลที่ res จะเป็นแบบ Object สามารถ Assign ค่าได้เลยได้เลย
                //ดึงข้อมูลจากข้อมูล table อื่นจาก Reference Id
                if (params.id) {
<<<<<<< HEAD
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
=======
                    resultMaster.unitInfo = await mongo.collection('unit').findOne({ id: mongoObjectId(resultMaster.unitId) })
                    resultMaster.unitPriceInfo = await mongo.collection('unitPrice').findOne({ id: mongoObjectId(resultMaster.unitPriceId) })
                    resultMaster.categoryInfo = await mongo.collection('category').findOne({ id: mongoObjectId(resultMaster.categoryId) })
                    resultMaster.userInfo = await mongo.collection('user').findOne({ id: mongoObjectId(resultMaster.userId) })
>>>>>>> 6d0f3ed2d32384d943fd2ed4b32ee268c2fda127
                }
                //ถ้าข้อมูลไม่มี paramter id ข้อมูล res ที่ได้จะเป็นแบบ Array จะต้อง loop เพื่อ Assign ค่าที่ละตำแหน่ง
                //ดึงข้อมูลจากข้อมูล table อื่นจาก Reference Id
                else {
                    for (let index in resultMaster) {
                        resultMaster[index].unitInfo = await mongo.collection('unit').findOne({ id: mongoObjectId(resultMaster[index].unitId) })
                        resultMaster[index].unitPriceInfo = await mongo.collection('unitPrice').findOne({ id: mongoObjectId(resultMaster[index].unitPriceId) })
                        resultMaster[index].categoryInfo = await mongo.collection('category').findOne({ id: mongoObjectId(resultMaster[index].categoryId) })
                        resultMaster[index].userInfo = await mongo.collection('user').findOne({ id: mongoObjectId(resultMaster[index].userId) })
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
                    masterBarcode: Joi.any(),
                    unitPriceId: Joi.any().required(),
                    unitId: Joi.any().required(),
                    imageMasterId: Joi.any().required(),
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
                //เพิ่มข้อมูลลงฐานข้อมูล
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