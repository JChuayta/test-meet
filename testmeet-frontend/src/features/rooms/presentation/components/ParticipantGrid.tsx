import { useRef } from 'react';
import { VideoPlayer } from '../../../signaling/presentation/components/VideoPlayer';
import styles from './ParticipantGrid.module.css';

interface Participant {
  userId: string;
  userName: string;
}

interface ParticipantGridProps {
  participants: Participant[];
  localStream: MediaStream | null;
  localUserId: string;
  localUserName: string;
  remoteStreams?: Map<string, MediaStream>;
  callStatus?: 'idle' | 'calling' | 'answered' | 'connected';
  activeParticipants?: Set<string>;
}

export const ParticipantGrid = (props: ParticipantGridProps) => {
  const {
    participants,
    localStream,
    localUserId,
    localUserName,
    remoteStreams = new Map(),
    callStatus = 'idle',
    activeParticipants = new Set()
  } = props;

  const localVideoRef = useRef<HTMLDivElement>(null);

  const getConnectionLabel = (participantId: string, userName: string): string => {
    if (activeParticipants.has(participantId)) {
      return userName;
    }
    if (callStatus === 'calling') {
      return `${userName} - Llamando...`;
    }
    return `${userName} - Conectando...`;
  };

  const totalParticipants = (participants?.filter(p => p.userId !== localUserId)?.length || 0) + 1;
  let gridClass = styles.grid1;
  if (totalParticipants === 2) gridClass = styles.grid2;
  else if (totalParticipants === 3) gridClass = styles.grid3;
  else if (totalParticipants === 4) gridClass = styles.grid4;
  else if (totalParticipants === 6) gridClass = styles.grid6;

  return (
    <div className={`${styles.grid} ${gridClass}`}>
      <div className={styles.cell} ref={localVideoRef}>
        <VideoPlayer
          stream={localStream}
          muted
          placeholder={`${localUserName} (Tú)`}
        />
        <span className={styles.label}>{localUserName} (Tú)</span>
      </div>

      {(participants || []).filter(p => p.userId !== localUserId).map((participant) => (
        <div key={participant.userId} className={styles.cell}>
          <VideoPlayer
            stream={remoteStreams.get(participant.userId) || null}
            placeholder={getConnectionLabel(participant.userId, participant.userName)}
          />
          <span className={styles.label}>{getConnectionLabel(participant.userId, participant.userName)}</span>
        </div>
      ))}
    </div>
  );
};