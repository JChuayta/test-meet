import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Spinner, Modal, ListGroup } from 'react-bootstrap';
import { useUser } from '../../../../shared/context/UserContext';
import { useRoom } from '../../../../shared/context/RoomContext';
import { getRoomsSocket } from '../../../../shared/config/socket';

interface RoomData {
  id: string;
  name: string;
  inviteLink: string;
  ownerId: string;
}

export function RoomLobbyPage() {
  const { inviteLink } = useParams<{ inviteLink: string }>();
  const { user } = useUser();
  const { setRoom } = useRoom();
  const navigate = useNavigate();
  const [room, setRoomData] = useState<RoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showRequests, setShowRequests] = useState(false);

  // Conectar socket inmediatamente
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
        
        // Unirse a la sala en el socket para recibir eventos
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

    // Setup para que el owner reciba solicitudes pendientes
    if (isOwnerLocal) {
      const handlePendingRequest = ({ request }: { request: any }) => {
        setPendingRequests((prev) => {
          const isDuplicate = prev.some((r) => r.id === request.id);
          if (isDuplicate) return prev;
          return [...prev, request];
        });
      };
      
      socket.on('room:pending-request', handlePendingRequest);

      return () => {
        socket.off('room:pending-request', handlePendingRequest);
      };
    }
    
    // Setup para que no-owner escuche aprobación
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
  }, [room?.id, room?.ownerId, user, inviteLink, navigate]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/room/${inviteLink}`);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleApprove = (requestUserId: string) => {
    if (!user || !room) return;
    const socket = getRoomsSocket(user.id);
    socket.emit('room:approve', { roomId: room.id, userId: requestUserId });
    setPendingRequests((prev) => prev.filter((r) => r.userId !== requestUserId));
  };

  const handleReject = (requestUserId: string) => {
    if (!user || !room) return;
    const socket = getRoomsSocket(user.id);
    socket.emit('room:reject', { roomId: room.id, userId: requestUserId });
    setPendingRequests((prev) => prev.filter((r) => r.userId !== requestUserId));
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

  return (
    <Card style={{ width: '450px' }}>
      <Card.Body>
        {isOwner || room?.ownerId === user?.id ? (
          <>
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
                Iniciar ahora
              </Button>
              {pendingRequests.length > 0 && (
                <Button variant="info" onClick={() => setShowRequests(true)}>
                  {pendingRequests.length} solicitudes
                </Button>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-4">
              <Spinner animation="border" size="sm" />
              <h5 className="mt-3">Esperando aprobación...</h5>
              <p className="text-muted">El propietario debe aceptarte</p>
            </div>
          </>
        )}
      </Card.Body>

      <Modal show={showRequests} onHide={() => setShowRequests(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Solicitudes pendientes</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ListGroup>
            {pendingRequests.map((req) => (
              <ListGroup.Item key={req.id} className="d-flex justify-content-between">
                <span>{req.userName}</span>
                <div className="d-flex gap-2">
                  <Button size="sm" variant="success" onClick={() => handleApprove(req.userId)}>
                    Aprobar
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => handleReject(req.userId)}>
                    Rechazar
                  </Button>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Modal.Body>
      </Modal>
    </Card>
  );
}