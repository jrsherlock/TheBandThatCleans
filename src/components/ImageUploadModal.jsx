/**
 * Image Upload Modal Component
 * Allows Directors/Volunteers to upload sign-in sheet photos for OCR processing
 * MVP Feature: Hybrid paper/digital workflow
 */

import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import apiService from '../../api-service.js';

const ImageUploadModal = ({ isOpen, onClose, lotId, lotName, onUploadComplete }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [ocrResult, setOcrResult] = useState(null);
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, or HEIC)');
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('Image file is too large. Maximum size is 10MB.');
      return;
    }

    setSelectedFile(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files[0];
    if (file) {
      // Simulate file input change
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInputRef.current.files = dataTransfer.files;
      handleFileSelect({ target: { files: [file] } });
    }
  };

  // Handle upload and OCR processing
  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select an image first');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(10);

      // Convert image to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Image = e.target.result;
        setUploadProgress(30);

        try {
          // Upload to backend for OCR processing
          const result = await apiService.uploadImageForOcr(lotId, base64Image, 'Director');
          setUploadProgress(100);

          // Store OCR result
          setOcrResult(result);

          toast.success('Image uploaded and processed successfully!');

          // Notify parent component
          if (onUploadComplete) {
            onUploadComplete(result);
          }

        } catch (error) {
          console.error('OCR processing error:', error);
          toast.error(error.message || 'Failed to process image. Please try again.');
          setIsUploading(false);
          setUploadProgress(0);
        }
      };

      reader.onerror = () => {
        toast.error('Failed to read image file');
        setIsUploading(false);
        setUploadProgress(0);
      };

      reader.readAsDataURL(selectedFile);

    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image. Please try again.');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Reset modal state
  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsUploading(false);
    setUploadProgress(0);
    setOcrResult(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Upload Sign-In Sheet</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{lotName}</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            disabled={isUploading}
          >
            <X className="text-gray-600 dark:text-gray-400" size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Upload Area */}
          {!previewUrl && (
            <div
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mx-auto text-gray-400 dark:text-gray-500 mb-4" size={48} />
              <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Drop image here or click to browse
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Supports JPEG, PNG, HEIC (max 10MB)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/heic"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}

          {/* Image Preview */}
          {previewUrl && !ocrResult && (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Sign-in sheet preview"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600"
                />
                {!isUploading && (
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                    className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Processing image...</span>
                    <span className="text-blue-600 dark:text-blue-400 font-medium">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* OCR Results */}
          {ocrResult && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg">
                <CheckCircle className="text-green-600 dark:text-green-400 flex-shrink-0" size={24} />
                <div>
                  <h3 className="font-semibold text-green-800 dark:text-green-300">Processing Complete!</h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Image uploaded and text extracted successfully.
                  </p>
                </div>
              </div>

              {/* Extracted Data */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-gray-900 dark:text-white">Extracted Information:</h4>
                
                {ocrResult.extractedCount !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Student Count:</span>
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {ocrResult.extractedCount}
                    </span>
                  </div>
                )}

                {ocrResult.ocrResult && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Raw OCR Text:</p>
                    <div className="bg-white dark:bg-gray-800 rounded p-3 text-xs font-mono text-gray-700 dark:text-gray-300 max-h-40 overflow-y-auto">
                      {ocrResult.ocrResult}
                    </div>
                  </div>
                )}

                {ocrResult.warning && (
                  <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded">
                    <AlertTriangle className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" size={16} />
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">{ocrResult.warning}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            disabled={isUploading}
          >
            {ocrResult ? 'Close' : 'Cancel'}
          </button>
          {!ocrResult && (
            <button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Processing...
                </>
              ) : (
                <>
                  <ImageIcon size={20} />
                  Upload & Process
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageUploadModal;

