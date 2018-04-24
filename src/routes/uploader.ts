import * as  Boom from 'boom';
import * as Joi from 'joi';
import { ObjectId } from 'mongodb';
import { Util } from '../util';
import * as pathSep from 'path';
import * as fs from 'fs';
import { upload } from '../upload';
import { config } from '../config';
const mongoObjectId = ObjectId;
module.exports = [
    {  // Upload Image
        method: 'POST',
        path: '/image',
        config: {
            auth: false,
            tags: ['api'],
            description: 'Upload file',
            notes: 'Upload file',
            validate: {
                payload: {
                    file: Joi.any().meta({ swaggerType: 'file' }).description('upload file image'),
                }
            },
            payload: {
                maxBytes: 5000000,
                parse: true,
                output: 'stream',
                allow: 'multipart/form-data',
            },
        },
        handler: async (req, reply) => {

            try {
                const payload = req.payload;
                const mongo = Util.getDb(req);

                // If folder is not exist and Create Floder
                if (!Util.existFolder(config.path.upload)) {
                    if (Util.mkdirFolder(config.path.upload)) {
                        throw new Error('False to create upload folder');
                    }
                }

                const path = config.path.upload;
                const fileDetail = await upload(payload.file, path, config.fileType.images);
                const insert = await mongo.collection('images').insert(fileDetail);

                return {
                    statusCode: 200,
                    massage: 'OK',
                    data: insert.insertedIds,
                };

            } catch (error) {
                return (Boom.badGateway(error));
            }
        }
    },
    {  // Get image file
        method: 'GET',
        path: '/image/{id}',
        config: {
            auth: false,
            tags: ['api'],
            description: 'Get image for UI',
            notes: 'Get image ',
            validate: {
                params: {
                    id: Joi.string().required().description('id image'),
                },
            },
        },
        handler: async (request, reply) => {
            const mongo = Util.getDb(request);
            try {
                const resUpload = await mongo.collection('images').findOne({ _id: mongoObjectId(request.params.id) });
                if (!resUpload) {
                    return {
                        statusCode: 404,
                        message: 'Bad Request',
                        data: 'Data not found'
                    };
                } else {
                    const path: any = pathSep.join(config.path.upload, resUpload.storeName);
                    return reply.file(path,
                        {
                            filename: resUpload.name + '.' + resUpload.fileType,
                            mode: 'inline'
                        });
                }
            } catch (error) {
                return (Boom.badGateway(error));
            }
        },
    },
    {  // Delete image file
        method: 'DELETE',
        path: '/image/{id}',
        config: {
            auth: false,
            tags: ['api'],
            description: 'Get image for UI',
            notes: 'Get image ',
            validate: {
                params: {
                    id: Joi.string().required().description('id image'),
                },
            },
        },
        handler: async (request, reply) => {
            try {
                const mongo = Util.getDb(request);
                const params = request.params;
                const res = await mongo.collection('images').findOne({ _id: mongoObjectId(params.id) });
                if (!res) { return Boom.badData('File not found (id)'); }
                if (Util.unlinkFile(pathSep.join(config.path.upload, res.storeName))) { return Boom.badData('File not found'); }
                return {
                    statusCode: 200,
                    massage: 'OK',
                };
            } catch (error) {
                return (Boom.badGateway(error));
            }
        },
    },
];
