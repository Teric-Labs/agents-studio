import { useEffect, useRef } from 'react';
import { Flex, Box, Text } from '@radix-ui/themes';
import { AgentChatIndicator } from './agent-chat-indicator';

export interface ChatMessage {
    id: string;
    name: string;
    text: string;
    isFinal: boolean;
}

export const AgentChatTranscript = ({ 
    messages, 
    agentState 
}: { 
    messages: ChatMessage[], 
    agentState: string 
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, agentState]);

    return (
        <Flex direction="column" gap="4" style={{ height: '100%', overflowY: 'auto', padding: '24px 16px' }} ref={scrollRef}>
            {messages.map((msg, i) => {
                const isUser = msg.name === 'You' || msg.name === 'user';
                return (
                    <Box 
                        key={msg.id || i}
                        style={{ 
                            alignSelf: isUser ? 'flex-end' : 'flex-start',
                            backgroundColor: isUser ? '#1e293b' : '#f1f5f9',
                            color: isUser ? '#f8fafc' : '#0f172a',
                            padding: '12px 18px',
                            borderRadius: '20px',
                            borderBottomRightRadius: isUser ? '4px' : '20px',
                            borderBottomLeftRadius: isUser ? '20px' : '4px',
                            maxWidth: '80%',
                            boxShadow: isUser ? 'none' : '0 1px 2px rgba(0,0,0,0.05)',
                        }}
                    >
                        <Text style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '14px', opacity: msg.isFinal ? 1 : 0.7 }}>
                            {msg.text}
                        </Text>
                    </Box>
                );
            })}
            {agentState === 'thinking' && (
                <Box style={{ alignSelf: 'flex-start', marginBottom: '8px' }}>
                    <AgentChatIndicator size="md" />
                </Box>
            )}
        </Flex>
    );
};
