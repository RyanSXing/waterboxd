import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IList extends Document {
  userId: mongoose.Types.ObjectId
  title: string
  description: string
  waters: mongoose.Types.ObjectId[]
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
}

const ListSchema = new Schema<IList>({
  userId:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title:       { type: String, required: true },
  description: { type: String, default: '' },
  waters:      [{ type: Schema.Types.ObjectId, ref: 'Water' }],
  isPublic:    { type: Boolean, default: true },
}, { timestamps: true })

export const List: Model<IList> = mongoose.models.List ?? mongoose.model('List', ListSchema)
