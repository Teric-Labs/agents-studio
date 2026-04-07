import { Flex } from '@radix-ui/themes';

export const AgentChatIndicator = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
    const dotSize = size === 'sm' ? 4 : size === 'lg' ? 8 : 6;
    return (
        <Flex gap="1" align="center" justify="center" style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '16px', borderBottomLeftRadius: '4px', display: 'inline-flex', minWidth: '60px' }}>
            <style>{`
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-4px); }
                }
                .dot {
                    width: ${dotSize}px;
                    height: ${dotSize}px;
                    background-color: #64748b;
                    border-radius: 50%;
                    animation: bounce 1.4s infinite ease-in-out both;
                }
                .dot:nth-child(1) { animation-delay: -0.32s; }
                .dot:nth-child(2) { animation-delay: -0.16s; }
            `}</style>
            <div className="dot" />
            <div className="dot" />
            <div className="dot" />
        </Flex>
    );
};
