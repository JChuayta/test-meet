import { useState } from 'react';
import { Button, Card, Spinner } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { useUser } from '../../../../shared/context/UserContext';
import { useRoomData, useRoomSocket } from '../../application/hooks/useRoomData';
import { PendingRequestsModal } from '../components/PendingRequestsModal';

export function RoomLobbyPage() {
  const { inviteLink } = useParams<{ inviteLink: string }>();
  const { user } = useUser();
  const navigate = useNavigate();

  const { room, loading, error } = useRoomData(inviteLink);
  const isOwner = user?.id === room?.ownerId;
  const { pendingRequests, handleApprove, handleReject } = useRoomSocket(room, isOwner, user);

  const [linkCopied, setLinkCopied] = useState(false);
  const [showRequestsModal, setShowRequestsModal] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/room/${inviteLink}`);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleStartSession = () => {
    if (room) navigate(`/room/${room.id}/session`);
  };

  if (loading) {
    return (
      <div className="text-center">
        <Spinner animation="border" />
        <p>Conectando...</p>
      </div>
    );
  }

  if (error || !room) {
    return (
      <Card style={{ width: '400px' }}>
        <Card.Body>
          <h5>Reunión no encontrada</h5>
          <p className="text-muted">El link puede ser inválido</p>
          <Button variant="primary" onClick={() => navigate('/dashboard')}>
            Volver al inicio
          </Button>
        </Card.Body>
      </Card>
    );
  }

  if (isOwner) {
    return (
      <>
        <Card style={{ width: '450px' }}>
          <Card.Body>
            <div className="text-center mb-4">
              <h4>{room.name}</h4>
              <p className="text-muted">Reunión creada</p>
            </div>

            <div className="d-flex gap-2 mb-3">
              <code className="flex-grow-1 p-2 rounded bg-light">{inviteLink}</code>
              <Button variant="outline-primary" onClick={handleCopyLink}>
                {linkCopied ? '✓' : '📋'}
              </Button>
            </div>

            <div className="d-flex gap-2">
              <Button variant="success" className="flex-grow-1" onClick={handleStartSession}>
                Iniciar ahora →
              </Button>
              {pendingRequests.length > 0 && (
                <Button variant="info" onClick={() => setShowRequestsModal(true)}>
                  {pendingRequests.length} solicitud{pendingRequests.length !== 1 ? 'es' : ''} pendiente{pendingRequests.length !== 1 ? 's' : ''}
                </Button>
              )}
            </div>
          </Card.Body>

          <div className="text-center p-2 border-top">
            <small className="text-muted">Compartí el link para que otros se unan</small>
          </div>
        </Card>

        {showRequestsModal && (
          <PendingRequestsModal
            roomId={room.id}
            pendingRequests={pendingRequests}
            onClose={() => setShowRequestsModal(false)}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        )}
      </>
    );
  }

  return (
    <Card style={{ width: '450px' }}>
      <Card.Body>
        <div className="text-center mb-4">
          <Spinner animation="border" size="sm" />
          <h5 className="mt-3">Esperando aprobación...</h5>
          <p className="text-muted">El propietario debe aceptarte</p>
        </div>
      </Card.Body>

      <div className="text-center p-2 border-top">
        <small className="text-muted">Compartí el link para que otros se unan</small>
      </div>
    </Card>
  );
}