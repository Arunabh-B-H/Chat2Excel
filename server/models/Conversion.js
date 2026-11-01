const mongoose = require('mongoose');

const conversionSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  sourceType: { 
    type: String, 
    enum: ['text', 'screenshot', 'merged_batch'], 
    required: true 
  },
  title: { 
    type: String, 
    default: 'Data Entry Batch' 
  },
  userInstructions: {
    type: String
  },
  customInstructions: {
    type: String
  },
  customPrompt: {
    type: String,
    default: 'Extract: Timestamp, Sender, Message, Category, Sentiment, Action Item'
  },
  rawInputSnippet: { 
    type: String 
  },
  records: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  },
  columns: {
    type: [String],
    default: []
  },
  structuredData: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  },
  auditSummary: {
    totalRecords: { type: Number, default: 0 },
    totalSaleAmount: { type: Number, default: 0 },
    totalReceivedAmount: { type: Number, default: 0 },
    totalBalancePending: { type: Number, default: 0 },
    metrics: { type: mongoose.Schema.Types.Mixed, default: {} },
    anomalies: [
      {
        rowNumber: Number,
        identifier: String,
        issueType: String,
        description: String
      }
    ],
    anomaliesFound: [
      {
        rowNumber: Number,
        customerName: String,
        issueType: String,
        description: String
      }
    ]
  },
  analyticsSummary: {
    totalRecords: { type: Number, default: 0 },
    totalMessages: { type: Number, default: 0 },
    topTopics: [{ type: String }],
    metrics: { type: mongoose.Schema.Types.Mixed, default: {} },
    overview: { type: String, default: '' },
    keyTakeaway: { type: String, default: '' }
  },
  createdAt: { 
    type: Date, 
    default: Date.now,
    index: true
  }
}, { strict: false });

module.exports = mongoose.model('Conversion', conversionSchema);
