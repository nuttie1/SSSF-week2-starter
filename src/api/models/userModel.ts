import mongoose from 'mongoose';
import {User} from '../../types/DBTypes';

const userSchema = new mongoose.Schema({
  user_name: {type: String, required: true},
  email: {type: String, required: true, unique: true},
  role: {
    type: String,
    required: true,
    enum: ['admin', 'user'],
    default: 'user',
  },
  password: {type: String, required: true},
});

export const userModel = mongoose.model<User>('User', userSchema);
export default userModel;
