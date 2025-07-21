// src/utils/messageUtils.js

/**
 * Format timestamp to display time
 * @param {string} timestamp - ISO timestamp string
 * @returns {string} Formatted time string
 */
export const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  /**
   * Format timestamp to display full date and time
   * @param {string} timestamp - ISO timestamp string
   * @returns {string} Formatted date and time string
   */
  export const formatFullTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };
  
  /**
   * Truncate text to specified length
   * @param {string} text - Text to truncate
   * @param {number} maxLength - Maximum length (default: 120)
   * @returns {string} Truncated text with ellipsis if needed
   */
  export const truncateText = (text, maxLength = 120) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };
  
  /**
   * Generate unique message ID
   * @returns {string} Unique message ID
   */
  export const generateMessageId = () => {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };
  
  /**
   * Generate unique conversation ID
   * @returns {string} Unique conversation ID
   */
  export const generateConversationId = () => {
    return `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };
  
  /**
   * Check if a message is a merged node
   * @param {Object} message - Message object
   * @returns {boolean} True if message is merged from other nodes
   */
  export const isMergedNode = (message) => {
    return message.mergedFrom && message.mergedFrom.length > 0;
  };
  
  /**
   * Check if a message is a merge root
   * @param {Object} message - Message object
   * @returns {boolean} True if message is a merge root
   */
  export const isMergeRoot = (message) => {
    return message.isMergeRoot === true;
  };
  
  /**
   * Get message type display name
   * @param {string} type - Message type ('user' or 'assistant')
   * @returns {string} Display name
   */
  export const getMessageTypeDisplayName = (type) => {
    return type === 'user' ? 'You' : 'Assistant';
  };
  
  /**
   * Count total messages in a conversation tree
   * @param {Array} messages - Array of root messages
   * @returns {number} Total message count
   */
  export const countTotalMessages = (messages) => {
    let count = 0;
    const traverse = (msgs) => {
      msgs.forEach(msg => {
        count++;
        if (msg.children) traverse(msg.children);
      });
    };
    traverse(messages);
    return count;
  };
  
  /**
   * Get the depth of a message tree
   * @param {Array} messages - Array of root messages
   * @returns {number} Maximum depth
   */
  export const getMessageTreeDepth = (messages) => {
    let maxDepth = 0;
    const traverse = (msgs, depth = 1) => {
      maxDepth = Math.max(maxDepth, depth);
      msgs.forEach(msg => {
        if (msg.children && msg.children.length > 0) {
          traverse(msg.children, depth + 1);
        }
      });
    };
    traverse(messages);
    return maxDepth;
  };
  
  /**
   * Find all messages of a specific type
   * @param {Array} messages - Array of root messages
   * @param {string} type - Message type to filter by
   * @returns {Array} Array of messages matching the type
   */
  export const findMessagesByType = (messages, type) => {
    const result = [];
    const traverse = (msgs) => {
      msgs.forEach(msg => {
        if (msg.type === type) {
          result.push(msg);
        }
        if (msg.children) traverse(msg.children);
      });
    };
    traverse(messages);
    return result;
  };
  
  /**
   * Search messages by content
   * @param {Array} messages - Array of root messages
   * @param {string} searchTerm - Term to search for
   * @returns {Array} Array of messages containing the search term
   */
  export const searchMessages = (messages, searchTerm) => {
    if (!searchTerm) return [];
    
    const result = [];
    const lowercaseSearch = searchTerm.toLowerCase();
    
    const traverse = (msgs) => {
      msgs.forEach(msg => {
        if (msg.content.toLowerCase().includes(lowercaseSearch)) {
          result.push(msg);
        }
        if (msg.children) traverse(msg.children);
      });
    };
    
    traverse(messages);
    return result;
  };
  
  /**
   * Get conversation statistics
   * @param {Array} messages - Array of root messages
   * @returns {Object} Statistics object
   */
  export const getConversationStats = (messages) => {
    let userMessages = 0;
    let assistantMessages = 0;
    let mergedMessages = 0;
    let totalMessages = 0;
    let maxDepth = 0;
  
    const traverse = (msgs, depth = 1) => {
      maxDepth = Math.max(maxDepth, depth);
      msgs.forEach(msg => {
        totalMessages++;
        
        if (msg.type === 'user') userMessages++;
        else if (msg.type === 'assistant') assistantMessages++;
        
        if (isMergedNode(msg)) mergedMessages++;
        
        if (msg.children && msg.children.length > 0) {
          traverse(msg.children, depth + 1);
        }
      });
    };
  
    traverse(messages);
  
    return {
      totalMessages,
      userMessages,
      assistantMessages,
      mergedMessages,
      maxDepth,
      averageDepth: maxDepth > 0 ? totalMessages / maxDepth : 0
    };
  };
  
  /**
   * Validate message object structure
   * @param {Object} message - Message object to validate
   * @returns {boolean} True if message is valid
   */
  export const isValidMessage = (message) => {
    return (
      message &&
      typeof message.id === 'string' &&
      typeof message.type === 'string' &&
      typeof message.content === 'string' &&
      typeof message.timestamp === 'string' &&
      ['user', 'assistant'].includes(message.type)
    );
  };
  
  /**
   * Create a new message object
   * @param {string} type - Message type ('user' or 'assistant')
   * @param {string} content - Message content
   * @param {Object} options - Additional options
   * @returns {Object} New message object
   */
  export const createMessage = (type, content, options = {}) => {
    return {
      id: options.id || generateMessageId(),
      type,
      content,
      timestamp: options.timestamp || new Date().toISOString(),
      collapsed: options.collapsed || false,
      children: options.children || [],
      ...(options.mergedFrom && { mergedFrom: options.mergedFrom }),
      ...(options.isMergeRoot && { isMergeRoot: options.isMergeRoot })
    };
  };