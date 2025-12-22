import { mongodbConfig } from '../../shared/config/mongo.config';
import mongoose from 'mongoose';

const mongoURI = mongodbConfig.uri;

const connectMongoDB = async () => {
    try {
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB successfully');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        throw error;
    }
};

export default connectMongoDB;