import React, { useState } from 'react';
import { 
  MessageSquare, XCircle, RefreshCw, Send,
  MessageCircle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import type { Lead } from '@/utils/crm';

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  comment: string;
  onCommentChange: (comment: string) => void;
  onPostComment: () => Promise<void>;
  isPosting: boolean;
}

const CommentModal: React.FC<CommentModalProps> = ({
  isOpen,
  onClose,
  lead,
  comment,
  onCommentChange,
  onPostComment,
  isPosting
}) => {
  const [characterCount, setCharacterCount] = useState(0);

  if (!isOpen || !lead) return null;

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    onCommentChange(value);
    setCharacterCount(value.length);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isPosting) {
      e.preventDefault();
      if (comment.trim()) {
        onPostComment();
      }
    }
  };

  const handleSubmit = () => {
    if (comment.trim() && !isPosting) {
      onPostComment();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-auto overflow-hidden transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-6 w-6 text-white" />
                <h2 className="text-lg font-bold text-white">Add Comment</h2>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {/* Lead Info */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                {lead.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{lead.name}</h3>
                <p className="text-sm text-gray-600">
                  {lead.phone} • {lead.company || 'No company'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Comment Input */}
          <div className="p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Comment
            </label>
            <textarea
              value={comment}
              onChange={handleCommentChange}
              onKeyDown={handleKeyDown}
              placeholder="Type your comment here..."
              className="w-full min-h-[120px] p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={4}
              autoFocus
              maxLength={500}
            />
            
            {/* Character Count */}
            <div className="flex justify-between items-center mt-2">
              <span className={`text-xs ${characterCount > 500 ? 'text-red-600' : 'text-gray-500'}`}>
                {characterCount}/500 characters
              </span>
              <span className="text-xs text-gray-500">
                Press Enter to post (Shift+Enter for new line)
              </span>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
              disabled={isPosting}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!comment.trim() || isPosting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
            >
              {isPosting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Post Comment
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CommentModal;