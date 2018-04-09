import { Db } from 'mongodb';
import * as pathSep from 'path';
import * as crypto from 'crypto';

export class Util {
	static getDb(request: any): Db {
		return request.mongo.db;
	}
	static uniqid() {
		let uniqid = require('uniqid');
		return uniqid();
	}
	static uploadRootPath() {
		let path = __dirname + "../upload"
		return path;
	}
	static hash(data: any) {
		let hash = crypto.createHash('sha256')
		hash.update(JSON.stringify(data));
		let key = hash.digest('hex');
		return key;
	}
	static jwtKey() {
		return "xxxxx"
	}
	static async writeLog(request, payload, collection, method) {
		try {
			const mongo = Util.getDb(request)
			payload.method = method
			let insertlog = await mongo.collection(collection).insert(payload)
		} catch (error) {
			console.log(error)
			return false
		}
	}
}