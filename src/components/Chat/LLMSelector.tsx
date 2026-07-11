import React, { useState, useRef, useEffect } from 'react';
import { ReactComponent as GoogleIcon } from '../../assets/google-gemini.svg';
import { ReactComponent as AnthropicIcon } from '../../assets/anthropic.svg';
import { ReactComponent as OpenAIIcon } from '../../assets/openai.svg';
import { getAllModels, getProviderInfo, type AppModel } from '../../services/configService.ts';

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
  const [fetchFailed, setFetchFailed] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('');
  const popupRef = useRef<HTMLDivElement>(null);

  // Fetch models from database
  const fetchModels = React.useCallback(async () => {
    setLoading(true);
    setFetchFailed(false);
    try {
      const dbModels = await getAllModels();
      setModels(dbModels);
      // An empty list from a successful call still blocks sending — treat it
      // as a retryable state rather than a dead wall.
      if (dbModels.length === 0) {
        setFetchFailed(true);
      } else {
        const selectedModelData = dbModels.find(m => m.model_id === selectedModel);
        const defaultModel = dbModels.find(m => m.is_default);
        const initialProvider = selectedModelData?.provider || defaultModel?.provider || dbModels[0].provider;
        setActiveTab(initialProvider);
      }
    } catch (error) {
      console.error('Error fetching models:', error);
      setFetchFailed(true);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedModel]);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

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

  // Get current model info (only from enabled models)
  const enabledModels = models.filter(m => m.is_enabled);
  const currentModel = enabledModels.find(m => m.model_id === selectedModel) || enabledModels.find(m => m.is_default) || enabledModels[0];

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
      <div className="flex items-center gap-3 px-4 py-2.5 text-sm text-smoke border border-hairline rounded-pill">
        <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--color-hairline)', borderTopColor: 'var(--color-plum)' }}></div>
        <span>Loading models…</span>
      </div>
    );
  }

  // Fetch failed or nothing enabled — real error state with a retry, not a
  // dead wall that silently blocks sending.
  if (fetchFailed || enabledModels.length === 0) {
    return (
      <div className="flex items-center gap-3 px-4 py-2 text-[13px] border border-danger rounded-pill">
        <span className="text-danger">
          {fetchFailed ? "Couldn't load models" : 'No models enabled'}
        </span>
        <button
          onClick={fetchModels}
          className="text-bone underline underline-offset-2 hover:text-ash transition-colors duration-fast"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Model Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-ash hover:text-bone hover:border-hairline-strong rounded-pill transition-colors duration-fast border border-hairline"
        title={`Current model: ${currentModel?.display_name || 'Unknown'}`}
      >
        {currentModel && providerIcons[currentModel.provider]}
        <span className="font-medium">{currentModel?.display_name || 'Select Model'}</span>
      </button>

      {/* Tabbed Popup */}
      {isOpen && (
        <div
          ref={popupRef}
          className="absolute bottom-full left-0 mb-2 w-[420px] bg-panel border border-hairline rounded-node z-50 overflow-hidden"
        >
          {/* Provider Tabs */}
          <div className="flex border-b border-hairline overflow-x-auto no-scrollbar">
            {providers.map((provider) => {
              const providerInfo = getProviderInfo(provider);
              return (
                <button
                  key={provider}
                  onClick={() => setActiveTab(provider)}
                  className={`flex-shrink-0 flex items-center justify-center gap-3 px-4 py-3.5 text-sm font-medium transition-colors duration-fast min-w-fit ${
                    activeTab === provider
                      ? 'text-bone border-b-2 border-plum'
                      : 'text-smoke hover:text-ash hover:bg-panel-2'
                  }`}
                >
                  {providerIcons[provider] || <span className="w-5 h-5 rounded bg-panel-2"></span>}
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
                onClick={() => model.is_enabled && handleModelSelect(model.model_id)}
                disabled={!model.is_enabled}
                className={`w-full text-left p-3 rounded-node transition-colors duration-fast relative mb-2 ${
                  !model.is_enabled
                    ? 'opacity-40 cursor-not-allowed border border-hairline'
                    : model.model_id === selectedModel
                    ? 'border border-plum'
                    : 'hover:bg-panel-2 border border-hairline'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`text-sm font-medium ${model.is_enabled ? 'text-bone' : 'text-smoke'}`}>
                      {model.display_name}
                    </div>
                    <div className={`text-xs mt-1 font-mono ${model.is_enabled ? 'text-smoke' : 'text-smoke'}`}>
                      {model.model_id}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!model.is_enabled && (
                      <div className="text-xs text-smoke border border-hairline px-2 py-0.5 rounded-pill">
                        Disabled
                      </div>
                    )}

                    {model.model_id === selectedModel && model.is_enabled && (
                      <div className="w-2 h-2 bg-plum rounded-full"></div>
                    )}

                    {model.is_default && model.is_enabled && model.model_id !== selectedModel && (
                      <div className="text-xs text-ash border border-hairline px-2 py-0.5 rounded-pill">
                        Default
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
