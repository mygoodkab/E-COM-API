import * as  Boom from 'boom'
import { Util } from '../util';
import * as Joi from 'joi'
import * as JWT from 'jsonwebtoken';
import { request } from 'http';
const config = require('../config.json')
const mongoObjectId = require('mongodb').ObjectId;
module.exports = [
    {  // GET Inventory
        method: 'GET',
        path: '/inventory/{id?}',
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
                let resultInventory = params.id ? await mongo.collection('inventory').findOne({ _id: mongoObjectId(params.id) }) : await mongo.collection('inventory').find().toArray()
                //ถ้ามี paramter id ข้อมูลที่ res จะเป็นแบบ Object สามารถ Assign ค่าได้เลยได้เลย
                //ดึงข้อมูลจากข้อมูล table อื่นจาก Reference Id

                if (params.id) {
                    resultInventory.masterInfo = await mongo.collection('master').findOne({ _id: mongoObjectId(resultInventory.masterId) });
                    resultInventory.inventoryLog = await mongo.collection('inventory-log').find({ inventoryId: resultInventory._id.toString() }).toArray()
                }
                //ถ้าข้อมูลไม่มี paramter id ข้อมูล res ที่ได้จะเป็นแบบ Array จะต้อง loop เพื่อ Assign ค่าที่ละตำแหน่ง
                //ดึงข้อมูลจากข้อมูล table อื่นจาก Reference Id 
                else {
                    for (let index in resultInventory) {
                        resultInventory[index].masterInfo = await mongo.collection('master').findOne({ _id: mongoObjectId(resultInventory[index].masterId) });
                    }
                }
                return {
                    statusCode: 200,
                    message: "OK",
                    data: resultInventory
                }
            } catch (error) {
                console.log(error)
                return (Boom.badGateway)
            }
        }
    },
    {  // POST Import/Export Item
        method: 'POST',
        path: '/inventory/import-export',
        config: {
            auth: false,
            tags: ['api'],
            description: 'Import Inventory',
            validate: {
                payload: {
                    userId: Joi.any().required(),
                    method: Joi.string().required(),
                    masterObject: Joi.array().items([{
                        masterBarcode: Joi.string().required(),
                        amount: Joi.number().integer().required()
                    }]).required()
                }
            }
        }, handler: async (request, reply) => {
            try {
                const mongo = Util.getDb(request)
                let payload = request.payload

                // Create LOG
                let log = Object.assign({}, payload)
                log.metadata = payload.masterObject
                log.timestamp = Date.now()
                delete log.masterObject

                for (const index in payload.masterObject) {
                    let resMaster = await mongo.collection('master').findOne({ masterBarcode: payload.masterObject[index].masterBarcode })
                    let resInventory = await mongo.collection('inventory').findOne({ masterBarcode: payload.masterObject[index].masterBarcode })
                    // เชคว่า Barcode มีอยู่ใน Master ไหม             
                    if (!resMaster) {
                        return {
                            statusCode: 403,
                            message: `Can't find Product Barcode ${payload.masterObject[index].masterBarcod}`,
                        }
                    }
                    //เชค Import ครั้งแรก
                    //ถ้า resInventory มีข้อมูลแสดงว่า Item ชิ้นนี้เคยถูกบันทึกลง Inventory แล้วสามารถ + จำนวนได้เลย
                    if (resInventory) {
                        //Update จำนวน Item
                        (payload.method == "import")
                            ? await mongo.collection('inventory').update({ _id: mongoObjectId(resInventory._id) }, { $inc: { inventoryAmountInstock: payload.masterObject[index].amount } }, { $set: { inventoryDateLastUpdate: Date.now() } })
                            : await mongo.collection('inventory').update({ _id: mongoObjectId(resInventory._id) }, { $inc: { inventoryAmountInstock: -payload.masterObject[index].amount } }, { $set: { inventoryDateLastUpdate: Date.now() } })
                    }
                    //Insert Item เข้า Inventory โดยอ้างอิงจาก Master
                    else {
                        // Info Inventory
                        let inventory = {
                            inventoryAmountInstock: payload.masterObject[index].amount,
                            inventoryAmountInOrder: 0,
                            inventoryAmountInShipping: 0,
                            inventoryDateFristImport: Date.now(),
                            masterId: resMaster._id,
                            masterBarcode: resMaster.masterBarcode
                        }
                        let insertInventory = await mongo.collection('inventory').insert(inventory)

                    }
                }
                // บันทึก LOG
                let insertInventoryLog = await mongo.collection('inventory-log').insert(log)

                return {
                    statusCode: 200,
                    message: "OK",
                }

            } catch (error) {
                console.log(error)
                return (Boom.badGateway(error))
            }
        }
    },
    {  // POST Adjust
        method: 'POST',
        path: '/inventory/adjust',
        config: {
            auth: false,
            tags: ['api'],
            description: 'Import Inventory',
            validate: {
                payload: {
                    userId: Joi.any().required(),
                    amount: Joi.number().required(),
                    inventoryId: Joi.any().required()
                }
            }
        }, handler: async (request, reply) => {
            try {
                const mongo = Util.getDb(request)

                let payload = request.payload
                // Create log info
                let log = Object.assign({}, payload)
                log.metadata = {
                    inventoryId: payload.inventoryId,
                    amount: payload.amount
                }
                log.method = 'adjust'
                log.timestamp = Date.now()
                delete log.amount
                delete log.inventoryId
                console.log(payload)
                //Update จำนวน Item
                let updateInventory = await mongo.collection('inventory').update({ _id: mongoObjectId(payload.inventoryId) }, { $set: { inventoryAmountInstock: payload.amount, inventoryDateLastUpdate: Date.now() } })
                let insertInventoryLog = await mongo.collection('inventory-log').insert(log)

                return {
                    statusCode: 200,
                    message: "OK",
                }

            } catch (error) {
                console.log(error)
                return (Boom.badGateway(error))
            }
        }
    },
    {  // GET Inventory
        method: 'GET',
        path: '/inventory/log',
        config: {
            auth: false,
            tags: ['api'],
            description: 'Get Inventory-Log-query-params',
            validate: {
                query: {
                    begin: Joi.number().integer().min(0).optional().description('begin datetime in unix timestamp'),
                    end: Joi.number().integer().min(0).optional().description('end datetime in unix timestamp'),
                    sort: Joi.number().integer().valid([1, -1]).optional().description('1 for asc & -1 for desc'),
                    limit: Joi.number().integer().min(1).optional().description('number of data to be shown')
                },
                options: {
                    allowUnknown: true
                }
            }
        },
        handler: async (request, reply) => {
            try {
                const db = Util.getDb(request)
                let payload = request.query
                let options: any = { query: {}, sort: {}, limit: 0 }

                for (const key in payload) {
                    switch (key) {
                        case 'begin':
                        case 'end':
                            if (options.query.timestamp == undefined) options.query.timestamp = {}
                            options.query.timestamp[key] = key == 'begin' ? { $gte: payload[key] } : { $lte: payload[key] }
                            break;
                        case 'sort':
                            options.sort = payload[key]
                            break;
                        case 'limit':
                            options.limit = payload[key]
                            break;
                        default:
                            options.query[key] = payload[key]
                            break;
                    }
                }

                let inventoryLogs = await db.collection('inventory-log').find(options.query).sort(options.sort).limit(options.limit).toArray()

                return {
                    statusCode: 200,
                    message: "OK",
                    data: inventoryLogs
                }
            } catch (error) {
                console.error(error)
                return Boom.badGateway(error.message, error.data)
            }
        }
    }

]