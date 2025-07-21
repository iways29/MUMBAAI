export interface Message {
    id: string;
    type: 'user' | 'assistant';
    content: string;
    timestamp: string;
    collapsed: boolean;
    children: Message[];
    mergedFrom?: string[];
    bookmarked?: boolean; // I see this referenced in your flow utils
  }
  
  export interface Conversation {
    id: string;
    name: string;
    messages: Message[];
  }
  
  // Additional types I found in your code
  export interface FlowNode {
    id: string;
    type: string;
    position: { x: number; y: number };
    data: {
      message: Message;
      onNodeClick?: (id: string, event: any) => void;
      onNodeDoubleClick?: (id: string, event: any) => void;
      isMultiSelected: boolean;
      selectedMessageId: string;
    };
    style?: any;
    className?: string;
  }
  
  export interface FlowEdge {
    id: string;
    source: string;
    target: string;
    type?: string;
    animated?: boolean;
    style?: any;
    markerEnd?: any;
    label?: string;
    labelStyle?: any;
  }
  
  // UI State types
  export interface UIState {
    chatPanelCollapsed: boolean;
    infoPanelCollapsed: boolean;
    showMiniMap: boolean;
    searchTerm: string;
    filterType: string;
    isRenamingConversation: boolean;
    tempConversationName: string;
  }
  
  // Timeline state
  export interface TimelineState {
    timelinePosition: number;
    isAnimating: boolean;
  }