import React, { useEffect, useRef } from 'react';
import { User, Bot, GitBranch, Sparkles, Share2, Bookmark } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Message } from '../../types/conversation.ts';
import { MessageHelpers } from '../../utils/messageHelpers.ts';
import { ThinkingIndicator } from '../UI/LoadingSpinner.tsx';
import { ReactComponent as AnthropicIcon } from '../../assets/anthropic.svg';
import { ReactComponent as OpenAIIcon } from '../../assets/openai.svg';
import { ReactComponent as GoogleIcon } from '../../assets/google-gemini.svg';

// Helper to get model display info
const getModelInfo = (model: string | undefined) => {
  if (!model) return null;

  if (model.includes('claude')) {
    const variant = model.includes('haiku') ? 'Haiku' :
                    model.includes('sonnet') ? 'Sonnet' :
                    model.includes('opus') ? 'Opus' : '';
    return { provider: 'Claude', variant, icon: AnthropicIcon };
  }

  if (model.includes('gpt')) {
    const variant = model.includes('5-mini') ? '5 Mini' :
                    model.includes('4.1-mini') ? '4.1 Mini' :
                    model.includes('4o-mini') ? '4o Mini' :
                    model.includes('gpt-5') ? '5' :
                    model.includes('gpt-4.1') ? '4.1' :
                    model.includes('gpt-4o') ? '4o' : '';
    return { provider: 'GPT', variant, icon: OpenAIIcon };
  }

  if (model.includes('gemini')) {
    const variant = model.includes('2.5-flash') ? '2.5 Flash' :
                    model.includes('1.5-flash') ? '1.5 Flash' : '';
    return { provider: 'Gemini', variant, icon: GoogleIcon };
  }

  return null;
};

const markdownComponents = {
  p: ({ children }: any) => <p className="mb-2 last:mb-0">{children}</p>,
  strong: ({ children }: any) => <strong className="font-semibold text-bone">{children}</strong>,
  em: ({ children }: any) => <em className="italic">{children}</em>,
  code: ({ children }: any) => (
    <code className="bg-panel-2 px-1.5 py-0.5 rounded text-[13px] font-mono text-bone">{children}</code>
  ),
  pre: ({ children }: any) => (
    <pre className="bg-panel-2 p-3 rounded-[8px] overflow-x-auto text-[13px] font-mono">{children}</pre>
  ),
  ul: ({ children }: any) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
  li: ({ children }: any) => <li className="mb-1">{children}</li>,
  h1: ({ children }: any) => <h1 className="text-lg font-semibold mb-2 text-bone">{children}</h1>,
  h2: ({ children }: any) => <h2 className="text-base font-semibold mb-2 text-bone">{children}</h2>,
  h3: ({ children }: any) => <h3 className="text-sm font-semibold mb-1 text-bone">{children}</h3>,
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-2 border-hairline-strong pl-4 italic text-ash mb-2">{children}</blockquote>
  ),
};

interface MessageThreadProps {
  messages: Message[];
  selectedMessageId: string;
  isLoading: boolean;
  bookmarkedNodes: Set<string>;
  onToggleBookmark: (nodeId: string) => void;
  streamingContent?: string;
  // Branch from this bubble — same behavior as selecting the node on the canvas
  onBranchFrom?: (messageId: string) => void;
  // Full-width mode: constrain to a readable centered measure
  centered?: boolean;
}

export const MessageThread: React.FC<MessageThreadProps> = ({
  messages,
  selectedMessageId,
  isLoading,
  bookmarkedNodes,
  onToggleBookmark,
  streamingContent = '',
  onBranchFrom,
  centered = false
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, [messages.length, isLoading]);

  // Also scroll when the loading state changes (when AI responds)
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'end'
          });
        }
      }, 100);
    }
  }, [isLoading, messages.length]);

  // Auto-scroll when streaming content updates
  useEffect(() => {
    if (streamingContent && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, [streamingContent]);

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-6" ref={containerRef}>
        <div className="max-w-sm mx-auto text-center mt-32">
          <div className="w-12 h-12 mx-auto mb-6 rounded-full border border-hairline flex items-center justify-center">
            <GitBranch size={20} className="text-smoke" />
          </div>
          <h3 className="text-[17px] font-medium text-bone mb-2">
            {centered ? 'Ask anything' : 'Start a thread'}
          </h3>
          <p className="text-[14px] text-ash leading-relaxed tracking-body mb-4">
            {centered
              ? 'Start like any chat. Once the first reply lands, your conversation becomes a map you can branch in every direction.'
              : 'Type below to begin. Every reply can branch — click any node on the canvas to continue from that point.'}
          </p>
          {!centered && (
            <p className="text-[12px] text-smoke">
              Double-click a node to open it here
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6" ref={containerRef}>
      <div className={`space-y-4 ${centered ? 'max-w-3xl mx-auto' : ''}`}>
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-2xl px-4 py-3 rounded-node border ${
              message.type === 'user'
                ? 'bg-panel ml-8'
                : 'bg-transparent'
            } ${
              message.id === selectedMessageId
                ? 'border-plum'
                : message.type === 'user'
                ? 'border-hairline'
                : 'border-transparent'
            }`}>

              <div className="flex items-center gap-2 mb-2">
                {message.type === 'user' ? (
                  <User size={13} className="text-smoke flex-shrink-0" />
                ) : (() => {
                  const modelInfo = getModelInfo(message.model);
                  return modelInfo ? (
                    <modelInfo.icon width={13} height={13} className="flex-shrink-0 text-bone" />
                  ) : (
                    <Bot size={13} className="text-smoke flex-shrink-0" />
                  );
                })()}
                <span className="text-[12px] font-medium text-ash">
                  {message.type === 'user' ? 'You' : (() => {
                    const modelInfo = getModelInfo(message.model);
                    return modelInfo ? `${modelInfo.provider} ${modelInfo.variant}`.trim() : 'Assistant';
                  })()}
                </span>
                <span className={`text-[11px] text-smoke flex-shrink-0 ${message.type === 'user' ? 'ml-auto' : ''}`}>
                  {MessageHelpers.formatTimestamp(message.timestamp)}
                </span>
              </div>

              <div className={`text-[14px] leading-relaxed tracking-body mb-2 break-words ${
                message.type === 'user' ? 'text-bone' : 'text-ash'
              }`}>
                {message.type === 'assistant' ? (
                  <ReactMarkdown components={markdownComponents}>
                    {message.content}
                  </ReactMarkdown>
                ) : (
                  <div className="whitespace-pre-wrap">{message.content}</div>
                )}
              </div>

              {/* Message Actions and Info */}
              <div className="flex items-center gap-3 pt-1.5 border-t border-hairline">
                {/* Response count */}
                {message.children && message.children.length > 0 && (
                  <div className="text-[11px] text-smoke flex items-center gap-1">
                    <GitBranch size={10} />
                    {message.children.length} {message.children.length > 1 ? 'branches' : 'branch'}
                  </div>
                )}

                {/* Merged info */}
                {MessageHelpers.isMergedMessage(message) && (
                  <div className="text-[11px] text-plum flex items-center gap-1">
                    <Sparkles size={10} />
                    Merged from {message.mergedFrom?.length} branches
                    {message.isMergeRoot && ' · Root'}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-3 ml-auto">
                  {onBranchFrom && (
                    <button
                      onClick={() => onBranchFrom(message.id)}
                      className={`text-[11px] flex items-center gap-1 transition-colors duration-fast ${
                        message.id === selectedMessageId
                          ? 'text-plum'
                          : 'text-smoke hover:text-bone'
                      }`}
                      title="Reply from this point — your next message branches here"
                    >
                      <GitBranch size={10} />
                      {message.id === selectedMessageId ? 'Branching here' : 'Branch'}
                    </button>
                  )}
                  <button
                    onClick={() => handleCopyMessage(message.content)}
                    className="text-[11px] text-smoke hover:text-bone flex items-center gap-1 transition-colors duration-fast"
                  >
                    <Share2 size={10} />
                    Copy
                  </button>
                  <button
                    onClick={() => onToggleBookmark(message.id)}
                    className={`text-[11px] flex items-center gap-1 transition-colors duration-fast ${
                      bookmarkedNodes.has(message.id) ? 'text-bone' : 'text-smoke hover:text-bone'
                    }`}
                  >
                    <Bookmark size={10} />
                    {bookmarkedNodes.has(message.id) ? 'Saved' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Show streaming content while it's being generated */}
        {streamingContent && (
          <div className="flex justify-start">
            <div className="max-w-2xl px-4 py-3 rounded-node bg-transparent">
              <div className="flex items-center gap-2 mb-2">
                <Bot size={13} className="text-smoke flex-shrink-0" />
                <span className="text-[12px] font-medium text-ash">Assistant</span>
                <span className="text-[11px] text-plum flex-shrink-0">streaming</span>
              </div>
              <div className="text-[14px] text-ash leading-relaxed tracking-body mb-2 break-words">
                <ReactMarkdown components={markdownComponents}>
                  {streamingContent}
                </ReactMarkdown>
                <span className="caret-pulse inline-block w-[2px] h-[14px] bg-plum align-middle ml-0.5" />
              </div>
            </div>
          </div>
        )}

        {isLoading && !streamingContent && (
          <div className="flex justify-start">
            <ThinkingIndicator text="Thinking…" />
          </div>
        )}

        {/* Invisible element to scroll to */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};
