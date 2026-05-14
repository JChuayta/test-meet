import { useEffect, useRef, useState } from 'react';
import { Button, ListGroup, Modal, Spinner } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { getRoomsSocket } from '../../../../shared/config/socket';
import { useRoom } from '../../../../shared/context/RoomContext';
import { useUser } from '../../../../shared/context/UserContext';
import { ChatPanel } from '../../../chat/presentation/components/ChatPanel';
import { useMultiParticipantSignaling } from '../../../signaling/application/hooks/useMultiParticipantSignaling';
import { ParticipantGrid } from '../components/ParticipantGrid';
import { PendingRequestsModal } from '../components/PendingRequestsModal';

interface PendingRequest {
  id: string;
  userId: string;
  userName: string;
}

export function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { user } = useUser();
  const { room, setRoom, isOwner, setIsOwner, pendingRequests, setPendingRequests } = useRoom();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [participants, setParticipants] = useState<string[]>([]);
  const roomsSocketRef = useRef<any>(null);

  const {
    localStream,
    remoteStreams,
    initiateCallWithParticipant,
    callStatus,
    activeParticipants,
  } = useMultiParticipantSignaling({ userId: user?.id || '', participants });

  useEffect(() => {
    if (!roomId || !user) return;

    fetch(`http://localhost:3000/rooms/session/${roomId}`)
      .then((res) => res.json())
      .then((data) => {
        setRoom(data);
        setIsOwner(data.ownerId === user.id);
        setLoading(false);
        if (data.participants) {
          const participantIds = data.participants.map((p: any) => p.userId);
          setParticipants(participantIds);
        }
      })
      .catch(() => setLoading(false));

    const socket = getRoomsSocket(user.id);
    roomsSocketRef.current = socket;
    socket.emit('room:join', { roomId });

    socket.on('room:user-joined', ({ userId: newUserId }: { userId: string }) => {
      setParticipants((prev: string[]) => {
        if (prev.includes(newUserId)) return prev;
        return [...prev, newUserId];
      });
    });

    socket.on('room:pending-request', ({ request }: { request: PendingRequest }) => {
      setPendingRequests((prev) => {
        if (prev.some((r) => r.id === request.id)) return prev;
        return [...prev, request];
      });
    });

    socket.on('room:user-left', ({ userId: leftUserId }: { userId: string }) => {
      setParticipants((prev) => prev.filter((id) => id !== leftUserId));
    });

    return () => {
      socket.off('room:user-joined');
      socket.off('room:pending-request');
      socket.off('room:user-left');
    };
  }, [roomId, user]);

  useEffect(() => {
    if (!participants || participants.length === 0 || !user) return;
    if (!isOwner) return;

    participants.forEach((participantId) => {
      if (participantId !== user.id) {
        initiateCallWithParticipant(participantId).catch(() => {
          // Error initiating call
        });
      }
    });
  }, [participants, user, isOwner, initiateCallWithParticipant]);

  useEffect(() => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      const videoTracks = localStream.getVideoTracks();
      audioTracks.forEach((track) => { track.enabled = !isMuted; });
      videoTracks.forEach((track) => { track.enabled = !isVideoOff; });
    }
  }, [isMuted, isVideoOff, localStream]);

  const handleApprove = (requestUserId: string) => {
    if (!roomId || !user) return;
    const socket = getRoomsSocket(user.id);
    socket.emit('room:approve', { roomId, userId: requestUserId });
    setPendingRequests((prev: PendingRequest[]) => prev.filter((r) => r.userId !== requestUserId));
  };

  const handleReject = (requestUserId: string) => {
    if (!roomId || !user) return;
    const socket = getRoomsSocket(user.id);
    socket.emit('room:reject', { roomId, userId: requestUserId });
    setPendingRequests((prev: PendingRequest[]) => prev.filter((r) => r.userId !== requestUserId));
  };

  const handleLeave = () => {
    if (localStream) localStream.getTracks().forEach((t) => t.stop());
    if (user && roomId) {
      const socket = getRoomsSocket(user.id);
      socket.emit('room:leave', { roomId, userId: user.id });
    }
    navigate('/dashboard');
  };

  const toggleMute = () => setIsMuted(!isMuted);
  const toggleVideo = () => setIsVideoOff(!isVideoOff);

  if (loading) {
    return <div className="text-center"><Spinner animation="border" /><p>Conectando a la sala...</p></div>;
  }

  return (
    <div className="w-100 h-100 d-flex flex-column">
      <div className="d-flex justify-content-between align-items-center p-3 bg-light">
        <h5>{room?.name}</h5>
        <Button variant="danger" size="sm" onClick={handleLeave}>Salir</Button>
      </div>

      <div className="flex-grow-1 position-relative bg-dark">
        <ParticipantGrid
          participants={participants}
          localStream={localStream}
          localUserId={user?.id || ''}
          remoteStreams={remoteStreams}
          callStatus={callStatus}
          activeParticipants={activeParticipants}
        />
      </div>

      <div className="d-flex justify-content-center gap-3 p-3 bg-light">
        <Button variant={isMuted ? 'danger' : 'secondary'} onClick={toggleMute}>
          {isMuted ? '🔇' : '🎤'}
        </Button>
        <Button variant={isVideoOff ? 'danger' : 'secondary'} onClick={toggleVideo}>
          {isVideoOff ? '📵' : '📹'}
        </Button>
        <Button variant={showChat ? 'primary' : 'outline-primary'} onClick={() => setShowChat(!showChat)}>
          💬
        </Button>
        {isOwner && pendingRequests.length > 0 && (
          <Button variant="warning" onClick={() => setShowRequestsModal(true)}>
            👥 {pendingRequests.length}
          </Button>
        )}
      </div>

      {showChat && roomId && user && (
        <div className="position-fixed end-0 bottom-0" style={{ width: '350px', height: '400px' }}>
          <ChatPanel roomId={roomId} userId={user.id} onClose={() => setShowChat(false)} />
        </div>
      )}

      {showRequestsModal && roomId && (
        <PendingRequestsModal
          roomId={roomId}
          pendingRequests={pendingRequests}
          onClose={() => setShowRequestsModal(false)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
}