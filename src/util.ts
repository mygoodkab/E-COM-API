import * as crypto from 'crypto';
import { Db } from 'mongodb';
import * as pathSep from 'path';

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

}
