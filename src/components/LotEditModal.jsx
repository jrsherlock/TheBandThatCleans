/**
 * TBTC Lot Edit Modal Component
 * Modal for editing lot details (extracted from Director Dashboard)
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Camera, Image } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

const MotionDiv = motion.div;

/**
 * LotEditModal - Modal for editing lot details
 */
const LotEditModal = ({ lot, onClose, onSave, onPhotoUpload }) => {
  const [comment, setComment] = useState("");
  const [studentCount, setStudentCount] = useState(0);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (lot) {
      setComment(lot.comment || "");
      setStudentCount(lot.totalStudentsSignedUp || 0);
    }
  }, [lot]);

  const handleSave = () => {
    if (lot) {
      onSave(lot.id, { 
        comment: comment.trim() || undefined, 
        totalStudentsSignedUp: studentCount 
      });
      toast.success(`${lot.name} details saved.`);
      onClose();
    }
  };

  const handlePhotoAttach = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (onPhotoUpload) {
          onPhotoUpload(lot.id, e.target.result); // Base64 string
          toast.success("Sign-up sheet photo attached.");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (!lot) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
      <MotionDiv
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md transition-colors duration-200"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Edit {lot.name}</h3>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            aria-label="Close modal"
          >
            <X size={20} className="text-gray-900 dark:text-gray-100" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Student Count */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Student Count (Signed Up)
            </label>
            <input
              type="number"
              value={studentCount}
              onChange={e => setStudentCount(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              min="0"
            />
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Comment (Optional)
            </label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Add any notes or special instructions..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500"
              rows={3}
            />
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sign-up Sheet Photo
            </label>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoAttach}
              ref={fileInputRef}
              id="lot-photo-input"
            />
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/60 transition-colors"
            >
              <Camera size={16} />
              <span>Upload Photo</span>
            </button>
            {lot.signUpSheetPhoto && (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 mt-2">
                <Image size={14} />
                <span>Photo attached</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button 
              onClick={handleSave} 
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
            >
              <Save size={16} />
              Save
            </button>
            <button 
              onClick={onClose} 
              className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </MotionDiv>
    </div>
  );
};

export default LotEditModal;

