
import * as pathSep from 'path';
import { upload } from './upload';
const config = {
    path: {
        autoRoutes: [
            'dist',
            'routes',
            '*.js',
        ],
        upload: pathSep.join(__dirname, 'upload'),
        pdf: pathSep.join(__dirname, 'upload', 'document.pdf'),
    },
    mongodb: {
        port: '27017',
        address: 'localhost',
    },
    hapi: {
        port: '3000',
    },
    inventory: {
        status: {
            IN_STOCK: 'In Stock',
        },
    },
    fileType: {
        images: [
            'png',
            'jpg',
            'jpeg',
        ]
    },
    token: {
        timeout: '8h',
        preiousRefresh: 30 * 60 * 1000
    },
    timezone: {
        thai: 7 * 60 * 60 * 1000
    },
    regex: /[\S]+/,
};

export { config };
