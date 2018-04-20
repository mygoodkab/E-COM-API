import { Util } from './util';
import * as fs from 'fs';
import * as pathSep from 'path';
const upload = (file: any, location: string, validateType: any[]) => {
    if (!file) { throw new Error('No File(s)'); }
    return Array.isArray(file) ? multiUpload(file, location, validateType) : fileUpload(file, location, validateType);
};

// 1 file upload
const fileUpload = (file: any, location: string, validateType: any[]) => {
    if (!file) { throw new Error('No File(s)'); }
    let filename = file.hapi.filename.split('.');
    const fileType = filename.splice(filename.length - 1, 1)[0];
    const storeName = Util.uniqid() + '.' + fileType.toLowerCase();
    filename = filename.join('.');
    // validate file type
    if (validateType.indexOf(fileType.toLowerCase()) <= -1) { throw new Error('Type is NOT allowed'); }

    // create imageInfo for insert info db
    const fileInfo: any = {
        orignalName: filename,
        storeName,
        fileType,
        ts: new Date(),
    };

    // path file
    const path = pathSep.join(location, fileInfo.storeName);

    // Create File Stream
    const fileStrem = fs.createWriteStream(path);

    // Return Promise Becuase HAPI v.17
    return new Promise((resolve, reject) => {

        // Upload Error
        file.on('error', (err: any) => {
            reject(err);
        });

        // Pip file
        file.pipe(fileStrem);

        // Endding uploadfile
        file.on('end', async (err: any) => {
            const filestat = fs.statSync(path);
            fileInfo.fileSize = filestat.size;
            fileInfo.createdata = new Date();
            resolve(fileInfo);
        });
    });
};

// many files
const multiUpload = (files: any[], location: string, validateType: any[]) => {
    if (!files) { throw new Error('No File(s)'); }
    const promises = files.map((file) => fileUpload(file, location, validateType));
    return Promise.all(promises);
};

export { upload };
