import * as  Boom from 'boom';
import * as Joi from 'joi';
import { ObjectId } from 'mongodb';
import { Util } from '../util';
import * as pathSep from 'path';
import * as fs from 'fs';

const mongoObjectId = ObjectId;

module.exports = [
    {
        method: 'POST',
        path: '/upload-image',
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
                output: 'stream'
            },
        },
        handler: (request, reply) => {
            const req: any = request;
            const payload = req.payload;
            const mongo = Util.getDb(request);
            try {
                if (payload.file) {
                    let filename = payload.file.hapi.filename.split('.');
                    const fileType = filename.splice(filename.length - 1, 1)[0];
                    const storeName = Util.uniqid() + '.' + fileType.toLowerCase();
                    filename = filename.join('.');

                    // create imageInfo for insert info db
                    const fileInfo: any = {
                        name: filename,
                        storeName,
                        fileType,
                        ts: new Date(),
                    };

                    // path file
                    const path = __dirname + pathSep.sep + 'upload' + pathSep.sep + fileInfo.name + '.' + fileType.toLowerCase();

                    // If folder is not exist
                    if (!Util.existFolder(path)) {
                        Boom.badRequest('False to create upload floder');
                    }

                    // Create File Stream
                    const file = fs.createWriteStream(path);

                    // If uploading error
                    file.on('error', (err: any) => {
                        console.log(err);
                        Boom.badRequest(err);
                    });

                    // Pip file
                    payload.file.pipe(file);

                    // If upload success
                    payload.file.on('end', async (err: any) => {
                        const filestat = fs.statSync(path);
                        fileInfo.fileSize = filestat.size;
                        fileInfo.createdata = new Date();
                        const insert = await mongo.collection('images').insert(fileInfo);
                        const latestInsert = await mongo.collection('images').findOne({ storeName });
                        return ({
                            statusCode: 200,
                            massage: 'OK',
                            data: latestInsert,
                        });
                    });

                } else {
                    Boom.badRequest('No such file in payload');
                }
            } catch (error) {
                return (Boom.badGateway(error));
            }
        }
    },
];
          //    /* upload image file */
            //    const filename = payload.file.hapi.filename.split('.');
            //    const fileType = filename.splice(filename.length - 1, 1)[0];
            //    filename = filename.join('.');
            //    const storeName = Util.uniqid() + '.' + fileType.toLowerCase();
            //    // create imageInfo for insert info db
            //    const fileInfo: any = {
            //        name: filename,
            //        storeName,
            //        fileType,
            //        ts: new Date(),
            //    };
            //    // create file Stream
            //    const location = __dirname + pathSep.sep + 'upload' + pathSep.sep + fileInfo.name + '.' + fileType.toLowerCase();
            //    const file = fs.createWriteStream(location);
            //    console.log(__dirname);
            //    file.on('error', (err: any) => {
            //        console.log(err);
            //    });
            //    payload.file.pipe(file);
            //    payload.file.on('end', async (err: any) => {
            //        const filestat = fs.statSync(location);
            //        fileInfo.fileSize = filestat.size;
            //        fileInfo.createdata = new Date();
            //        const insertImage = await mongo.collection('upload').insert(fileInfo);
            //    });
            //    /* Endding upload image file */
