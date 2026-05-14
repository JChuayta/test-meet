import { useRef } from 'react';
import { VideoPlayer } from '../../../signaling/presentation/components/VideoPlayer';
import styles from './ParticipantGrid.module.css';

interface ParticipantGridProps {
  participants: string[];
  localStream: MediaStream | null;
  localUserId: string;
  remoteStreams?: Map<string, MediaStream>;
  callStatus?: 'idle' | 'calling' | 'answered' | 'connected';
  activeParticipants?: Set<string>;
}

export const ParticipantGrid = (props: ParticipantGridProps) => {
  const {
    participants,
    localStream,
    localUserId,
    remoteStreams = new Map(),
    callStatus = 'idle',
    activeParticipants = new Set()
  } = props;

  const localVideoRef = useRef<HTMLDivElement>(null);

  const getConnectionLabel = (participantId: string): string => {
    if (activeParticipants.has(participantId)) {
      return participantId;
    }
    if (callStatus === 'calling') {
      return `${participantId} - Llamando...`;
    }
    return `${participantId} - Conectando...`;
  };

  const totalParticipants = (participants?.filter(id => id !== localUserId)?.length || 0) + 1;
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
          placeholder={`${localUserId} (Tú)`}
        />
        <span className={styles.label}>{localUserId} (Tú)</span>
      </div>

      {(participants || []).filter(id => id !== localUserId).map((participantId) => (
        <div key={participantId} className={styles.cell}>
          <VideoPlayer
            stream={remoteStreams.get(participantId) || null}
            placeholder={getConnectionLabel(participantId)}
          />
          <span className={styles.label}>{getConnectionLabel(participantId)}</span>
        </div>
      ))}
    </div>
  );
};