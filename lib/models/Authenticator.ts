import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAuthenticator extends Document {
  userId: mongoose.Types.ObjectId;
  credentialID: string; // Base64URL string
  credentialPublicKey: string; // Base64URL string
  counter: number;
  transports?: string[];
}

const AuthenticatorSchema = new Schema<IAuthenticator>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  credentialID: { type: String, required: true, unique: true },
  credentialPublicKey: { type: String, required: true },
  counter: { type: Number, required: true },
  transports: { type: [String] },
});

export const Authenticator: Model<IAuthenticator> = 
  mongoose.models.Authenticator || mongoose.model<IAuthenticator>('Authenticator', AuthenticatorSchema);