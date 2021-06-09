interface CreateOfferMessage {
  data: {
    users: Array<{ id: string; userId: string }>;
  };
}

interface Transaction {
  origin: string;
  destination: string;
}

interface SignalingMessage {
  data: {
    id: Transaction;
    userId: string;
    sdp: string;
  };
}

interface CandidateMessage {
  data: {
    id: Transaction;
    userId: string;
    candidate: string;
  };
}

interface UserInfoMessage {
  data: {
    userId: string;
  };
}

interface RoomInfoMessage {
  data: {
    roomId: string;
    userId: string;
  };
}

interface MediaStatusMessage {
  data: {
    id: string;
    userId: string | null;
    isAudioMute: boolean;
    isVideoMute: boolean;
  };
}

interface RemoteDisconnectedMessage {
  data: {
    id: string;
  };
}

export {
  CreateOfferMessage,
  SignalingMessage,
  CandidateMessage,
  RoomInfoMessage,
  MediaStatusMessage,
  RemoteDisconnectedMessage,
  UserInfoMessage,
};
