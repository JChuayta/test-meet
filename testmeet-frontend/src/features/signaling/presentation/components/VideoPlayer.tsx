import { useRef, useEffect } from 'react';
import styles from './VideoPlayer.module.css';

interface VideoPlayerProps {
  stream: MediaStream | null;
  isLocal?: boolean;
  muted?: boolean;
  placeholder?: string;
}

export const VideoPlayer = ({
  stream,
  isLocal = false,
  muted = false,
  placeholder = 'Waiting for video...'
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className={`${styles.videoPlayer} ${isLocal ? styles.local : styles.remote}`}>
      {stream ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={muted}
            className={styles.video}
          />
          {muted && <span className={styles.muted}>Muted</span>}
        </>
      ) : (
        <div className={styles.placeholder}>
          <span className={styles.placeholderIcon}>🎥</span>
          <span>{placeholder}</span>
        </div>
      )}
    </div>
  );
};