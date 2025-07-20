import { useState, useCallback } from 'react';
import { PanelState, PanelControls } from '../../types/flow';

export const usePanelManager = (initialState?: Partial<PanelState>) => {
  const [state, setState] = useState<PanelState>({
    chatPanelCollapsed: false,
    infoPanelCollapsed: false,
    isRenamingConversation: false,
    tempConversationName: '',
    ...initialState
  });

  const setChatPanelCollapsed = useCallback((collapsed: boolean) => {
    setState(prev => ({ ...prev, chatPanelCollapsed: collapsed }));
  }, []);

  const setInfoPanelCollapsed = useCallback((collapsed: boolean) => {
    setState(prev => ({ ...prev, infoPanelCollapsed: collapsed }));
  }, []);

  const startRenamingConversation = useCallback((currentName: string) => {
    setState(prev => ({ 
      ...prev, 
      isRenamingConversation: true,
      tempConversationName: currentName
    }));
  }, []);

  const saveConversationName = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      isRenamingConversation: false,
      tempConversationName: ''
    }));
    return state.tempConversationName.trim();
  }, [state.tempConversationName]);

  const cancelRenamingConversation = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      isRenamingConversation: false,
      tempConversationName: ''
    }));
  }, []);

  const setTempConversationName = useCallback((name: string) => {
    setState(prev => ({ ...prev, tempConversationName: name }));
  }, []);

  const toggleChatPanel = useCallback(() => {
    setState(prev => ({ ...prev, chatPanelCollapsed: !prev.chatPanelCollapsed }));
  }, []);

  const toggleInfoPanel = useCallback(() => {
    setState(prev => ({ ...prev, infoPanelCollapsed: !prev.infoPanelCollapsed }));
  }, []);

  const controls: PanelControls = {
    setChatPanelCollapsed,
    setInfoPanelCollapsed,
    startRenamingConversation,
    saveConversationName,
    cancelRenamingConversation
  };

  return {
    state,
    controls,
    // Convenience methods
    toggleChatPanel,
    toggleInfoPanel,
    setTempConversationName,
    
    // State accessors
    isChatCollapsed: state.chatPanelCollapsed,
    isInfoCollapsed: state.infoPanelCollapsed,
    isRenaming: state.isRenamingConversation,
    tempName: state.tempConversationName
  };
};