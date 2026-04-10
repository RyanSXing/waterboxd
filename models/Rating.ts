import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IRating extends Document {
  userId: mongoose.Types.ObjectId
  waterId: mongoose.Types.ObjectId
  score: number
  review: string
  drankOn: Date | null
  createdAt: Date
}

const RatingSchema = new Schema<IRating>({
  userId:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
  waterId: { type: Schema.Types.ObjectId, ref: 'Water', required: true },
  score:   { type: Number, required: true, min: 0.5, max: 5 },
  review:  { type: String, default: '' },
  drankOn: { type: Date, default: null },
}, { timestamps: true })

RatingSchema.index({ userId: 1, waterId: 1 }, { unique: true })

export const Rating: Model<IRating> = mongoose.models.Rating ?? mongoose.model('Rating', RatingSchema)
