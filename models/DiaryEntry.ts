import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IDiaryEntry extends Document {
  userId: mongoose.Types.ObjectId
  waterId: mongoose.Types.ObjectId
  ratingId: mongoose.Types.ObjectId | null
  drankOn: Date
  notes: string
  createdAt: Date
}

const DiaryEntrySchema = new Schema<IDiaryEntry>({
  userId:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
  waterId:  { type: Schema.Types.ObjectId, ref: 'Water', required: true },
  ratingId: { type: Schema.Types.ObjectId, ref: 'Rating', default: null },
  drankOn:  { type: Date, required: true },
  notes:    { type: String, default: '' },
}, { timestamps: true })

export const DiaryEntry: Model<IDiaryEntry> = mongoose.models.DiaryEntry ?? mongoose.model('DiaryEntry', DiaryEntrySchema)
