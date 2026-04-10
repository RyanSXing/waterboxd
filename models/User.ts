import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IUser extends Document {
  username: string
  email: string
  passwordHash: string
  avatar: string
  bio: string
  createdAt: Date
  following: mongoose.Types.ObjectId[]
  followers: mongoose.Types.ObjectId[]
  wantList: mongoose.Types.ObjectId[]
}

const UserSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  avatar:   { type: String, default: '' },
  bio:      { type: String, default: '' },
  following: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  followers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  wantList:  [{ type: Schema.Types.ObjectId, ref: 'Water' }],
}, { timestamps: true })

export const User: Model<IUser> = mongoose.models.User ?? mongoose.model('User', UserSchema)
