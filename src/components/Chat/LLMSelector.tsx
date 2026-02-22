import React, { useState, useRef, useEffect } from 'react';
import { ReactComponent as GoogleIcon } from '../../assets/google-gemini.svg';
import { ReactComponent as AnthropicIcon } from '../../assets/anthropic.svg';
import { ReactComponent as OpenAIIcon } from '../../assets/openai.svg';

interface LLMModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  enabled: boolean;
}

interface LLMProvider {
  name: string;
  icon: React.ReactNode;
  models: LLMModel[];
}

const llmProviders: LLMProvider[] = [
  {
    name: 'Anthropic',
    icon: <AnthropicIcon width={20} height={20} />,
    models: [
      {
        id: 'claude-3-7-sonnet-20250219',
        name: 'Claude 3.7 Sonnet',
        provider: 'Anthropic',
        description: 'Enhanced reasoning and analysis',
        enabled: true
      },
      {
        id: 'claude-sonnet-4-20250514',
        name: 'Claude 4 Sonnet',
        provider: 'Anthropic',
        description: 'Next-generation Claude model',
        enabled: false
      },
      {
        id: 'claude-opus-4-20250514',
        name: 'Claude 4 Opus',
        provider: 'Anthropic',
        description: 'Most powerful Claude 4 model',
        enabled: false
      },
      {
        id: 'claude-opus-4-1-20250805',
        name: 'Claude 4.1 Opus',
        provider: 'Anthropic',
        description: 'Latest and most advanced Claude model',
        enabled: false
      }
    ]
  },
  {
    name: 'OpenAI',
    icon: <OpenAIIcon width={20} height={20} />,
    models: [
      {
        id: 'gpt-5-mini',
        name: 'GPT-5 Mini',
        provider: 'OpenAI',
        description: 'Next-gen compact model',
        enabled: true
      },
      {
        id: 'gpt-4.1-mini',
        name: 'GPT-4.1 Mini',
        provider: 'OpenAI',
        description: 'Efficient and fast GPT model',
        enabled: true
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        provider: 'OpenAI',
        description: 'Compact multimodal model',
        enabled: true
      },
      {
        id: 'gpt-5',
        name: 'GPT-5',
        provider: 'OpenAI',
        description: 'Most advanced OpenAI model',
        enabled: false
      },
      {
        id: 'gpt-4.1',
        name: 'GPT-4.1',
        provider: 'OpenAI',
        description: 'Enhanced GPT-4 with better performance',
        enabled: false
      },
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        provider: 'OpenAI',
        description: 'Advanced multimodal model',
        enabled: false
      }
    ]
  },
  {
    name: 'Google',
    icon: <GoogleIcon width={20} height={20} />,
    models: [
      {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        provider: 'Google',
        description: 'Fast and efficient model for general tasks',
        enabled: false
      },
      {
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash (Legacy)',
        provider: 'Google',
        description: 'Previous generation flash model',
        enabled: false
      }
    ]
  }
];

interface LLMSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
}

export const LLMSelector: React.FC<LLMSelectorProps> = ({
  selectedModel,
  onModelChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Anthropic');
  const popupRef = useRef<HTMLDivElement>(null);

  // Get current model info
  const currentModel = llmProviders
    .flatMap(p => p.models)
    .find(m => m.id === selectedModel) || llmProviders[0].models[0];

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

  const handleModelSelect = (modelId: string, enabled: boolean) => {
    if (enabled) {
      onModelChange(modelId);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      {/* Model Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
        title={`Current model: ${currentModel.name}`}
      >
        {llmProviders.find(p => p.models.some(m => m.id === selectedModel))?.icon}
        <span className="font-medium">{currentModel.name}</span>
      </button>

      {/* Tabbed Popup */}
      {isOpen && (
        <div 
          ref={popupRef}
          className="absolute bottom-full left-0 mb-2 w-[420px] bg-white border border-gray-200 rounded-xl shadow-lg z-50"
        >
          {/* Provider Tabs */}
          <div className="flex border-b border-gray-100 overflow-x-auto no-scrollbar">
            {llmProviders.map((provider) => (
              <button
                key={provider.name}
                onClick={() => setActiveTab(provider.name)}
                className={`flex-shrink-0 flex items-center justify-center gap-3 px-4 py-4 text-sm font-medium transition-colors min-w-fit ${
                  activeTab === provider.name
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                {provider.icon}
                <span className="whitespace-nowrap">{provider.name}</span>
              </button>
            ))}
          </div>

          {/* Models Content */}
          <div className="p-4 max-h-80 overflow-y-auto">
            {llmProviders
              .filter(provider => provider.name === activeTab)
              .map((provider) => (
                <div key={provider.name} className="space-y-2">
                  {provider.models.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => handleModelSelect(model.id, model.enabled)}
                      disabled={!model.enabled}
                      className={`w-full text-left p-3 rounded-lg transition-colors relative ${
                        model.enabled
                          ? model.id === selectedModel
                            ? 'bg-blue-50 border border-blue-200'
                            : 'hover:bg-gray-50 border border-gray-100'
                          : 'opacity-50 cursor-not-allowed border border-gray-100'
                      }`}
                      title={model.enabled ? model.description : 'Coming Soon'}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className={`text-sm font-medium ${
                            model.enabled ? 'text-gray-900' : 'text-gray-500'
                          }`}>
                            {model.name}
                          </div>
                          <div className={`text-xs mt-1 ${
                            model.enabled ? 'text-gray-600' : 'text-gray-400'
                          }`}>
                            {model.description}
                          </div>
                        </div>
                        
                        {model.id === selectedModel && model.enabled && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                        
                        {!model.enabled && (
                          <div className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                            Coming Soon
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};