import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IWater extends Document {
  slug: string
  name: string
  brand: string
  image: string
  type: 'still' | 'sparkling' | 'mineral' | 'alkaline'
  country: string
  sourceRegion: string
  ph: number | null
  tds: number | null
  hardness: 'soft' | 'medium' | 'hard' | null
  packaging: 'plastic' | 'glass' | 'aluminum' | 'carton'
  priceTier: 'budget' | 'mid' | 'premium' | 'luxury'
  carbonationLevel: 'light' | 'medium' | 'heavy' | null
  avgRating: number
  ratingCount: number
}

const WaterSchema = new Schema<IWater>({
  slug:        { type: String, required: true, unique: true },
  name:        { type: String, required: true },
  brand:       { type: String, required: true },
  image:       { type: String, required: true },
  type:        { type: String, enum: ['still','sparkling','mineral','alkaline'], required: true },
  country:     { type: String, required: true },
  sourceRegion:{ type: String, default: '' },
  ph:          { type: Number, default: null },
  tds:         { type: Number, default: null },
  hardness:    { type: String, enum: ['soft','medium','hard',null], default: null },
  packaging:   { type: String, enum: ['plastic','glass','aluminum','carton'], required: true },
  priceTier:   { type: String, enum: ['budget','mid','premium','luxury'], required: true },
  carbonationLevel: { type: String, enum: ['light','medium','heavy',null], default: null },
  avgRating:   { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
}, { timestamps: true })

WaterSchema.index({ name: 'text', brand: 'text' })

export const Water: Model<IWater> = mongoose.models.Water ?? mongoose.model('Water', WaterSchema)
