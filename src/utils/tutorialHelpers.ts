import { Message, Conversation } from '../types/conversation';

export const TutorialHelpers = {
  // Create sample tutorial conversation
  createTutorialConversation(): Conversation {
    return {
      id: 'tutorial-conv',
      name: 'Tutorial: Getting Started',
      messages: [
        {
          id: 'tutorial-msg-1',
          type: 'user',
          content: 'What are some creative project ideas for weekends?',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          collapsed: false,
          children: [
            {
              id: 'tutorial-msg-2',
              type: 'assistant',
              content: 'Here are some exciting weekend project ideas:\n\n1. **Creative Arts**: Start a painting, try pottery, or create a photo collage\n2. **DIY Home**: Build a small shelf, create wall art, or organize a space\n3. **Tech Projects**: Build a simple app, create a website, or learn a new programming language\n4. **Outdoor Adventures**: Start a garden, build a birdhouse, or create an outdoor reading nook\n5. **Cooking Experiments**: Try a new cuisine, bake bread from scratch, or preserve seasonal fruits\n\nWhat type of project interests you most?',
              timestamp: new Date(Date.now() - 240000).toISOString(),
              collapsed: false,
              children: [
                {
                  id: 'tutorial-msg-3',
                  type: 'user',
                  content: 'Tell me more about the tech projects!',
                  timestamp: new Date(Date.now() - 180000).toISOString(),
                  collapsed: false,
                  children: [
                    {
                      id: 'tutorial-msg-4',
                      type: 'assistant',
                      content: 'Great choice! Here are some beginner-friendly tech projects:\n\n**Web Development:**\n- Personal portfolio website\n- Simple weather app using APIs\n- Todo list with local storage\n- Photo gallery with filters\n\n**Mobile Apps:**\n- Habit tracker\n- Expense calculator\n- Simple note-taking app\n\n**Fun Automation:**\n- Social media post scheduler\n- File organizer script\n- Daily motivational quote generator\n\nMost of these can be completed in a weekend and give you something tangible to show off!',
                      timestamp: new Date(Date.now() - 120000).toISOString(),
                      collapsed: false,
                      children: []
                    }
                  ]
                },
                {
                  id: 'tutorial-msg-5',
                  type: 'user',
                  content: 'What about budget-friendly options?',
                  timestamp: new Date(Date.now() - 150000).toISOString(),
                  collapsed: false,
                  children: [
                    {
                      id: 'tutorial-msg-6',
                      type: 'assistant',
                      content: 'Absolutely! Here are creative projects that won\'t break the bank:\n\n**Free/Nearly Free:**\n- Upcycle old furniture with paint\n- Create art from nature (leaf pressing, rock painting)\n- Start a blog or YouTube channel\n- Learn origami or paper crafts\n- Organize and digitize old photos\n\n**Under $20:**\n- Grow herbs from seeds\n- Make homemade candles\n- Create a vision board\n- Try macramé with basic rope\n- Paint small canvases\n\nMany of these use materials you probably already have at home!',
                      timestamp: new Date(Date.now() - 60000).toISOString(),
                      collapsed: false,
                      children: []
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    };
  },

  // Create demo merged message
  createMergedMessage(): Message {
    return {
      id: 'tutorial-merged-1',
      type: 'assistant',
      content: 'Perfect! Combining both tech and budget-friendly approaches, here are some ideal weekend projects:\n\n**Budget-Tech Fusion:**\n- Create a simple expense tracker app (free tools + useful outcome)\n- Build a digital photo frame using a Raspberry Pi ($35)\n- Design a personal website showcasing your other creative projects\n- Make a smart plant watering system with Arduino basics\n\n**Low-Cost Creative-Tech:**\n- Document your DIY projects with time-lapse videos\n- Create digital art using free software like GIMP or Blender\n- Start a podcast about your weekend adventures\n- Build a simple game using free game engines\n\nThese projects give you both technical skills and creative satisfaction while staying budget-conscious!',
      timestamp: new Date().toISOString(),
      collapsed: false,
      mergedFrom: ['tutorial-msg-4', 'tutorial-msg-6'],
      isMergeRoot: true,
      children: []
    };
  },

  // Storage keys for tutorial state
  STORAGE_KEYS: {
    HAS_SEEN_TUTORIAL: 'flowchat_tutorial_completed',
    TUTORIAL_PROGRESS: 'flowchat_tutorial_progress',
    FIRST_TIME_USER: 'flowchat_first_time'
  },

  // Check if user has completed tutorial
  hasCompletedTutorial(): boolean {
    return localStorage.getItem(this.STORAGE_KEYS.HAS_SEEN_TUTORIAL) === 'true';
  },

  // Mark tutorial as completed
  markTutorialCompleted(): void {
    localStorage.setItem(this.STORAGE_KEYS.HAS_SEEN_TUTORIAL, 'true');
    localStorage.removeItem(this.STORAGE_KEYS.TUTORIAL_PROGRESS);
  },

  // Check if first time user
  isFirstTimeUser(): boolean {
    return localStorage.getItem(this.STORAGE_KEYS.FIRST_TIME_USER) !== 'false';
  },

  // Mark user as having used the app
  markUserAsReturning(): void {
    localStorage.setItem(this.STORAGE_KEYS.FIRST_TIME_USER, 'false');
  },

  // Save tutorial progress
  saveTutorialProgress(step: number): void {
    localStorage.setItem(this.STORAGE_KEYS.TUTORIAL_PROGRESS, step.toString());
  },

  // Get tutorial progress
  getTutorialProgress(): number {
    const progress = localStorage.getItem(this.STORAGE_KEYS.TUTORIAL_PROGRESS);
    return progress ? parseInt(progress, 10) : 0;
  },

  // Clear tutorial data
  clearTutorialData(): void {
    Object.values(this.STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  },

  // Get element position for spotlight
  getElementPosition(selector: string): DOMRect | null {
    const element = document.querySelector(selector);
    return element ? element.getBoundingClientRect() : null;
  },

  // Scroll element into view smoothly
  scrollToElement(selector: string): void {
    const element = document.querySelector(selector);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'center'
      });
    }
  },

  // Add temporary highlight to element
  highlightElement(selector: string, duration: number = 2000): void {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      element.style.transition = 'box-shadow 0.3s ease';
      element.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.6)';
      
      setTimeout(() => {
        element.style.boxShadow = '';
      }, duration);
    }
  }
};