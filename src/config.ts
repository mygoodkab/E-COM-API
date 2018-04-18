
const config = {
    path: {
        autoRoutes: [
            'dist',
            'routes',
            '*.js',
        ]
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
    }
};

export { config };
