import html2canvas from 'html2canvas';
import { Conversation } from '../types/conversation';

class ExportService {
  async exportFlowAsImage(elementId: string = 'react-flow-wrapper'): Promise<void> {
    try {
      const element = document.querySelector(`.react-flow`);
      if (!element) {
        throw new Error('Flow element not found');
      }

      const canvas = await html2canvas(element as HTMLElement, {
        backgroundColor: '#f9fafb',
        scale: 2,
        logging: false,
      });

      // Create download link
      const link = document.createElement('a');
      link.download = `flowchat-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error('Failed to export flow as image:', error);
      throw new Error('Failed to export flow visualization');
    }
  }

  exportConversationAsMarkdown(conversation: Conversation): string {
    let markdown = `# ${conversation.name}\n\n`;

    const flattenMessages = (messages: any[], level = 0) => {
      messages.forEach(message => {
        const indent = '  '.repeat(level);
        const timestamp = new Date(message.timestamp).toLocaleString();
        const sender = message.type === 'user' ? '**You**' : '**Assistant**';
        
        markdown += `${indent}- ${sender} (${timestamp}):\n`;
        markdown += `${indent}  ${message.content}\n\n`;

        if (message.children && message.children.length > 0) {
          flattenMessages(message.children, level + 1);
        }
      });
    };

    flattenMessages(conversation.messages);
    return markdown;
  }

  downloadConversationAsMarkdown(conversation: Conversation): void {
    const markdown = this.exportConversationAsMarkdown(conversation);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.download = `${conversation.name.replace(/[^a-z0-9]/gi, '_')}.md`;
    link.href = url;
    link.click();
    
    URL.revokeObjectURL(url);
  }

  downloadConversationAsJSON(conversation: Conversation): void {
    const json = JSON.stringify(conversation, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.download = `${conversation.name.replace(/[^a-z0-9]/gi, '_')}.json`;
    link.href = url;
    link.click();
    
    URL.revokeObjectURL(url);
  }
}

// Export singleton instance
export const exportService = new ExportService();