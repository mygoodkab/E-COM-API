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
                let res = params.id ? await mongo.collection('category').findOne0({ _id: mongoObjectId(params.id) }) : await mongo.collection('category').find().toArray()
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
                    categoryeName: Joi.any(),
                    categoryDateCreate: Joi.any(),
                    userId: Joi.any(),
                }
            }
        },
        handler: async (request, reply) => {
            try {
                const mongo = Util.getDb(request)
                let payload = request.payload
                payload.categoryDateCreate = Date.now()
                let insert = await mongo.collection('category').insert(payload)
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