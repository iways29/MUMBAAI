import React from 'react';
import { MessageCircle, Sparkles, HelpCircle } from 'lucide-react';

interface EmptyStateProps {
  onStartTutorial?: () => void;
  onCreateConversation?: () => void;
  showTutorialPrompt?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onStartTutorial,
  onCreateConversation,
  showTutorialPrompt = true
}) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="text-center max-w-lg px-6">
        {/* Logo/Icon */}
        <div className="relative mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
            <Sparkles size={40} className="text-white" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <MessageCircle size={16} className="text-white" />
          </div>
        </div>

        {/* Main Content */}
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to FlowChatAI
        </h1>
        
        <p className="text-xl text-gray-600 mb-8 leading-relaxed">
          Transform your conversations into beautiful, interactive trees where every response creates a new branch of possibilities.
        </p>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <MessageCircle size={24} className="text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Visual Conversations</h3>
            <p className="text-sm text-gray-600">See your chat history as an interactive tree</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Sparkles size={24} className="text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Smart Merging</h3>
            <p className="text-sm text-gray-600">Combine different conversation paths with AI</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <HelpCircle size={24} className="text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Explore Ideas</h3>
            <p className="text-sm text-gray-600">Navigate and branch conversations freely</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          {showTutorialPrompt && onStartTutorial && (
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
              <h3 className="text-lg font-semibold mb-2">New to FlowChatAI?</h3>
              <p className="text-blue-100 mb-4">Take a 3-minute interactive tour to see how it works!</p>
              <button
                onClick={onStartTutorial}
                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors w-full"
              >
                Start Interactive Tutorial
              </button>
            </div>
          )}

          {onCreateConversation && (
            <button
              onClick={onCreateConversation}
              className="bg-gray-900 text-white px-8 py-4 rounded-lg font-medium hover:bg-gray-800 transition-colors w-full text-lg"
            >
              Start Your First Conversation
            </button>
          )}

          {onStartTutorial && (
            <button
              onClick={onStartTutorial}
              className="text-gray-600 hover:text-gray-800 transition-colors flex items-center justify-center gap-2"
            >
              <HelpCircle size={16} />
              View Tutorial
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-400">
            💡 Pro tip: Try asking about project ideas, creative solutions, or any topic you'd like to explore from multiple angles
          </p>
        </div>
      </div>
    </div>
  );
};