import * as  Boom from 'boom'
import { Util } from '../util';
import * as Joi from 'joi'
import * as JWT from 'jsonwebtoken';
import { request } from 'http';
const mongoObjectId = require('mongodb').ObjectId;
module.exports = [
    {   // Get Inventory
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
                let res = params.id ? await mongo.collection('inventory').find().toArray() : await mongo.collection('inventory').find({ _id: mongoObjectId(params.id) })
                return {
                    statusCode: 200,
                    message: "OK",
                    data: res
                }
            } catch (error) {
                console.log(error)
                return (Boom.badGateway)
            }
        }
    }
]