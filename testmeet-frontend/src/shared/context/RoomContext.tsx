import { createContext, useContext, useState, ReactNode } from 'react';

interface PendingRequest {
  id: string;
  userId: string;
  userName: string;
}

interface Room {
  id: string;
  name: string;
  inviteLink: string;
  ownerId: string;
}

interface RoomContextType {
  room: Room | null;
  setRoom: (room: Room | null) => void;
  isOwner: boolean;
  setIsOwner: (value: boolean) => void;
  pendingRequests: PendingRequest[];
  setPendingRequests: React.Dispatch<React.SetStateAction<PendingRequest[]>>;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

export function RoomProvider({ children }: { children: ReactNode }) {
  const [room, setRoom] = useState<Room | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);

  return (
    <RoomContext.Provider value={{ room, setRoom, isOwner, setIsOwner, pendingRequests, setPendingRequests }}>
      {children}
    </RoomContext.Provider>
  );
}

export function useRoom() {
  const context = useContext(RoomContext);
  if (!context) throw new Error('useRoom must be used within RoomProvider');
  return context;
}