import React, { createContext, useContext, useState, useCallback } from 'react';

export type ChatState = 'closed' | 'minimized' | 'open';

interface ChatContextType {
  chatState: ChatState;
  openChat: () => void;
  minimizeChat: () => void;
  closeChat: () => void;
}

const ChatCtx = createContext<ChatContextType>({
  chatState: 'closed',
  openChat: () => {},
  minimizeChat: () => {},
  closeChat: () => {},
});

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [chatState, setChatState] = useState<ChatState>('closed');
  const openChat = useCallback(() => setChatState('open'), []);
  const minimizeChat = useCallback(() => setChatState('minimized'), []);
  const closeChat = useCallback(() => setChatState('closed'), []);
  return (
    <ChatCtx.Provider value={{ chatState, openChat, minimizeChat, closeChat }}>
      {children}
    </ChatCtx.Provider>
  );
};

export const useChat = () => useContext(ChatCtx);
