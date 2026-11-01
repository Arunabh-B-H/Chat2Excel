const Conversion = require('../models/Conversion');
const User = require('../models/User');
const { 
  processUniversalDataEntry,
  processAccountingBatch, 
  processWithClaude, 
  parseWhatsAppText, 
  parseWhatsAppScreenshot 
} = require('../services/aiService');

// Verify user has sufficient credit balance before processing
const assertUserHasCredits = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User account not found');
    error.status = 401;
    throw error;
  }

  const isProActive =
    user.plan === 'pro_100' &&
    user.subscriptionExpiresAt &&
    new Date(user.subscriptionExpiresAt) > new Date();

  if (isProActive) {
    return { user, isProActive: true };
  }

  if (user.creditsRemaining <= 0) {
    const error = new Error('No credits remaining. Please upgrade your plan.');
    error.status = 403;
    throw error;
  }

  return { user, isProActive: false };
};

// Deduct one credit only after successful parsing
const deductOneCredit = async (user, isProActive) => {
  if (isProActive) return user.creditsRemaining;
  user.creditsRemaining = Math.max(0, user.creditsRemaining - 1);
  await user.save();
  return user.creditsRemaining;
};

// @desc    Unified Autonomous AI Data Entry processor (Any business text or screenshot)
// @route   POST /api/conversions/process
// @access  Private
exports.processConversion = async (req, res) => {
  const { 
    sourceType = 'text', 
    rawText, 
    imageBase64, 
    userInstructions,
    customInstructions, 
    customPrompt, 
    title 
  } = req.body;
  const userId = req.user.id;

  try {
    // 1. Verify credits before processing
    const { user, isProActive } = await assertUserHasCredits(userId);

    if (sourceType === 'text' && (!rawText || !rawText.trim())) {
      return res.status(400).json({ error: 'Chat text or business data content is required' });
    }

    if (sourceType === 'screenshot' && !imageBase64) {
      return res.status(400).json({ error: 'Screenshot image is required' });
    }

    const instructions = (userInstructions || customInstructions || customPrompt || '').trim();

    // 2. Call Autonomous Data Entry Specialist AI Engine
    const aiResult = await processUniversalDataEntry({
      sourceType,
      rawText,
      imageBase64,
      userInstructions: instructions,
      customInstructions: instructions,
      customPrompt: instructions
    });

    const records = aiResult.records || aiResult.messages || [];
    const columns = aiResult.columns || (records[0] ? Object.keys(records[0]) : []);

    // Normalize anomalies between anomalies and anomaliesFound
    const rawAnomalies = aiResult.auditSummary?.anomalies || aiResult.auditSummary?.anomaliesFound || [];
    const normalizedAnomalies = rawAnomalies.map((a) => ({
      rowNumber: a.rowNumber,
      identifier: a.identifier || a.customerName || `Row #${a.rowNumber}`,
      customerName: a.customerName || a.identifier || `Row #${a.rowNumber}`,
      issueType: a.issueType || 'DATA_ANOMALY',
      description: a.description || ''
    }));

    const auditSummary = {
      totalRecords: aiResult.auditSummary?.totalRecords || records.length,
      metrics: aiResult.auditSummary?.metrics || {
        totalSaleAmount: records.reduce((s, r) => s + (Number(r['Sale Amount'] || r['Total Amount'] || r.saleAmount || 0)), 0),
        totalReceivedAmount: records.reduce((s, r) => s + (Number(r['Received Amount'] || r['Amount Received'] || r['Amount Paid'] || r.receivedAmount || 0)), 0),
        totalBalancePending: records.reduce((s, r) => s + (Number(r['Remaining Balance'] || r['Balance Due'] || r.remainingBalance || 0)), 0)
      },
      anomalies: normalizedAnomalies,
      anomaliesFound: normalizedAnomalies,
      totalSaleAmount: aiResult.auditSummary?.totalSaleAmount || records.reduce((s, r) => s + (Number(r['Sale Amount'] || r['Total Amount'] || r.saleAmount || 0)), 0),
      totalReceivedAmount: aiResult.auditSummary?.totalReceivedAmount || records.reduce((s, r) => s + (Number(r['Received Amount'] || r['Amount Received'] || r['Amount Paid'] || r.receivedAmount || 0)), 0),
      totalBalancePending: aiResult.auditSummary?.totalBalancePending !== undefined 
        ? aiResult.auditSummary.totalBalancePending 
        : records.reduce((s, r) => s + (Number(r['Remaining Balance'] || r['Balance Due'] || r.remainingBalance || 0)), 0)
    };

    // 3. Save Conversion with rich dynamic schema
    const defaultTitle = `Data Entry Batch - ${new Date().toLocaleDateString()}`;
    const conversion = await Conversion.create({
      userId,
      sourceType,
      title: title || defaultTitle,
      userInstructions: instructions,
      customInstructions: instructions,
      customPrompt: instructions,
      rawInputSnippet: sourceType === 'text' ? (rawText?.slice(0, 500) || '') : '[Screenshot Base64 OCR]',
      records,
      columns,
      structuredData: records,
      auditSummary,
      analyticsSummary: {
        totalRecords: records.length,
        totalMessages: records.length,
        overview: `Parsed ${records.length} records into structured spreadsheet format.`,
        keyTakeaway: normalizedAnomalies.length > 0 
          ? `Data quality audit flagged ${normalizedAnomalies.length} anomaly (verify contact digits or duplicate records).`
          : 'All entries, entity mappings, and tabular calculations verified successfully.'
      }
    });

    // 4. Deduct credit after success
    const remaining = await deductOneCredit(user, isProActive);

    return res.status(201).json({
      success: true,
      conversionId: conversion._id,
      _id: conversion._id,
      conversion,
      records,
      columns,
      auditSummary,
      recordsCount: records.length,
      creditsRemaining: remaining
    });
  } catch (err) {
    console.error('Unified extraction error:', err.response?.data || err.message);
    const status = err.status || (err.response?.status) || 500;
    return res.status(status).json({
      error: err.message || 'AI extraction failed',
      details: err.message
    });
  }
};

// @desc    Parse raw WhatsApp text via OpenRouter (Legacy wrapper)
// @route   POST /api/conversions/parse-text
// @access  Private
exports.parseText = async (req, res) => {
  try {
    const { text, title } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'WhatsApp chat text content is required' });
    }

    const { user, isProActive } = await assertUserHasCredits(req.user.id);
    const parsedData = await parseWhatsAppText(text);

    const conversion = await Conversion.create({
      userId: req.user.id,
      sourceType: 'text',
      title: title || `WhatsApp Chat (${parsedData.messages?.length || 0} msgs)`,
      rawInputSnippet: text.length > 500 ? text.substring(0, 500) + '...' : text,
      structuredData: parsedData.messages || [],
      analyticsSummary: parsedData.summary || {
        totalRecords: (parsedData.messages || []).length,
        overview: 'Parsed successfully'
      }
    });

    const remaining = await deductOneCredit(user, isProActive);

    return res.status(201).json({
      success: true,
      conversion,
      creditsRemaining: remaining
    });
  } catch (error) {
    console.error('Error in parseText:', error);
    return res.status(error.status || 500).json({
      error: error.message || 'Failed to parse WhatsApp text'
    });
  }
};

// @desc    Parse WhatsApp screenshot via OpenRouter Vision API (Legacy wrapper)
// @route   POST /api/conversions/parse-screenshot
// @access  Private
exports.parseScreenshot = async (req, res) => {
  try {
    let imageBase64;
    let mimeType = 'image/png';
    let fileSnippet = '[Screenshot Uploaded]';

    if (req.body && req.body.image) {
      const rawImage = req.body.image;
      if (typeof rawImage === 'string') {
        const matches = rawImage.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
        if (matches) {
          mimeType = matches[1];
          imageBase64 = matches[2];
        } else {
          imageBase64 = rawImage;
        }
        fileSnippet = '[Direct Base64 Screenshot]';
      }
    }

    if (!imageBase64 && req.file && req.file.buffer) {
      imageBase64 = req.file.buffer.toString('base64');
      mimeType = req.file.mimetype || 'image/png';
      fileSnippet = `[Screenshot file: ${req.file.originalname || 'image.png'}]`;
    }

    if (!imageBase64) {
      return res.status(400).json({ error: 'Screenshot image file is required (PNG, JPG, or WEBP)' });
    }

    const { user, isProActive } = await assertUserHasCredits(req.user.id);
    const title = req.body.title || `Screenshot OCR (${new Date().toLocaleDateString()})`;

    const parsedData = await parseWhatsAppScreenshot(imageBase64, mimeType);

    const conversion = await Conversion.create({
      userId: req.user.id,
      sourceType: 'screenshot',
      title,
      rawInputSnippet: fileSnippet,
      structuredData: parsedData.messages || [],
      analyticsSummary: parsedData.summary || {
        totalRecords: (parsedData.messages || []).length,
        overview: 'Screenshot parsed successfully'
      }
    });

    const remaining = await deductOneCredit(user, isProActive);

    return res.status(201).json({
      success: true,
      conversion,
      creditsRemaining: remaining
    });
  } catch (error) {
    console.error('Error in parseScreenshot:', error);
    return res.status(error.status || 500).json({
      error: error.message || 'Failed to parse WhatsApp screenshot'
    });
  }
};

// @desc    Get all conversions for logged in user
// @route   GET /api/conversions
// @access  Private
exports.getUserConversions = async (req, res) => {
  try {
    const conversions = await Conversion.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .select('-rawInputSnippet')
      .limit(50);

    return res.json({ success: true, count: conversions.length, conversions });
  } catch (error) {
    console.error('Error in getUserConversions:', error);
    return res.status(500).json({ error: 'Failed to retrieve conversions', message: error.message });
  }
};

// @desc    Get conversion by ID
// @route   GET /api/conversions/:id
// @access  Private
exports.getConversionById = async (req, res) => {
  try {
    const conversion = await Conversion.findById(req.params.id);

    if (!conversion) {
      return res.status(404).json({ error: 'Conversion not found' });
    }

    if (conversion.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: 'Not authorized to access this conversion' });
    }

    const obj = conversion.toObject();
    return res.json({
      success: true,
      conversion,
      ...obj
    });
  } catch (error) {
    console.error('Error in getConversionById:', error);
    return res.status(500).json({ error: 'Failed to retrieve conversion', message: error.message });
  }
};

// @desc    Delete conversion
// @route   DELETE /api/conversions/:id
// @access  Private
exports.deleteConversion = async (req, res) => {
  try {
    const conversion = await Conversion.findById(req.params.id);

    if (!conversion) {
      return res.status(404).json({ error: 'Conversion not found' });
    }

    if (conversion.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this conversion' });
    }

    await Conversion.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Conversion deleted successfully' });
  } catch (error) {
    console.error('Error in deleteConversion:', error);
    return res.status(500).json({ error: 'Failed to delete conversion', message: error.message });
  }
};
