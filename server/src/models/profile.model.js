import mongoose from 'mongoose';
import _import1 from './plugins/index.js';
const { toJSON, paginate } = _import1;

const profileSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
    },
    designation: {
      type: String,
      trim: true,
    },
    company: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    skills: {
      type: [String],
      default: [],
    },
    avatar: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
profileSchema.plugin(toJSON);
profileSchema.plugin(paginate);

/**
 * @typedef Profile
 */
const Profile = mongoose.model('Profile', profileSchema);

export default Profile;
