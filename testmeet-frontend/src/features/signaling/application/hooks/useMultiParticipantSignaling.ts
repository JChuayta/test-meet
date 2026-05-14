import { useCallback, useEffect, useRef, useState } from 'react';
import { getSocket } from '../../../../shared/config/socket';
import type { Call } from '../../domain/types';

interface UseMultiParticipantSignalingProps {
  userId: string;
  participants: string[];
}

interface UseMultiParticipantSignalingReturn {
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  initiateCallWithParticipant: (participantId: string) => Promise<void>;
  callStatus: 'idle' | 'calling' | 'answered' | 'connected';
  activeParticipants: Set<string>;
  toggleAudio: () => void;
  toggleVideo: () => void;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export const useMultiParticipantSignaling = ({
  userId,
  participants
}: UseMultiParticipantSignalingProps): UseMultiParticipantSignalingReturn => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'answered' | 'connected'>('idle');
  const [activeParticipants, setActiveParticipants] = useState<Set<string>>(new Set());
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);

  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);
  const pendingCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const hasSetRemoteDescriptionRef = useRef<Map<string, boolean>>(new Map());
  const answerCallFromParticipantRef = useRef<((participantId: string, offerSdp: string) => Promise<void>) | undefined>(undefined);
  const flushPendingCandidatesRef = useRef<((pc: RTCPeerConnection, participantId: string) => Promise<void>) | undefined>(undefined);

  const toggleAudio = useCallback(() => {
    setIsAudioEnabled(prev => !prev);
  }, []);

  const toggleVideo = useCallback(() => {
    setIsVideoEnabled(prev => !prev);
  }, []);

  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = isAudioEnabled;
      });
      localStream.getVideoTracks().forEach(track => {
        track.enabled = isVideoEnabled;
      });
    }
  }, [isAudioEnabled, isVideoEnabled, localStream]);

  const createPeerConnection = useCallback((participantId: string) => {
    if (peerConnectionsRef.current.has(participantId)) {
      return peerConnectionsRef.current.get(participantId)!;
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('ice:candidate', {
          participantId,
          candidate: JSON.stringify(event.candidate),
        });
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStreams((prev) => {
          const newStreams = new Map(prev);
          newStreams.set(participantId, event.streams[0]);
          return newStreams;
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        setActiveParticipants((prev) => {
          const newSet = new Set(prev);
          newSet.add(participantId);
          return newSet;
        });
        updateCallStatus();
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setActiveParticipants((prev) => {
          const newSet = new Set(prev);
          newSet.add(participantId);
          return newSet;
        });
        updateCallStatus();
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        setActiveParticipants((prev) => {
          const newSet = new Set(prev);
          newSet.delete(participantId);
          return newSet;
        });
      }
    };

    peerConnectionsRef.current.set(participantId, pc);
    return pc;
  }, []);

  const updateCallStatus = useCallback(() => {
    if (activeParticipants.size > 0) {
      setCallStatus('connected');
    }
  }, [activeParticipants]);

  const flushPendingCandidates = useCallback(async (pc: RTCPeerConnection, participantId: string) => {
    if (hasSetRemoteDescriptionRef.current.get(participantId)) {
      const candidates = pendingCandidatesRef.current.get(participantId) || [];
      for (const candidate of candidates) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
        }
      }
      pendingCandidatesRef.current.set(participantId, []);
    }
  }, []);

  const initiateCallWithParticipant = useCallback(async (participantId: string): Promise<void> => {
    try {
      let stream = localStream;
      if (!stream) {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        stream.getAudioTracks().forEach(track => { track.enabled = false; });
        stream.getVideoTracks().forEach(track => { track.enabled = false; });
        setLocalStream(stream);
        setIsAudioEnabled(false);
        setIsVideoEnabled(false);
      }

      let pc = peerConnectionsRef.current.get(participantId);
      
      if (pc) {
        if (pc.signalingState !== 'stable' && pc.signalingState !== 'have-local-offer') {
          pc.close();
          peerConnectionsRef.current.delete(participantId);
          pc = null;
        }
      }

      if (!pc) {
        pc = createPeerConnection(participantId);
      }

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socketRef.current?.emit('call:initiate', {
        participantId,
        offerSdp: JSON.stringify(offer),
      });

      setCallStatus('calling');
    } catch (error) {
      throw error;
    }
  }, [localStream, createPeerConnection]);

  const answerCallFromParticipant = useCallback(async (participantId: string, offerSdp: string): Promise<void> => {
    try {
      let stream = localStream;
      if (!stream) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          stream.getAudioTracks().forEach(track => { track.enabled = false; });
          stream.getVideoTracks().forEach(track => { track.enabled = false; });
          setLocalStream(stream);
          setIsAudioEnabled(false);
          setIsVideoEnabled(false);
        } catch (mediaError: any) {
          if (mediaError.name === 'NotReadableError' || mediaError.name === 'DevicesNotFoundError') {
            throw new Error('Camera or microphone is in use by another application. Please close other apps using your camera.');
          }
          throw mediaError;
        }
      }

      let pc = peerConnectionsRef.current.get(participantId);

      if (!pc) {
        pc = createPeerConnection(participantId);
      }

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(offerSdp)));
      hasSetRemoteDescriptionRef.current.set(participantId, true);

      await flushPendingCandidatesRef.current?.(pc, participantId);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socketRef.current?.emit('call:answer', {
        participantId,
        answerSdp: JSON.stringify(answer),
      });

      setCallStatus('answered');
    } catch (error) {
      throw error;
    }
  }, [localStream, createPeerConnection]);

  const closePeerConnection = useCallback((participantId: string) => {
    const pc = peerConnectionsRef.current.get(participantId);
    if (pc) {
      pc.close();
      peerConnectionsRef.current.delete(participantId);
    }

    setRemoteStreams((prev) => {
      const newStreams = new Map(prev);
      newStreams.delete(participantId);
      return newStreams;
    });

    pendingCandidatesRef.current.delete(participantId);
    hasSetRemoteDescriptionRef.current.delete(participantId);

    setActiveParticipants((prev) => {
      const newSet = new Set(prev);
      newSet.delete(participantId);
      return newSet;
    });
  }, []);

  useEffect(() => {
    answerCallFromParticipantRef.current = answerCallFromParticipant;
  }, [answerCallFromParticipant]);

  useEffect(() => {
    flushPendingCandidatesRef.current = flushPendingCandidates;
  }, [flushPendingCandidates]);

  useEffect(() => {
    if (!userId) return;

    socketRef.current = getSocket(userId);

    if (socketRef.current) {
      socketRef.current.off('call:received');
      socketRef.current.off('call:answered');
      socketRef.current.off('ice:candidate');
    }

    socketRef.current.on('call:received', async (data: Call & { fromUserId: string }) => {
      try {
        await answerCallFromParticipantRef.current?.(data.fromUserId, data.offerSdp);
      } catch (error) {
      }
    });

    socketRef.current.on('call:answered', async (data: { participantId: string; answerSdp: string }) => {
      const pc = peerConnectionsRef.current.get(data.participantId);
      if (pc && data.answerSdp) {
        try {
          if (pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(data.answerSdp)));
            hasSetRemoteDescriptionRef.current.set(data.participantId, true);
            await flushPendingCandidatesRef.current?.(pc, data.participantId);
            setActiveParticipants((prev) => {
              const newSet = new Set(prev);
              newSet.add(data.participantId);
              return newSet;
            });
          }
        } catch (error) {
        }
      }
    });

    socketRef.current.on('ice:candidate', async (data: { participantId: string; candidate: string }) => {
      const pc = peerConnectionsRef.current.get(data.participantId);
      if (pc) {
        if (hasSetRemoteDescriptionRef.current.get(data.participantId)) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(JSON.parse(data.candidate)));
          } catch (error) {
          }
        } else {
          const candidates = pendingCandidatesRef.current.get(data.participantId) || [];
          candidates.push(JSON.parse(data.candidate));
          pendingCandidatesRef.current.set(data.participantId, candidates);
        }
      } else {
        const candidates = pendingCandidatesRef.current.get(data.participantId) || [];
        candidates.push(JSON.parse(data.candidate));
        pendingCandidatesRef.current.set(data.participantId, candidates);
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.off('call:received');
        socketRef.current.off('call:answered');
        socketRef.current.off('ice:candidate');
      }
    };
  }, [userId]);

  useEffect(() => {
    if (!participants || participants.length === 0) return;

    const remoteParticipants = participants.filter(id => id !== userId);
    const currentConnections = new Set(peerConnectionsRef.current.keys());

    for (const participantId of currentConnections) {
      if (!remoteParticipants.includes(participantId)) {
        closePeerConnection(participantId);
      }
    }
  }, [participants, userId, closePeerConnection]);

  return {
    localStream,
    remoteStreams,
    initiateCallWithParticipant,
    callStatus,
    activeParticipants,
    toggleAudio,
    toggleVideo,
    isAudioEnabled,
    isVideoEnabled,
  };
};