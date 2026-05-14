import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { getRoomsSocket } from '../../../../shared/config/socket';
import { useRoom } from '../../../../shared/context/RoomContext';
import { useUser } from '../../../../shared/context/UserContext';

export interface RoomData {
  id: string;
  name: string;
  inviteLink: string;
  ownerId: string;
}

export interface PendingRequest {
  id: string;
  userId: string;
  userName: string;
}

export function useRoomData(inviteLink: string | undefined) {
  const { user } = useUser();
  const { setRoom } = useRoom();
  const [room, setRoomData] = useState<RoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!inviteLink || !user) return;

    setLoading(true);
    setError(null);

    axios.get<RoomData>(`http://localhost:3000/rooms/${inviteLink}`)
      .then((res) => res.data)
      .then((data) => {
        setRoomData(data);
        setRoom(data);
        const socket = getRoomsSocket(user.id);
        socket.emit('room:join', { roomId: data.id });
      })
      .catch(() => setError('Room not found'))
      .finally(() => setLoading(false));
  }, [inviteLink, user, setRoom]);

  return { room, loading, error };
}

export function useRoomSocket(room: RoomData | null, isOwner: boolean, user: { id: string; name: string } | null) {
  const { pendingRequests, setPendingRequests } = useRoom();
  const navigate = useNavigate();
  const { inviteLink } = useParams<{ inviteLink: string }>();

  const handleApprove = useCallback((requestUserId: string) => {
    if (!user || !room) return;
    const socket = getRoomsSocket(user.id);
    socket.emit('room:approve', { roomId: room.id, userId: requestUserId });
    setPendingRequests((prev: PendingRequest[]) => prev.filter((r) => r.userId !== requestUserId));
  }, [user, room, setPendingRequests]);

  const handleReject = useCallback((requestUserId: string) => {
    if (!user || !room) return;
    const socket = getRoomsSocket(user.id);
    socket.emit('room:reject', { roomId: room.id, userId: requestUserId });
    setPendingRequests((prev: PendingRequest[]) => prev.filter((r) => r.userId !== requestUserId));
  }, [user, room, setPendingRequests]);

  useEffect(() => {
    if (!user || !room) return;

    const socket = getRoomsSocket(user.id);

    if (isOwner) {
      const handlePendingRequest = ({ request }: { request: PendingRequest }) => {
        setPendingRequests((prev: PendingRequest[]) => {
          if (prev.some((r) => r.id === request.id)) return prev;
          return [...prev, request];
        });
      };
      socket.on('room:pending-request', handlePendingRequest);
      return () => socket.off('room:pending-request', handlePendingRequest);
    } else {
      socket.emit('room:join-request', { inviteLink, userId: user.id, userName: user.name });
      const handleApproved = () => navigate(`/room/${room.id}/session`);
      socket.on('room:join-approved', handleApproved);
      return () => socket.off('room:join-approved', handleApproved);
    }
  }, [room?.id, room?.ownerId, user, inviteLink, isOwner, navigate, setPendingRequests]);

  return { pendingRequests, handleApprove, handleReject };
}