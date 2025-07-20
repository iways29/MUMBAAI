import { Node, Edge } from 'reactflow';
import { Message } from './conversation';

export interface MessageNodeData {
  message: Message;
  onNodeClick?: (messageId: string, event?: React.MouseEvent) => void;
  onNodeDoubleClick?: (messageId: string, event?: React.MouseEvent) => void;
  isMultiSelected: boolean;
  selectedMessageId: string;
}

export type MessageNode = Node<MessageNodeData>;

export interface FlowState {
  nodes: MessageNode[];
  edges: Edge[];
  showMiniMap: boolean;
  searchTerm: string;
  filterType: 'all' | 'user' | 'assistant' | 'merged';
  bookmarkedNodes: Set<string>;
  timelinePosition: number;
  isAnimating: boolean;
}

export interface FlowControls {
  setShowMiniMap: (show: boolean) => void;
  setSearchTerm: (term: string) => void;
  setFilterType: (type: 'all' | 'user' | 'assistant' | 'merged') => void;
  toggleBookmark: (nodeId: string) => void;
  setTimelinePosition: (position: number) => void;
  startTimelineAnimation: () => void;
  resetTimeline: () => void;
  fitView: () => void;
}

export interface PanelState {
  chatPanelCollapsed: boolean;
  infoPanelCollapsed: boolean;
  isRenamingConversation: boolean;
  tempConversationName: string;
}

export interface PanelControls {
  setChatPanelCollapsed: (collapsed: boolean) => void;
  setInfoPanelCollapsed: (collapsed: boolean) => void;
  startRenamingConversation: () => void;
  saveConversationName: () => void;
  cancelRenamingConversation: () => void;
}