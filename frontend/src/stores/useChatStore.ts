import { create } from 'zustand';

interface Message {
  id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  streaming?: boolean;
}

interface ChatState {
  currentSessionId: number | null;
  messages: Message[];
  isStreaming: boolean;
  setCurrentSession: (id: number) => void;
  addMessage: (msg: Message) => void;
  appendToLastMessage: (chunk: string) => void;
  setStreaming: (v: boolean) => void;
  clearMessages: () => void;
}

const useChatStore = create<ChatState>((set) => ({
  currentSessionId: null,
  messages: [],
  isStreaming: false,
  setCurrentSession: (id) => set({ currentSessionId: id, messages: [] }),
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  appendToLastMessage: (chunk) =>
    set((state) => {
      const msgs = [...state.messages];
      if (msgs.length > 0) {
        const last = { ...msgs[msgs.length - 1] };
        last.content += chunk;
        msgs[msgs.length - 1] = last;
      }
      return { messages: msgs };
    }),
  setStreaming: (v) => set({ isStreaming: v }),
  clearMessages: () => set({ messages: [] }),
}));

export default useChatStore;
