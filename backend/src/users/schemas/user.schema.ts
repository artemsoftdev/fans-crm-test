import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, index: true })
  name: string;

  @Prop({ required: true, unique: true, index: true })
  email: string;

  @Prop({ required: true, index: true })
  phone: string;

  @Prop({ required: true })
  birthdate: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ name: 'text', email: 'text', phone: 'text' });
