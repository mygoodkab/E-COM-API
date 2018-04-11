import * as crypto from 'crypto';
import { Db } from 'mongodb';
import * as pathSep from 'path';
import * as fs from 'fs';
import * as util from './util';
export class Util {
	// tslint:disable:indent
	public static getDb(request: any): Db {
		return request.mongo.db;
	}
	public static uniqid() {
		const uniqid = require('uniqid');
		return uniqid();
	}
	public static uploadRootPath() {
		const path = __dirname + '../upload';
		return path;
	}
	public static hash(data: any) {
		const hash = crypto.createHash('sha256');
		hash.update(JSON.stringify(data));
		const key = hash.digest('hex');
		return key;
	}
	public static jwtKey() {
		return 'xxxxx';
	}
	public static async writeLog(request, payload, collection, method) {
		try {
			const mongo = Util.getDb(request);
			payload.method = method;
			const insertlog = await mongo.collection(collection).insert(payload);
		} catch (error) {
			return false;
		}
	}
	public static async upload(fileUpload, path) {
		try {
			let filename = fileUpload.hapi.filename.split('.');
			const fileType = filename.splice(filename.length - 1, 1)[0];
			filename = filename.join('.');
			const storeName = util.Util.uniqid + '.' + fileType.toLowerCase();
			// create imageInfo for insert info db
			const fileInfo: any = {
				name: filename,
				storeName,
				fileType,
				ts: new Date(),
			};
			// create file Stream
			const location = __dirname + pathSep.sep + 'upload' + pathSep.sep + fileInfo.name + '.' + fileType.toLowerCase();
			if (!util.Util.existFolder) {
				return ({
					status: false,
					data: fileInfo
				});
			}
			const file = await fs.createWriteStream(location);
			await file.on('error', async (err: any) => {
				console.log(err);
				return ({
					status: false,
					data: fileInfo
				});
			});
			fileUpload.pipe(file);
			await fileUpload.on('end', async (err: any) => {
				const filestat = fs.statSync(location);
				fileInfo.fileSize = filestat.size;
				fileInfo.createdata = new Date();
				return ({
					status: true,
					data: fileInfo
				});
			});
		} catch (error) {
			return false;
		}
	}
	public static existFolder(path) {
		if (!fs.existsSync(path)) {
			fs.mkdir(path, (err) => {
				return true;
			});
		} else {
			return false;
		}
	}
}
