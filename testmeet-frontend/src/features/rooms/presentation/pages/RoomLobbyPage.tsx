import { useEffect, useState } from 'react';
import { Button, Card, Spinner } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { getRoomsSocket } from '../../../../shared/config/socket';
import { useRoom } from '../../../../shared/context/RoomContext';
import { useUser } from '../../../../shared/context/UserContext';
import { PendingRequestsModal } from '../components/PendingRequestsModal';

interface PendingRequest {
  id: string;
  userId: string;
  userName: string;
}

interface RoomData {
  id: string;
  name: string;
  inviteLink: string;
  ownerId: string;
}

export function RoomLobbyPage() {
  const { inviteLink } = useParams<{ inviteLink: string }>();
  const { user } = useUser();
  const { setRoom, pendingRequests, setPendingRequests } = useRoom();
  const navigate = useNavigate();
  const [room, setRoomData] = useState<RoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showRequestsModal, setShowRequestsModal] = useState(false);

  useEffect(() => {
    if (user) {
      const socket = getRoomsSocket(user.id);
    }
  }, [user]);

  useEffect(() => {
    if (!inviteLink || !user) return;

    fetch(`http://localhost:3000/rooms/${inviteLink}`)
      .then((res) => res.json())
      .then((data) => {
        setRoomData(data);
        const isOwnerLocal = data.ownerId === user.id;
        setIsOwner(isOwnerLocal);
        setRoom(data);
        
        if (user?.id) {
          const socket = getRoomsSocket(user.id);
          socket.emit('room:join', { roomId: data.id });
        }
        
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [inviteLink, user]);

  useEffect(() => {
    if (!user || !room) return;

    const socket = getRoomsSocket(user.id);
    const isOwnerLocal = room.ownerId === user.id;

    if (isOwnerLocal) {
      const handlePendingRequest = ({ request }: { request: PendingRequest }) => {
        setPendingRequests((prev: PendingRequest[]) => {
          if (prev.some((r) => r.id === request.id)) return prev;
          return [...prev, request];
        });
      };
      
      socket.on('room:pending-request', handlePendingRequest);

      return () => {
        socket.off('room:pending-request', handlePendingRequest);
      };
    }
    
    if (!isOwnerLocal) {
      socket.emit('room:join-request', { inviteLink, userId: user.id, userName: user.name });
      
      const handleApproved = () => {
        navigate(`/room/${room.id}/session`);
      };
      
      socket.on('room:join-approved', handleApproved);

      return () => {
        socket.off('room:join-approved', handleApproved);
      };
    }
  }, [room?.id, room?.ownerId, user, inviteLink, navigate, setPendingRequests]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/room/${inviteLink}`);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleApprove = (requestUserId: string) => {
    if (!user || !room) return;
    const socket = getRoomsSocket(user.id);
    socket.emit('room:approve', { roomId: room.id, userId: requestUserId });
    setPendingRequests((prev: PendingRequest[]) => prev.filter((r) => r.userId !== requestUserId));
  };

  const handleReject = (requestUserId: string) => {
    if (!user || !room) return;
    const socket = getRoomsSocket(user.id);
    socket.emit('room:reject', { roomId: room.id, userId: requestUserId });
    setPendingRequests((prev: PendingRequest[]) => prev.filter((r) => r.userId !== requestUserId));
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

  if (!room && !loading) {
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

  if (isOwner || room?.ownerId === user?.id) {
    return (
      <>
        <Card style={{ width: '450px' }}>
          <Card.Body>
            <div className="text-center mb-4">
              <h4>{room?.name}</h4>
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

        {showRequestsModal && room && (
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