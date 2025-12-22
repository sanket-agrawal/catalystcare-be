import mongoose from "mongoose";

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
  source : { type: String, required: false },
  phone : { type: String, required: false }
}, { timestamps: true });
const contactModel = mongoose.model("Contact", contactSchema);

export default contactModel;