export interface TutorialStep {
    id: string;
    title: string;
    content: string;
    spotlightTarget?: string; // CSS selector or element ID
    spotlightType?: 'element' | 'area' | 'full';
    position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
    actionType: 'continue' | 'interactive' | 'auto' | 'choice';
    actionTarget?: string; // What element user should interact with
    actionDescription?: string; // What user should do
    choices?: TutorialChoice[];
    skipable?: boolean;
    autoAdvance?: boolean;
    autoAdvanceDelay?: number;
    demoData?: any; // Sample data to inject for this step
  }
  
  export interface TutorialChoice {
    id: string;
    label: string;
    description?: string;
    action: () => void;
  }
  
  export interface TutorialState {
    isActive: boolean;
    currentStep: number;
    totalSteps: number;
    isFirstTime: boolean;
    userHasStarted: boolean;
    completedSteps: Set<number>;
    demoConversation?: any;
  }
  
  export interface TutorialControls {
    startTutorial: () => void;
    nextStep: () => void;
    previousStep: () => void;
    skipStep: () => void;
    exitTutorial: () => void;
    completeTutorial: (keepData: boolean) => void;
    goToStep: (step: number) => void;
  }
  
  export interface TutorialContext {
    state: TutorialState;
    controls: TutorialControls;
    currentStepData: TutorialStep | null;
  }