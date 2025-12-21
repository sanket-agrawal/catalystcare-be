export const mongodbConfig = {
    uri: process.env.MONGO_URI || '',
    options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    },
    databaseName : process.env.MONGO_DB_NAME || 'catalystcare-dev',
};