import { Util } from './util';
import * as fs from 'fs';

const upload = (file: any, detail: any) => {
    if (!file) {
        throw new Error('no file(s)')
    }

    let filename = file.hapi.filename.split('.');
    const fileType = filename.splice(filename.length - 1, 1)[0];
    const storeName = Util.uniqid() + '.' + fileType.toLowerCase();
    filename = filename.join('.');

    // create imageInfo for insert info db
    const fileInfo: any = {
        orignalName: filename,
        storeName,
        fileType,
        ts: new Date(),
    };

    // path file
    const path = detail.path + fileInfo.storeName

    // Create File Stream
    const fileStrem = fs.createWriteStream(path);


    // Return Promise Becuase HAPI v.17 
    return new Promise((resolve, reject) => {

        // Upload Error
        file.on('error', (err: any) => {
            reject(err)
        })

        // Pip file
        file.pipe(fileStrem);

        // Endding uploadfile
        file.on('end', async (err: any) => {
            const filestat = fs.statSync(path);
            fileInfo.fileSize = filestat.size;
            fileInfo.createdata = new Date();
            resolve(fileInfo);
        });
    })


}

export { upload }