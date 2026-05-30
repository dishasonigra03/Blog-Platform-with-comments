const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a title'],
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters']
    },
    slug: {
      type: String,
      unique: true
    },
    content: {
      type: String,
      required: [true, 'Please provide content']
    },
    coverImage: {
      type: String,
      default: '' // Can be local path or external URL
    },
    tags: {
      type: [String],
      default: []
    },
    category: {
      type: String,
      required: [true, 'Please specify a category'],
      default: 'General'
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    commentsCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Create slug from title before saving
postSchema.pre('validate', function (next) {
  if (this.title && this.isModified('title')) {
    this.slug = slugify(this.title);
  }
  next();
});

// Helper function to slugify
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start
    .replace(/-+$/, '') // Trim - from end
    + '-' + Math.random().toString(36).substring(2, 6); // Add a small random hash to prevent collisions
}

module.exports = mongoose.model('Post', postSchema);
