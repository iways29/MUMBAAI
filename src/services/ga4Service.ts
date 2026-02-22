import ReactGA from 'react-ga4';

// GA4 Measurement ID
const GA4_MEASUREMENT_ID = 'G-DXXDP45Y8H';

// Initialize GA4
export const initGA = (): void => {
  ReactGA.initialize(GA4_MEASUREMENT_ID);
};

// Track page views
export const trackPageView = (path: string, title?: string): void => {
  ReactGA.send({
    hitType: 'pageview',
    page: path,
    title: title || path,
  });
};

// Track custom events
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
): void => {
  ReactGA.event({
    action,
    category,
    label,
    value,
  });
};

// Predefined event categories
export const EventCategory = {
  CHAT: 'chat',
  CONVERSATION: 'conversation',
  NAVIGATION: 'navigation',
  SETTINGS: 'settings',
  FLOW: 'flow',
  AUTH: 'auth',
  ADMIN: 'admin',
} as const;

// Predefined event actions
export const EventAction = {
  // Chat events
  SEND_MESSAGE: 'send_message',
  RECEIVE_RESPONSE: 'receive_response',

  // Conversation events
  CREATE_CONVERSATION: 'create_conversation',
  DELETE_CONVERSATION: 'delete_conversation',
  SWITCH_CONVERSATION: 'switch_conversation',

  // Model/Settings events
  MODEL_SWITCH: 'model_switch',

  // Flow events
  BRANCH_CONVERSATION: 'branch_conversation',
  MERGE_BRANCHES: 'merge_branches',
  TOGGLE_VIEW_MODE: 'toggle_view_mode',
  COLLAPSE_NODE: 'collapse_node',
  EXPAND_NODE: 'expand_node',

  // Navigation events
  NAVIGATE_PROFILE: 'navigate_profile',
  NAVIGATE_CONVERSATIONS: 'navigate_conversations',
  NAVIGATE_ADMIN: 'navigate_admin',

  // Auth events
  SIGN_IN: 'sign_in',
  SIGN_OUT: 'sign_out',
  SIGN_UP: 'sign_up',

  // Admin events
  VIEW_DASHBOARD: 'view_dashboard',
  EXPORT_DATA: 'export_data',
} as const;

// Helper functions for common events
export const GA4 = {
  // Initialize
  init: initGA,

  // Page views
  pageView: trackPageView,

  // Generic event
  event: trackEvent,

  // Chat events
  sendMessage: (model: string) => {
    trackEvent(EventAction.SEND_MESSAGE, EventCategory.CHAT, model);
  },

  receiveResponse: (model: string, tokenCount?: number) => {
    trackEvent(EventAction.RECEIVE_RESPONSE, EventCategory.CHAT, model, tokenCount);
  },

  // Conversation events
  createConversation: () => {
    trackEvent(EventAction.CREATE_CONVERSATION, EventCategory.CONVERSATION);
  },

  deleteConversation: () => {
    trackEvent(EventAction.DELETE_CONVERSATION, EventCategory.CONVERSATION);
  },

  switchConversation: () => {
    trackEvent(EventAction.SWITCH_CONVERSATION, EventCategory.CONVERSATION);
  },

  // Model events
  switchModel: (fromModel: string, toModel: string) => {
    trackEvent(EventAction.MODEL_SWITCH, EventCategory.SETTINGS, `${fromModel} -> ${toModel}`);
  },

  // Flow events
  branchConversation: () => {
    trackEvent(EventAction.BRANCH_CONVERSATION, EventCategory.FLOW);
  },

  mergeBranches: (branchCount: number) => {
    trackEvent(EventAction.MERGE_BRANCHES, EventCategory.FLOW, `${branchCount} branches`);
  },

  toggleViewMode: (mode: 'combined' | 'flow') => {
    trackEvent(EventAction.TOGGLE_VIEW_MODE, EventCategory.FLOW, mode);
  },

  // Navigation events
  navigateProfile: () => {
    trackEvent(EventAction.NAVIGATE_PROFILE, EventCategory.NAVIGATION);
  },

  navigateConversations: () => {
    trackEvent(EventAction.NAVIGATE_CONVERSATIONS, EventCategory.NAVIGATION);
  },

  navigateAdmin: () => {
    trackEvent(EventAction.NAVIGATE_ADMIN, EventCategory.NAVIGATION);
  },

  // Auth events
  signIn: (method: 'email' | 'google') => {
    trackEvent(EventAction.SIGN_IN, EventCategory.AUTH, method);
  },

  signOut: () => {
    trackEvent(EventAction.SIGN_OUT, EventCategory.AUTH);
  },

  signUp: (method: 'email' | 'google') => {
    trackEvent(EventAction.SIGN_UP, EventCategory.AUTH, method);
  },

  // Admin events
  viewDashboard: () => {
    trackEvent(EventAction.VIEW_DASHBOARD, EventCategory.ADMIN);
  },

  exportData: (format: string) => {
    trackEvent(EventAction.EXPORT_DATA, EventCategory.ADMIN, format);
  },
};

export default GA4;
