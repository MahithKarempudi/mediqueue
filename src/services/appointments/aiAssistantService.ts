import { aiAssistantService as baseAiService } from '../ai/aiAssistantService';
import type { User } from '@/types';
import type { AssistantMessage } from '@/types/appointmentWorkflow';

export const aiAssistantService = {
  ...baseAiService,
  async processUserMessage(promptText: string, caller: User): Promise<AssistantMessage> {
    const res = await baseAiService.processUserMessage(promptText, caller);
    return {
      id: `ai_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      sender: 'assistant',
      text: res.message,
      timestamp: new Date().toISOString(),
      workflowState: res.intent ? 'AWAITING_CONFIRMATION' : res.slots ? 'AVAILABLE' : 'IDLE',
      toolInvoked: res.toolName,
      suggestedSlots: res.slots,
      bookingIntent: res.intent,
      data: {
        engineMode: res.engineMode || 'CLINICAL_NLU_DETERMINISTIC',
        doctors: res.doctors,
        hospitals: res.hospitals,
        queueStatus: res.queueStatus,
        patientProfile: res.patientProfile,
        appointments: res.appointments,
        beds: res.beds,
        operationalSummary: res.operationalSummary,
      },
    };
  },
};
