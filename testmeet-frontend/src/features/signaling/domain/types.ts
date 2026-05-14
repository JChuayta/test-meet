export interface User {
  id: string;
  name: string;
  isOnline: boolean;
}

export interface Call {
  id: string;
  callerId: string;
  calleeId: string;
  offerSdp: string;
  answerSdp: string | null;
}

export interface SignalingEvents {
  'call:initiate': (data: { calleeId: string; offerSdp: string }) => void;
  'call:answer': (data: { callId: string; answerSdp: string }) => void;
  'ice:candidate': (data: { callId: string; candidate: string }) => void;
}

export interface CallStatus {
  status: 'idle' | 'calling' | 'answered' | 'connected';
}