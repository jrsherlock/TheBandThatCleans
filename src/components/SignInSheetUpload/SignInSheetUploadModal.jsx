/**
 * Sign-In Sheet Upload Modal
 * Allows users to upload sign-in sheet photos and process them with AI
 */

import React, { useState, useRef } from 'react';
import { X, Upload, Camera, Loader2, CheckCircle, AlertTriangle, Edit2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { analyzeSignInSheet, isGeminiConfigured } from '../../services/geminiService';
import { compressImage, validateImageFile, formatBytes } from '../../utils/imageCompression';
import { hasExistingUpload, validateLotMatch } from '../../utils/lotMatching';
import ReuploadWarningModal from './ReuploadWarningModal';
import LotMismatchModal from './LotMismatchModal';

const SignInSheetUploadModal = ({
  lot,
  onClose,
  onSubmit,
  currentUser,
  availableLots = [] // All lots for mismatch detection
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [manualCount, setManualCount] = useState('');
  const [useManualEntry, setUseManualEntry] = useState(false);
  const [notes, setNotes] = useState('');

  // Validation states
  const [showReuploadWarning, setShowReuploadWarning] = useState(false);
  const [showLotMismatch, setShowLotMismatch] = useState(false);
  const [lotValidation, setLotValidation] = useState(null);
  const [bypassReuploadWarning, setBypassReuploadWarning] = useState(false);
  const [bypassLotMismatch, setBypassLotMismatch] = useState(false);

  const fileInputRef = useRef(null);

  const geminiConfigured = isGeminiConfigured();
  const hasExisting = hasExistingUpload(lot);

  // Handle file selection
  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    try {
      // Compress image
      toast.loading('Compressing image...', { id: 'compress' });
      const compressedFile = await compressImage(file, {
        maxWidth: 1200,
        maxHeight: 1600,
        quality: 0.85
      });
      toast.dismiss('compress');

      // Create preview
      const preview = URL.createObjectURL(compressedFile);
      setPreviewUrl(preview);
      setSelectedFile(compressedFile);
      setAiResult(null); // Reset AI result when new file selected

      toast.success(`Image ready (${formatBytes(compressedFile.size)})`);
    } catch (error) {
      console.error('Error processing image:', error);
      toast.error('Failed to process image');
    }
  };

  // Handle AI analysis
  const handleAnalyze = async () => {
    if (!selectedFile) {
      toast.error('Please select an image first');
      return;
    }

    if (!geminiConfigured) {
      toast.error('AI analysis not configured. Please use manual entry.');
      setUseManualEntry(true);
      return;
    }

    // Check for re-upload (only if not already bypassed)
    if (hasExisting && !bypassReuploadWarning) {
      setShowReuploadWarning(true);
      return;
    }

    setIsAnalyzing(true);

    try {
      toast.loading('Analyzing sign-in sheet with AI...', { id: 'analyze' });

      const result = await analyzeSignInSheet(selectedFile, lot.name, lot.id);

      toast.dismiss('analyze');
      setAiResult(result);

      // Validate lot match (only if not already bypassed)
      if (!bypassLotMismatch) {
        const validation = validateLotMatch(lot, result, availableLots);
        setLotValidation(validation);

        if (validation.shouldWarn) {
          setShowLotMismatch(true);
          return; // Don't show success toast yet
        }
      }

      // Show result notification
      if (result.confidence === 'high') {
        toast.success(`✅ Found ${result.count} students (High confidence)`);
      } else if (result.confidence === 'medium') {
        toast.success(`⚠️ Found ${result.count} students (Medium confidence - please verify)`, {
          duration: 5000
        });
      } else {
        toast.error(`⚠️ Found ${result.count} students (Low confidence - manual verification recommended)`, {
          duration: 6000
        });
      }

    } catch (error) {
      console.error('AI analysis error:', error);
      toast.dismiss('analyze');
      toast.error(error.message || 'Failed to analyze image');
      setUseManualEntry(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle re-upload warning
  const handleReuploadContinue = () => {
    setShowReuploadWarning(false);
    setBypassReuploadWarning(true);
    // Trigger analysis again with bypass flag set
    handleAnalyze();
  };

  const handleReuploadCancel = () => {
    setShowReuploadWarning(false);
    onClose();
  };

  // Handle lot mismatch
  const handleLotMismatchContinue = () => {
    setShowLotMismatch(false);
    setBypassLotMismatch(true);

    // Show success toast for the analysis
    if (aiResult) {
      if (aiResult.confidence === 'high') {
        toast.success(`✅ Found ${aiResult.count} students (High confidence)`);
      } else if (aiResult.confidence === 'medium') {
        toast.success(`⚠️ Found ${aiResult.count} students (Medium confidence - please verify)`, {
          duration: 5000
        });
      } else {
        toast.error(`⚠️ Found ${aiResult.count} students (Low confidence - manual verification recommended)`, {
          duration: 6000
        });
      }
    }
  };

  const handleLotMismatchCancel = () => {
    setShowLotMismatch(false);
    setAiResult(null); // Clear AI result
    toast.error('Upload cancelled due to lot mismatch');
  };

  const handleLotMismatchRedirect = (suggestedLot) => {
    toast.info(`Redirecting to ${suggestedLot.name}...`);
    setShowLotMismatch(false);
    onClose();
    // TODO: Parent component should handle opening upload modal for suggested lot
    // This would require passing a callback from parent
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Validate inputs
    if (!selectedFile && !useManualEntry) {
      toast.error('Please upload an image or use manual entry');
      return;
    }

    if (useManualEntry && !manualCount) {
      toast.error('Please enter a student count');
      return;
    }

    if (!useManualEntry && !aiResult) {
      toast.error('Please analyze the image first');
      return;
    }

    setIsUploading(true);

    try {
      // Prepare submission data
      const submissionData = {
        lotId: lot.id,
        lotName: lot.name,
        count: useManualEntry ? parseInt(manualCount) : aiResult.count,
        countSource: useManualEntry ? 'manual' : 'ai',
        confidence: useManualEntry ? 'manual' : aiResult.confidence,
        notes: notes || (aiResult?.notes || ''),
        enteredBy: currentUser.name,
        timestamp: new Date().toISOString(),
        imageFile: selectedFile,
        aiAnalysis: aiResult
      };

      // Call parent submit handler
      await onSubmit(submissionData);

      toast.success('Sign-in sheet uploaded successfully!');
      onClose();
      
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload sign-in sheet');
    } finally {
      setIsUploading(false);
    }
  };

  // Cleanup preview URL on unmount
  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Upload Sign-In Sheet
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {lot.name} • {lot.zone}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={24} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* AI Configuration Warning */}
          {!geminiConfigured && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" size={20} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    AI Analysis Not Available
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    Gemini API is not configured. You can still upload images and enter counts manually.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Upload Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sign-In Sheet Photo
            </label>
            
            {!previewUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
              >
                <Camera className="mx-auto text-gray-400 dark:text-gray-500 mb-3" size={48} />
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  Click to upload or drag and drop
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  JPEG, PNG up to 10MB
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <img
                  src={previewUrl}
                  alt="Sign-in sheet preview"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Change Image
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* AI Analysis Section */}
          {selectedFile && geminiConfigured && !useManualEntry && (
            <div>
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || aiResult}
                className="w-full px-4 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Analyzing with AI...
                  </>
                ) : aiResult ? (
                  <>
                    <CheckCircle size={20} />
                    Analysis Complete
                  </>
                ) : (
                  <>
                    <Upload size={20} />
                    Analyze with AI
                  </>
                )}
              </button>
            </div>
          )}

          {/* AI Results Display */}
          {aiResult && !useManualEntry && (
            <div className={`border rounded-lg p-4 ${
              aiResult.confidence === 'high' 
                ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
                : aiResult.confidence === 'medium'
                ? 'border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20'
                : 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
            }`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    AI Analysis Result
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {aiResult.count} students
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  aiResult.confidence === 'high'
                    ? 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100'
                    : aiResult.confidence === 'medium'
                    ? 'bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-100'
                    : 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100'
                }`}>
                  {aiResult.confidence} confidence
                </span>
              </div>
              
              {aiResult.notes && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {aiResult.notes}
                </p>
              )}

              <button
                onClick={() => setUseManualEntry(true)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <Edit2 size={14} />
                Override with manual count
              </button>
            </div>
          )}

          {/* Manual Entry Section */}
          {useManualEntry && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Student Count (Manual Entry)
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={manualCount}
                  onChange={(e) => setManualCount(e.target.value)}
                  placeholder="Enter number of students"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
              </div>
              
              {aiResult && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  AI suggested: {aiResult.count} students
                </p>
              )}
            </div>
          )}

          {/* Notes Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes or observations..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isUploading || (!aiResult && !useManualEntry) || (useManualEntry && !manualCount)}
            className="px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Uploading...
              </>
            ) : (
              <>
                <Upload size={18} />
                Submit
              </>
            )}
          </button>
        </div>
      </div>

      {/* Re-upload Warning Modal */}
      {showReuploadWarning && (
        <ReuploadWarningModal
          lot={lot}
          onContinue={handleReuploadContinue}
          onCancel={handleReuploadCancel}
        />
      )}

      {/* Lot Mismatch Modal */}
      {showLotMismatch && lotValidation && (
        <LotMismatchModal
          expectedLot={lot}
          detectedLot={lotValidation.detectedLot}
          detectedZone={lotValidation.detectedZone}
          confidence={lotValidation.confidence}
          onContinueAnyway={handleLotMismatchContinue}
          onCancel={handleLotMismatchCancel}
          onRedirect={handleLotMismatchRedirect}
          availableLots={availableLots}
        />
      )}
    </div>
  );
};

export default SignInSheetUploadModal;

