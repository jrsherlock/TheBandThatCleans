/**
 * Bulk Sign-In Sheet Upload Component
 * Allows Directors and Parent Volunteers to upload multiple sign-in sheets at once
 * Automatically identifies lots from image headers and processes all sheets
 */

import React, { useState, useRef } from 'react';
import { X, Upload, Loader2, CheckCircle, AlertTriangle, FileImage, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { validateImageFile, formatBytes } from '../../utils/imageCompression';

const BulkSignInSheetUpload = ({
  onClose,
  onSubmit,
  currentUser,
  availableLots = []
}) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [results, setResults] = useState(null);
  const fileInputRef = useRef(null);

  const MAX_FILES = 18; // Maximum number of parking lots

  // Handle file selection
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files || []);
    
    // Validate total file count
    if (selectedFiles.length + files.length > MAX_FILES) {
      toast.error(`Maximum ${MAX_FILES} images allowed`);
      return;
    }

    // Validate each file
    const validFiles = [];
    const errors = [];

    for (const file of files) {
      try {
        validateImageFile(file);
        validFiles.push({
          file,
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          preview: URL.createObjectURL(file),
          status: 'pending'
        });
      } catch (error) {
        errors.push(`${file.name}: ${error.message}`);
      }
    }

    if (errors.length > 0) {
      toast.error(`Some files were invalid:\n${errors.join('\n')}`);
    }

    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
      toast.success(`Added ${validFiles.length} image(s)`);
    }

    // Reset input
    event.target.value = '';
  };

  // Remove a file from the list
  const handleRemoveFile = (fileId) => {
    setSelectedFiles(prev => {
      const updated = prev.filter(f => f.id !== fileId);
      // Revoke object URL to prevent memory leaks
      const removed = prev.find(f => f.id === fileId);
      if (removed?.preview) {
        URL.revokeObjectURL(removed.preview);
      }
      return updated;
    });
  };

  // Clear all files
  const handleClearAll = () => {
    selectedFiles.forEach(f => {
      if (f.preview) {
        URL.revokeObjectURL(f.preview);
      }
    });
    setSelectedFiles([]);
    setResults(null);
  };

  // Process all uploaded images
  const handleProcessAll = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one image');
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      // Prepare files for submission
      const filesToProcess = selectedFiles.map(f => f.file);

      // Call parent submit handler with progress callback
      const result = await onSubmit(filesToProcess, (progress) => {
        setProcessingProgress(progress);
      });

      setResults(result);
      
      // Show summary toast
      const successCount = result.successful?.length || 0;
      const failCount = result.failed?.length || 0;
      
      if (failCount === 0) {
        toast.success(`✅ Successfully processed all ${successCount} sign-in sheets!`, {
          duration: 5000
        });
      } else {
        toast.error(`⚠️ Processed ${successCount} sheets, ${failCount} failed`, {
          duration: 5000
        });
      }

    } catch (error) {
      console.error('Bulk upload error:', error);
      toast.error(error.message || 'Failed to process sign-in sheets');
      setResults({
        successful: [],
        failed: selectedFiles.map(f => ({
          fileName: f.file.name,
          error: error.message || 'Processing failed'
        }))
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      selectedFiles.forEach(f => {
        if (f.preview) {
          URL.revokeObjectURL(f.preview);
        }
      });
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Bulk Sign-In Sheet Upload
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Upload up to {MAX_FILES} sign-in sheet images at once
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Upload Area */}
          {!results && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                disabled={isProcessing || selectedFiles.length >= MAX_FILES}
                className="hidden"
              />
              
              <div
                onClick={() => !isProcessing && selectedFiles.length < MAX_FILES && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isProcessing || selectedFiles.length >= MAX_FILES
                    ? 'border-gray-300 dark:border-gray-600 cursor-not-allowed opacity-50'
                    : 'border-gray-300 dark:border-gray-600 cursor-pointer hover:border-blue-500 dark:hover:border-blue-400'
                }`}
              >
                <Upload className="mx-auto text-gray-400 dark:text-gray-500 mb-3" size={48} />
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  Click to select images or drag and drop
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  JPEG, PNG up to 10MB each • {selectedFiles.length}/{MAX_FILES} selected
                </p>
              </div>
            </div>
          )}

          {/* Selected Files List */}
          {selectedFiles.length > 0 && !results && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Selected Images ({selectedFiles.length})
                </h3>
                <button
                  onClick={handleClearAll}
                  disabled={isProcessing}
                  className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 disabled:opacity-50"
                >
                  Clear All
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {selectedFiles.map((fileItem) => (
                  <div
                    key={fileItem.id}
                    className="relative group border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                  >
                    <img
                      src={fileItem.preview}
                      alt={fileItem.file.name}
                      className="w-full h-32 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={() => handleRemoveFile(fileItem.id)}
                        disabled={isProcessing}
                        className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 disabled:opacity-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="p-2 bg-gray-50 dark:bg-gray-900">
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {fileItem.file.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {formatBytes(fileItem.file.size)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Processing Progress */}
          {isProcessing && (
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-3">
                <Loader2 className="animate-spin text-blue-600 dark:text-blue-400" size={24} />
                <span className="text-gray-700 dark:text-gray-300">
                  Processing sign-in sheets...
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${processingProgress}%` }}
                />
              </div>
              <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                {processingProgress}% complete
              </p>
            </div>
          )}

          {/* Results Summary */}
          {results && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Processing Results
              </h3>

              {/* Successful uploads */}
              {results.successful && results.successful.length > 0 && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" size={20} />
                    <div className="flex-1">
                      <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                        Successfully Processed ({results.successful.length})
                      </h4>
                      <ul className="space-y-2 text-sm text-green-800 dark:text-green-200">
                        {results.successful.map((item, idx) => {
                          const totalStudents = item.totalStudentsFound || item.studentCount || 0;
                          const matched = item.matchedCount || 0;
                          const unmatched = item.unmatchedCount || 0;
                          const allMatched = totalStudents > 0 && unmatched === 0;

                          return (
                            <li key={idx} className="space-y-1">
                              <div className="font-medium">
                                ✓ {item.lotName}: {totalStudents} student{totalStudents !== 1 ? 's' : ''} found
                              </div>
                              {totalStudents > 0 && (
                                <div className="ml-4 text-xs space-y-0.5">
                                  {allMatched ? (
                                    <div className="text-green-700 dark:text-green-300">
                                      • All {matched} name{matched !== 1 ? 's' : ''} matched to roster
                                    </div>
                                  ) : (
                                    <>
                                      <div className="text-green-700 dark:text-green-300">
                                        • {matched} name{matched !== 1 ? 's' : ''} matched to roster
                                      </div>
                                      {unmatched > 0 && (
                                        <div className="text-amber-700 dark:text-amber-300">
                                          • {unmatched} student{unmatched !== 1 ? 's' : ''} require manual reconciliation
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Failed uploads */}
              {results.failed && results.failed.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" size={20} />
                    <div className="flex-1">
                      <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                        Failed to Process ({results.failed.length})
                      </h4>
                      <ul className="space-y-1 text-sm text-red-800 dark:text-red-200">
                        {results.failed.map((item, idx) => (
                          <li key={idx}>
                            ✗ {item.fileName}: {item.error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          {!results ? (
            <>
              <button
                onClick={onClose}
                disabled={isProcessing}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleProcessAll}
                disabled={isProcessing || selectedFiles.length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    <span>Process All ({selectedFiles.length})</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkSignInSheetUpload;

