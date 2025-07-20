import { TutorialStep } from '../../types/tutorial';

export const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to FlowChatAI! 🌟',
    content: 'Transform your conversations into visual trees where every response creates a new branch. Perfect for exploring ideas, comparing responses, and seeing how conversations evolve.',
    spotlightType: 'full',
    position: 'center',
    actionType: 'continue',
    skipable: true
  },
  {
    id: 'interface-overview',
    title: 'Your Workspace',
    content: 'Your workspace has two main areas:\n💬 Chat panel (left) - Where you read and write messages\n🌳 Visual tree (right) - Where conversations come alive',
    spotlightTarget: '.app-main-container',
    spotlightType: 'area',
    position: 'center',
    actionType: 'continue',
    skipable: true
  },
  {
    id: 'first-message',
    title: "Let's Create Your First Message!",
    content: 'Type anything you\'d like to ask - we\'ll use this to demonstrate how conversations branch. Try asking about creative project ideas!',
    spotlightTarget: '[data-tutorial="chat-input"]',
    spotlightType: 'element',
    position: 'top',
    actionType: 'interactive',
    actionTarget: '[data-tutorial="chat-input"]',
    actionDescription: 'Type a message and press Enter or click Send',
    skipable: true,
    demoData: {
      fallbackMessage: 'What are some creative project ideas for weekends?'
    }
  },
  {
    id: 'nodes-appear',
    title: 'Watch the Magic! ✨',
    content: 'Each message becomes a node in your conversation tree:\n🔵 Blue nodes = Your messages\n🟢 Green nodes = AI responses',
    spotlightTarget: '[data-tutorial="flow-canvas"]',
    spotlightType: 'area',
    position: 'left',
    actionType: 'auto',
    autoAdvance: true,
    autoAdvanceDelay: 3000,
    skipable: true
  },
  {
    id: 'create-branch',
    title: 'Creating Your First Branch',
    content: 'Now the fun begins! Click the AI\'s response to select it, then ask a follow-up question to create your first branch.',
    spotlightTarget: '[data-tutorial="ai-response-node"]',
    spotlightType: 'element',
    position: 'right',
    actionType: 'interactive',
    actionTarget: '[data-tutorial="ai-response-node"]',
    actionDescription: 'Click the AI response node, then send another message',
    skipable: true,
    demoData: {
      fallbackMessage: 'Tell me more about the tech project ideas!'
    }
  },
  {
    id: 'node-navigation',
    title: 'Navigate Your Conversation',
    content: 'Click any node to jump back to that point in the conversation. Notice how the chat panel updates to show the conversation thread. Try clicking the first message!',
    spotlightTarget: '[data-tutorial="first-user-node"]',
    spotlightType: 'element',
    position: 'right',
    actionType: 'interactive',
    actionTarget: '[data-tutorial="first-user-node"]',
    actionDescription: 'Click on different nodes to navigate',
    skipable: true
  },
  {
    id: 'second-branch',
    title: 'Multiple Paths',
    content: 'Let\'s create a second branch! Click the AI\'s first response again, then ask a different follow-up question to explore another direction.',
    spotlightTarget: '[data-tutorial="ai-response-node"]',
    spotlightType: 'element',
    position: 'right',
    actionType: 'interactive',
    actionTarget: '[data-tutorial="ai-response-node"]',
    actionDescription: 'Create another branch with a different question',
    skipable: true,
    demoData: {
      fallbackMessage: 'What about budget-friendly project options?'
    }
  },
  {
    id: 'multi-selection',
    title: 'Multi-Selection Power 🚀',
    content: 'Here\'s where it gets powerful! Hold Ctrl (or Cmd on Mac) and click multiple nodes to select them. Try selecting both AI responses we just created.',
    spotlightTarget: '[data-tutorial="flow-canvas"]',
    spotlightType: 'area',
    position: 'left',
    actionType: 'interactive',
    actionTarget: '[data-tutorial="flow-canvas"]',
    actionDescription: 'Ctrl+click multiple nodes to select them',
    skipable: true
  },
  {
    id: 'smart-merge',
    title: 'Smart Merge Feature ✨',
    content: 'Now for the coolest feature - Smart Merge! AI will analyze your selected responses and create a synthesized answer. Click \'Smart Merge\' to combine the different conversation paths.',
    spotlightTarget: '[data-tutorial="merge-button"]',
    spotlightType: 'element',
    position: 'left',
    actionType: 'interactive',
    actionTarget: '[data-tutorial="merge-button"]',
    actionDescription: 'Click the Smart Merge button',
    skipable: true
  },
  {
    id: 'timeline-controls',
    title: 'Travel Through Time! ⏰',
    content: 'Use the timeline slider to see how your conversation evolved. Click the play button to watch it build step by step.',
    spotlightTarget: '[data-tutorial="timeline-controls"]',
    spotlightType: 'element',
    position: 'bottom',
    actionType: 'interactive',
    actionTarget: '[data-tutorial="timeline-controls"]',
    actionDescription: 'Try the timeline slider and play button',
    skipable: true
  },
  {
    id: 'panel-management',
    title: 'Customize Your Workspace',
    content: 'Collapse the chat panel for full-screen tree view. All controls remain accessible in the visualization area.',
    spotlightTarget: '[data-tutorial="collapse-button"]',
    spotlightType: 'element',
    position: 'right',
    actionType: 'interactive',
    actionTarget: '[data-tutorial="collapse-button"]',
    actionDescription: 'Try collapsing and expanding panels',
    skipable: true
  },
  {
    id: 'search-filters',
    title: 'Find Anything Quickly 🔍',
    content: 'Search for specific words or filter by message type. Try searching for a word from your conversation.',
    spotlightTarget: '[data-tutorial="search-controls"]',
    spotlightType: 'element',
    position: 'bottom',
    actionType: 'interactive',
    actionTarget: '[data-tutorial="search-controls"]',
    actionDescription: 'Try the search and filter features',
    skipable: true
  },
  {
    id: 'double-click-tip',
    title: 'Pro Tip: Quick Navigation',
    content: 'Double-click any node for instant focus. This jumps to that conversation point and opens the chat panel if collapsed. Perfect for quick navigation in complex trees.',
    spotlightTarget: '[data-tutorial="flow-canvas"]',
    spotlightType: 'area',
    position: 'left',
    actionType: 'interactive',
    actionTarget: '[data-tutorial="flow-canvas"]',
    actionDescription: 'Try double-clicking a node',
    skipable: true
  },
  {
    id: 'advanced-features',
    title: 'More Features to Explore',
    content: 'You\'re almost an expert! Here are more features to explore:\n📑 Bookmark important messages\n👁️ Toggle the minimap for navigation\n🔄 Fit view to see your entire conversation tree',
    spotlightTarget: '[data-tutorial="flow-controls"]',
    spotlightType: 'area',
    position: 'bottom',
    actionType: 'continue',
    skipable: true
  },
  {
    id: 'completion',
    title: 'Congratulations! 🎉',
    content: 'You\'ve mastered FlowChatAI! What would you like to do with this tutorial conversation?',
    spotlightType: 'full',
    position: 'center',
    actionType: 'choice',
    choices: [
      {
        id: 'keep',
        label: 'Keep this conversation',
        description: 'Continue with tutorial examples',
        action: () => {} // Will be handled by tutorial completion
      },
      {
        id: 'fresh',
        label: 'Start fresh',
        description: 'Clear everything and begin with empty state',
        action: () => {} // Will be handled by tutorial completion
      },
      {
        id: 'replay',
        label: 'Replay tutorial',
        description: 'Go through it again',
        action: () => {} // Will be handled by tutorial restart
      }
    ],
    skipable: false
  }
];

export const getTutorialStep = (stepId: string): TutorialStep | null => {
  return tutorialSteps.find(step => step.id === stepId) || null;
};

export const getTutorialStepByIndex = (index: number): TutorialStep | null => {
  return tutorialSteps[index] || null;
};

export const getTotalSteps = (): number => {
  return tutorialSteps.length;
};