import * as SocketIo from 'socket.io';
import { MediaStatusMessage } from '#/lib/data/signaling_data';

export default class Participant {
  private id: string;

  private socket: SocketIo.Socket;

  private isAudioMute = false;

  private isVideoMute = false;

  private userId: string;

  public Socket = () => this.socket;

  public IsAudioMute = () => this.isAudioMute;

  public IsVideoMute = () => this.isVideoMute;

  public Id = () => this.id;

  public UserId = () => this.userId;

  public MediaStatus = () => {
    const message: MediaStatusMessage = {
      data: {
        id: this.id,
        userId: this.userId,
        isAudioMute: this.isAudioMute,
        isVideoMute: this.isVideoMute,
      },
    };
    return message;
  };

  constructor(id: string, socket: SocketIo.Socket, userId: string) {
    this.id = id;
    this.socket = socket;
    this.userId = userId;
  }

  public UpdateMediaStatus = (isAudioMute: boolean, isVideoMute: boolean) => {
    this.isAudioMute = isAudioMute;
    this.isVideoMute = isVideoMute;
  };
}
