import React, { useState, useRef, useEffect } from 'react';
import { ReactComponent as GoogleIcon } from '../../assets/google-gemini.svg';
import { ReactComponent as AnthropicIcon } from '../../assets/anthropic.svg';
import { ReactComponent as OpenAIIcon } from '../../assets/openai.svg';
import { getModels, getProviderInfo, type AppModel } from '../../services/configService.ts';

// Provider icons mapping
const providerIcons: Record<string, React.ReactNode> = {
  anthropic: <AnthropicIcon width={20} height={20} />,
  openai: <OpenAIIcon width={20} height={20} />,
  google: <GoogleIcon width={20} height={20} />,
};

interface LLMSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
}

export const LLMSelector: React.FC<LLMSelectorProps> = ({
  selectedModel,
  onModelChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [models, setModels] = useState<AppModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('');
  const popupRef = useRef<HTMLDivElement>(null);

  // Fetch models from database
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const dbModels = await getModels();
        setModels(dbModels);

        // Set initial active tab to first provider with models
        if (dbModels.length > 0) {
          const providers = [...new Set(dbModels.map(m => m.provider))];
          setActiveTab(providers[0] || '');
        }
      } catch (error) {
        console.error('Error fetching models:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, []);

  // Group models by provider
  const modelsByProvider = models.reduce((acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  }, {} as Record<string, AppModel[]>);

  // Get providers in order
  const providers = Object.keys(modelsByProvider);

  // Get current model info
  const currentModel = models.find(m => m.model_id === selectedModel) || models[0];

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleModelSelect = (modelId: string) => {
    onModelChange(modelId);
    setIsOpen(false);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-400 border border-gray-200 rounded-lg">
        <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
        <span>Loading models...</span>
      </div>
    );
  }

  // No models available
  if (models.length === 0) {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 border border-red-200 rounded-lg">
        <span>No models available</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Model Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
        title={`Current model: ${currentModel?.display_name || 'Unknown'}`}
      >
        {currentModel && providerIcons[currentModel.provider]}
        <span className="font-medium">{currentModel?.display_name || 'Select Model'}</span>
      </button>

      {/* Tabbed Popup */}
      {isOpen && (
        <div
          ref={popupRef}
          className="absolute bottom-full left-0 mb-2 w-[420px] bg-white border border-gray-200 rounded-xl shadow-lg z-50"
        >
          {/* Provider Tabs */}
          <div className="flex border-b border-gray-100 overflow-x-auto no-scrollbar">
            {providers.map((provider) => {
              const providerInfo = getProviderInfo(provider);
              return (
                <button
                  key={provider}
                  onClick={() => setActiveTab(provider)}
                  className={`flex-shrink-0 flex items-center justify-center gap-3 px-4 py-4 text-sm font-medium transition-colors min-w-fit ${
                    activeTab === provider
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  {providerIcons[provider] || <span className="w-5 h-5 rounded bg-gray-300"></span>}
                  <span className="whitespace-nowrap">{providerInfo.label}</span>
                </button>
              );
            })}
          </div>

          {/* Models Content */}
          <div className="p-4 max-h-80 overflow-y-auto">
            {modelsByProvider[activeTab]?.map((model) => (
              <button
                key={model.id}
                onClick={() => handleModelSelect(model.model_id)}
                className={`w-full text-left p-3 rounded-lg transition-colors relative mb-2 ${
                  model.model_id === selectedModel
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-50 border border-gray-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {model.display_name}
                    </div>
                    <div className="text-xs mt-1 text-gray-500 font-mono">
                      {model.model_id}
                    </div>
                  </div>

                  {model.model_id === selectedModel && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}

                  {model.is_default && model.model_id !== selectedModel && (
                    <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                      Default
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
