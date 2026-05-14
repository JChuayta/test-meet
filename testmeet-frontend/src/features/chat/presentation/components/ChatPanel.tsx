import { useEffect, useRef, useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import { getChatSocket } from '../../../../shared/config/socket';

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
}

interface ChatPanelProps {
  roomId: string;
  userId: string;
  onClose?: () => void;
}

export function ChatPanel({ roomId, userId, onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    socketRef.current = getChatSocket(userId);
    socketRef.current.emit('chat:join-room', { roomId });
    socketRef.current.emit('chat:get', { roomId });

    socketRef.current.on('connect', () => setIsConnected(true));
    socketRef.current.on('disconnect', () => setIsConnected(false));
    socketRef.current.on('chat:message', (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });
    socketRef.current.on('chat:history', (msgs: Message[]) => {
      setMessages(msgs);
    });

    return () => {
      socketRef.current?.emit('chat:leave-room', { roomId });
    };
  }, [roomId, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !socketRef.current) return;
    socketRef.current.emit('chat:send', { roomId, senderId: userId, content: input.trim() });
    setInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="d-flex flex-column h-100 bg-white border rounded">
      <div className="d-flex justify-content-between align-items-center p-2 border-bottom">
        <span className="fw-bold">Chat</span>
        <span className={`badge ${isConnected ? 'bg-success' : 'bg-danger'}`}>
          {isConnected ? 'Online' : 'Offline'}
        </span>
        {onClose && (
          <Button variant="link" size="sm" onClick={onClose}>
            ×
          </Button>
        )}
      </div>

      <div className="flex-grow-1 overflow-auto p-2">
        {messages.length === 0 ? (
          <div className="text-center text-muted p-3">No hay mensajes</div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`mb-2 ${msg.senderId === userId ? 'text-end' : ''}`}>
              <div
                className={`badge ${msg.senderId === userId ? 'bg-primary' : 'bg-secondary'}`}
                style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-2 border-top d-flex gap-2">
        <Form.Control
          type="text"
          size="sm"
          placeholder="Mensaje..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          maxLength={100}
        />
        <Button size="sm" onClick={handleSend} disabled={!input.trim()}>
          Enviar
        </Button>
      </div>
    </div>
  );
}