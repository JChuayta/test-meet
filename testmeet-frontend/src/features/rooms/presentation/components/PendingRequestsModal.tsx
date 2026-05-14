import { useState } from 'react';
import { Badge, Button, ListGroup, Modal } from 'react-bootstrap';

interface PendingRequest {
  id: string;
  userId: string;
  userName: string;
}

interface PendingRequestsModalProps {
  roomId: string;
  pendingRequests: PendingRequest[];
  onClose: () => void;
  onApprove: (userId: string) => void;
  onReject: (userId: string) => void;
}

export function PendingRequestsModal({ 
  roomId, 
  pendingRequests, 
  onClose, 
  onApprove, 
  onReject 
}: PendingRequestsModalProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div 
      style={{ 
        position: 'fixed', 
        bottom: '100px', 
        right: '20px', 
        width: '320px',
        background: '#16213e',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
        zIndex: 100,
        overflow: 'hidden',
        color: 'white'
      }}
    >
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '12px 16px',
          background: '#0f3460',
          cursor: 'pointer',
          borderBottom: expanded ? '1px solid rgba(255,255,255,0.1)' : 'none'
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '10px', color: '#a0a0a0' }}>{expanded ? '▼' : '▶'}</span>
          <span style={{ fontSize: '14px', fontWeight: 600 }}>Solicitudes Pendientes</span>
          {pendingRequests.length > 0 && (
            <Badge bg="primary" style={{ fontSize: '11px', padding: '2px 6px' }}>
              {pendingRequests.length}
            </Badge>
          )}
        </div>
        <button 
          style={{ 
            background: 'none', 
            border: 'none', 
            fontSize: '18px', 
            color: '#a0a0a0', 
            cursor: 'pointer',
            padding: 0,
            lineHeight: 1
          }}
          onClick={(e) => { e.stopPropagation(); onClose(); }}
        >
          ×
        </button>
      </div>

      {expanded && (
        <div style={{ padding: '12px 16px', maxHeight: '250px', overflowY: 'auto' }}>
          {pendingRequests.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#a0a0a0', fontSize: '13px', padding: '16px 0' }}>
              No hay solicitudes pendientes
            </div>
          ) : (
            <ListGroup>
              {pendingRequests.map((request) => (
                <ListGroup.Item 
                  key={request.id} 
                  style={{ 
                    background: '#16213e', 
                    border: 'none',
                    marginBottom: '8px',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px'
                  }}
                >
                  <span style={{ fontSize: '13px', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>
                    {request.userName}
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <Button 
                      size="sm" 
                      style={{ background: '#22c55e', border: 'none', fontSize: '12px' }}
                      onClick={() => onApprove(request.userId)}
                    >
                      ✓ Aprobar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="danger"
                      style={{ fontSize: '12px' }}
                      onClick={() => onReject(request.userId)}
                    >
                      ✗ Rechazar
                    </Button>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </div>
      )}
    </div>
  );
}