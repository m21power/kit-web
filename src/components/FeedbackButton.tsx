import React, { useState } from 'react';
import { MessageSquare, Send, X, Lightbulb } from 'lucide-react';
import { ApiService } from '../services/api';

interface FeedbackButtonProps {
  username: string;
}

export const FeedbackButton: React.FC<FeedbackButtonProps> = ({ username }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!feedback.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await ApiService.sendFeedback(username, feedback.trim(), fullName.trim());
      if (response.success) {
        setSubmitted(true);
        setTimeout(() => {
          setIsOpen(false);
          setSubmitted(false);
          setFeedback('');
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to send feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setFeedback('');
    setFullName('');
    setSubmitted(false);
  };

  return (
    <>
      {/* Feedback Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 px-3 py-1.5 bg-[#007acc] hover:bg-[#005a9e] text-white text-sm rounded-md transition-colors duration-200"
        title="Share your ideas about Kit"
      >
        <Lightbulb className="w-4 h-4" />
        <span>Give Feedback</span>
      </button>

      {/* Feedback Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#252526] border border-[#3c3c3c] rounded-lg shadow-2xl w-full max-w-md mx-4">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#3c3c3c]">
              <div className="flex items-center space-x-2">
                <Lightbulb className="w-5 h-5 text-[#007acc]" />
                <h3 className="text-lg font-semibold text-[#cccccc]">Share Your Ideas</h3>
              </div>
              <button
                onClick={handleClose}
                className="p-1 hover:bg-[#3c3c3c] rounded transition-colors"
              >
                <X className="w-4 h-4 text-[#cccccc]" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              {submitted ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-lg font-medium text-[#cccccc] mb-2">Thank you!</h4>
                  <p className="text-[#969696]">Your feedback has been sent successfully.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#cccccc] mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full px-3 py-2 bg-[#3c3c3c] border border-[#464647] rounded-md text-[#cccccc] placeholder-[#969696] focus:ring-2 focus:ring-[#007acc] focus:border-transparent"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#cccccc] mb-2">
                      What do you think about Kit? Any suggestions or ideas?
                    </label>
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Share your thoughts about the Kit version control system, features you'd like to see, improvements, or any other ideas..."
                      className="w-full h-32 px-3 py-2 bg-[#3c3c3c] border border-[#464647] rounded-md text-[#cccccc] placeholder-[#969696] focus:ring-2 focus:ring-[#007acc] focus:border-transparent resize-none"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="text-xs text-[#969696] bg-[#1e1e1e] p-3 rounded border border-[#3c3c3c]">
                    <div className="flex items-start space-x-2">
                      <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <p>We'll receive your username ({username}) and your message to help improve Kit.</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="flex-1 px-4 py-2 bg-[#3c3c3c] hover:bg-[#464647] text-[#cccccc] rounded-md transition-colors"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!feedback.trim() || !fullName.trim() || isSubmitting}
                      className="flex-1 px-4 py-2 bg-[#007acc] hover:bg-[#005a9e] disabled:bg-[#464647] disabled:text-[#969696] text-white rounded-md transition-colors flex items-center justify-center space-x-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Send Feedback</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};