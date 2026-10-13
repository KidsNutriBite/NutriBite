const mongoose = require('mongoose');

/**
 * Lifecycle status states for Dynamic Entities
 * PROPOSED -> REVIEW -> VALIDATED -> TRAINING -> EVALUATED -> ACTIVE
 * Also supports: DEPRECATED, REJECTED
 */
const DynamicEntityStatus = [
  'PROPOSED',
  'REVIEW',
  'VALIDATED',
  'TRAINING',
  'EVALUATED',
  'ACTIVE',
  'DEPRECATED',
  'REJECTED'
];

const SeedExampleSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true
  },
  surface_span: {
    type: String,
    required: true,
    trim: true
  },
  start_char: {
    type: Number,
    default: null
  },
  end_char: {
    type: Number,
    default: null
  },
  source_context: {
    type: String,
    default: 'CLINICAL_GUIDELINE'
  },
  clinical_notes: {
    type: String,
    default: ''
  }
}, { _id: false });

const LifecycleHistorySchema = new mongoose.Schema({
  from_status: {
    type: String,
    enum: DynamicEntityStatus,
    required: true
  },
  to_status: {
    type: String,
    enum: DynamicEntityStatus,
    required: true
  },
  changed_by: {
    type: String,
    default: 'SYSTEM'
  },
  reason: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const DynamicEntitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Entity name is required'],
    unique: true,
    trim: true,
    uppercase: true,
    match: [/^[A-Z0-9_]+$/, 'Entity name must contain only uppercase letters, numbers, and underscores']
  },
  display_name: {
    type: String,
    required: [true, 'Display name is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Entity category is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Entity description is required'],
    trim: true
  },
  aliases: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  seed_examples: [SeedExampleSchema],
  schema_version: {
    type: String,
    default: '2.1.0',
    trim: true
  },
  status: {
    type: String,
    enum: DynamicEntityStatus,
    default: 'PROPOSED'
  },
  precedence_rank: {
    type: Number,
    default: 50
  },
  downstream_rag_use: {
    type: String,
    default: ''
  },
  is_flagship: {
    type: Boolean,
    default: false
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  lifecycle_history: [LifecycleHistorySchema]
}, {
  timestamps: true
});

// Indexes for fast lookup and filtering
DynamicEntitySchema.index({ name: 1 }, { unique: true });
DynamicEntitySchema.index({ status: 1 });
DynamicEntitySchema.index({ schema_version: 1 });
DynamicEntitySchema.index({ aliases: 1 });

module.exports = mongoose.model('DynamicEntity', DynamicEntitySchema);
