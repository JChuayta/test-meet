import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Modal, Form } from 'react-bootstrap';
import { useUser } from '../../../../shared/context/UserContext';
import { useRoom } from '../../../../shared/context/RoomContext';
import { disconnectAll, getRoomsSocket } from '../../../../shared/config/socket';

export function DashboardPage() {
  const { user, setUser } = useUser();
  const { setRoom } = useRoom();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [inviteLink, setInviteLink] = useState('');

  const handleLogout = () => {
    disconnectAll();
    setUser(null);
    navigate('/');
  };

  const handleCreateRoom = async () => {
    if (!roomName.trim() || !user) return;

    const socket = getRoomsSocket(user.id);
    socket.emit('room:create', { ownerId: user.id, name: roomName });

    socket.once('room:created', ({ room }: { room: any }) => {
      setRoom(room);
      setShowCreate(false);
      navigate(`/room/${room.inviteLink}`);
    });
  };

  const handleJoinRoom = () => {
    if (!inviteLink.trim() || !user) return;
    navigate(`/room/${inviteLink}`);
  };

  return (
    <div className="w-100" style={{ maxWidth: '600px' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Hola, {user?.name}</h2>
        <Button variant="outline-secondary" onClick={handleLogout}>
          Salir
        </Button>
      </div>

      <Card className="mb-4">
        <Card.Body>
          <h5>Crea una reunión</h5>
          <p className="text-muted">Comparte el link con quienes quieras invitar</p>
          <Button variant="primary" onClick={() => setShowCreate(true)}>
            Nueva reunión
          </Button>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <h5>Unirse a una reunión</h5>
          <p className="text-muted">Ingresa el link de invitación</p>
          <div className="d-flex gap-2">
            <Form.Control
              type="text"
              placeholder="Pega el link o código"
              value={inviteLink}
              onChange={(e) => setInviteLink(e.target.value)}
            />
            <Button variant="success" onClick={handleJoinRoom}>
              Unirse
            </Button>
          </div>
        </Card.Body>
      </Card>

      <Modal show={showCreate} onHide={() => setShowCreate(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Nueva reunión</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Nombre de la reunión</Form.Label>
            <Form.Control
              type="text"
              placeholder="Ej: Reunión de equipo"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreate(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleCreateRoom}>
            Crear
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}