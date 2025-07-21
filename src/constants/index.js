// src/constants/index.js

// Message Types
export const MESSAGE_TYPES = {
    USER: 'user',
    ASSISTANT: 'assistant'
  };
  
  // Filter Types
  export const FILTER_TYPES = {
    ALL: 'all',
    USER: 'user',
    ASSISTANT: 'assistant',
    MERGED: 'merged'
  };
  
  // React Flow Configuration
  export const FLOW_CONFIG = {
    HORIZONTAL_SPACING: 400,
    VERTICAL_SPACING: 250,
    NODE_MIN_WIDTH: 300,
    NODE_MAX_WIDTH: 350,
    FIT_VIEW_PADDING: 0.3,
    FIT_VIEW_DURATION: 800
  };
  
  // Timeline Animation
  export const TIMELINE_CONFIG = {
    ANIMATION_INTERVAL: 100, // ms
    ANIMATION_STEP: 0.02, // 2% per step
    DEFAULT_POSITION: 1.0
  };
  
  // UI Constants
  export const UI_CONFIG = {
    PANEL_TRANSITION_DURATION: 300, // ms
    CHAT_PANEL_WIDTH_RATIO: 0.4, // 40% of screen width
    DEFAULT_MESSAGE_TRUNCATE_LENGTH: 120,
    DEBOUNCE_DELAY: 300, // ms for search input
    AUTO_FOCUS_DELAY: 100 // ms for panel transitions
  };
  
  // Color Scheme
  export const COLORS = {
    USER_MESSAGE: {
      PRIMARY: '#3b82f6', // blue-500
      BACKGROUND: '#eff6ff', // blue-50
      BORDER: '#dbeafe' // blue-100
    },
    ASSISTANT_MESSAGE: {
      PRIMARY: '#10b981', // green-500
      BACKGROUND: '#f0fdf4', // green-50
      BORDER: '#dcfce7' // green-100
    },
    MERGED_MESSAGE: {
      PRIMARY: '#a855f7', // purple-500
      BACKGROUND: '#faf5ff', // purple-50
      BORDER: '#f3e8ff' // purple-100
    },
    SELECTED: {
      PRIMARY: '#fbbf24', // yellow-400
      BACKGROUND: '#fefce8', // yellow-50
      RING: '#fef3c7' // yellow-200
    },
    MULTI_SELECTED: {
      PRIMARY: '#ef4444', // red-500
      BACKGROUND: '#fef2f2', // red-50
      RING: '#fecaca' // red-200
    }
  };
  
  // Node Types for React Flow
  export const NODE_TYPES = {
    MESSAGE: 'message'
  };
  
  // Edge Types for React Flow
  export const EDGE_TYPES = {
    REGULAR: 'smoothstep',
    MERGE: 'smoothstep'
  };
  
  // Panel Positions
  export const PANEL_POSITIONS = {
    TOP_LEFT: 'top-left',
    TOP_CENTER: 'top-center',
    TOP_RIGHT: 'top-right',
    BOTTOM_LEFT: 'bottom-left',
    BOTTOM_CENTER: 'bottom-center',
    BOTTOM_RIGHT: 'bottom-right'
  };
  
  // Keyboard Shortcuts
  export const KEYBOARD_SHORTCUTS = {
    MULTI_SELECT: ['ctrlKey', 'metaKey'], // Ctrl/Cmd + click
    SEND_MESSAGE: 'Enter',
    NEW_LINE: 'Shift+Enter',
    ESCAPE: 'Escape'
  };
  
  // API Configuration
  export const API_CONFIG = {
    TIMEOUT: 30000, // 30 seconds
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000 // 1 second
  };
  
  // Local Storage Keys
  export const STORAGE_KEYS = {
    CONVERSATIONS: 'flowchat_conversations',
    ACTIVE_CONVERSATION: 'flowchat_active_conversation',
    UI_PREFERENCES: 'flowchat_ui_preferences',
    BOOKMARKED_NODES: 'flowchat_bookmarked_nodes'
  };
  
  // Error Messages
  export const ERROR_MESSAGES = {
    NETWORK_ERROR: 'Network error. Please check your connection.',
    API_ERROR: 'API error. Please try again.',
    VALIDATION_ERROR: 'Validation error. Please check your input.',
    UNKNOWN_ERROR: 'An unknown error occurred. Please try again.',
    MERGE_MIN_NODES: 'Please select at least 2 nodes to merge.',
    CONVERSATION_NOT_FOUND: 'Conversation not found.',
    MESSAGE_NOT_FOUND: 'Message not found.'
  };
  
  // Success Messages
  export const SUCCESS_MESSAGES = {
    MESSAGE_SENT: 'Message sent successfully.',
    CONVERSATION_CREATED: 'New conversation created.',
    CONVERSATION_RENAMED: 'Conversation renamed successfully.',
    MERGE_COMPLETED: 'Messages merged successfully.',
    EXPORT_COMPLETED: 'Conversation exported successfully.'
  };
  
  // Feature Flags
  export const FEATURES = {
    ENABLE_SMART_MERGE: true,
    ENABLE_EXPORT: true,
    ENABLE_BOOKMARKS: true,
    ENABLE_SEARCH: true,
    ENABLE_TIMELINE: true,
    ENABLE_MINIMAP: true,
    ENABLE_DARK_MODE: false // Future feature
  };
  
  // Limits
  export const LIMITS = {
    MAX_CONVERSATIONS: 50,
    MAX_MESSAGE_LENGTH: 10000,
    MAX_CONVERSATION_NAME_LENGTH: 100,
    MAX_SEARCH_RESULTS: 100,
    MAX_MERGE_NODES: 10
  };
  
  // Default Values
  export const DEFAULTS = {
    CONVERSATION_NAME: 'New Conversation',
    MESSAGE_PLACEHOLDER: 'Type your message...',
    SEARCH_PLACEHOLDER: 'Search messages...',
    EMPTY_STATE_MESSAGE: 'No messages yet. Start a conversation below.',
    LOADING_MESSAGE: 'Loading...',
    MERGE_BUTTON_TEXT: 'Smart Merge'
  };
  
  // Animation Easing
  export const EASING = {
    EASE_IN_OUT: 'cubic-bezier(0.4, 0, 0.2, 1)',
    EASE_OUT: 'cubic-bezier(0, 0, 0.2, 1)',
    EASE_IN: 'cubic-bezier(0.4, 0, 1, 1)',
    BOUNCE: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
  };
  
  // Responsive Breakpoints
  export const BREAKPOINTS = {
    SM: '640px',
    MD: '768px',
    LG: '1024px',
    XL: '1280px',
    '2XL': '1536px'
  };
  
  // Z-Index Layers
  export const Z_INDEX = {
    DROPDOWN: 10,
    MODAL: 20,
    TOOLTIP: 30,
    NOTIFICATION: 40
  };