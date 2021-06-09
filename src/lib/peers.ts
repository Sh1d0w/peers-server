import * as Http from 'http';
import * as SocketIo from 'socket.io';
import * as Uuid from 'uuid';
import MessageBuilder from './signaling/message_builder';
import {
  SignalingMessage,
  CandidateMessage,
  RoomInfoMessage,
  UserInfoMessage,
  MediaStatusMessage,
  RemoteDisconnectedMessage,
} from './data/signaling_data';
import Room from './signaling/room';
import LogLevel from './logger/logLevel';
import Logger from './logger/logger';

export default class Peers {
  private socketIo: SocketIo.Server;

  private rooms: Room[] = [];

  constructor(server: Http.Server) {
    this.socketIo = SocketIo.default(server);
    this.socketIo.origins('*:*');
  }

  start = () => this.setupEvents();

  setLogLevel = (level: LogLevel) => Logger.setup(level);

  private setupEvents = () => {
    this.socketIo.on('connection', (socket) => {
      // Recieves
      // handle join room
      socket.on('createRoom', (m: UserInfoMessage, callback) => {
        const uuid = Uuid.v4();
        const room = new Room(uuid);
        room.join(socket, m.data.userId);
        this.rooms.push(room);
        const message: RoomInfoMessage = {
          data: {
            roomId: uuid,
            userId: m.data.userId,
          },
        };

        socket.join(uuid);
        callback(message);
      });

      socket.on('joinRoom', (message: RoomInfoMessage, callback) => {
        const logTag = 'join room';
        Logger.logger(logTag).debug(message);
        socket.join(message.data.roomId);
        const room = this.rooms.find((r) => r.id === message.data.roomId);

        if (room !== undefined) {
          Logger.logger(logTag).info('room found, join to:', room.id);

          room.join(socket, message.data.userId);
          const callbackMessage: RoomInfoMessage = {
            data: {
              roomId: room.id,
              userId: message.data.userId,
            },
          };
          callback(callbackMessage);
        } else {
          Logger.logger(logTag).info('room not found, create...');
          const newRoom = new Room(message.data.roomId);
          Logger.logger(logTag).info(
            'room created, room id:',
            message.data.roomId
          );
          newRoom.join(socket, message.data.userId);
          this.rooms.push(newRoom);
          const roomCreatedMessage: RoomInfoMessage = {
            data: {
              roomId: message.data.roomId,
              userId: message.data.userId,
            },
          };

          socket.join(message.data.roomId);
          callback(roomCreatedMessage);
        }
      });

      // handle call to others
      socket.on('callToOthers', (message: RoomInfoMessage) => {
        const logTag = 'call to others';
        const room = this.rooms.find((x) => x.id === message.data.roomId);
        if (room === undefined) {
          Logger.logger(logTag).info('room not found skip... from', socket.id);
          return;
        }
        const others = room.Sockets().filter((x) => x.id !== socket.id);
        socket.emit(
          'call',
          MessageBuilder.createOfferMessage(others.map((x) => x.id))
        );
        room.notifyMediaStatusTo(socket.id);
      });

      // handle offer
      socket.on('offer', (message: SignalingMessage) => {
        const logTag = 'offer';
        socket.broadcast
          .to(message.data.id.destination)
          .emit('remote-offer', message);

        const room = this.rooms.find((r) =>
          r.Participants().find((p) => p.Id() === socket.id)
        );
        if (room === undefined) {
          Logger.logger(logTag).info(
            'room not found, skipping to notify mediastatus, message from:',
            socket.id
          );
          return;
        }

        room.notifyMediaStatusToAll(socket.id);
      });

      // handle answer
      socket.on('answer', (message: SignalingMessage) => {
        socket.broadcast
          .to(message.data.id.destination)
          .emit('remote-answer', message);
      });

      // handle candidate
      socket.on('candidate', (message: CandidateMessage) => {
        socket.broadcast
          .to(message.data.id.destination)
          .emit('remote-candidate', message);
      });

      // handle media status
      socket.on('mediaUpdated', (message: MediaStatusMessage) => {
        const logTag = 'media updated';
        const room = this.rooms.find((r) =>
          r.Participants().find((p) => p.Id() === socket.id)
        );
        if (room === undefined) {
          Logger.logger(logTag).info(
            'room not found, skipping... from:',
            socket.id
          );
          return;
        }
        room.updateMediaStatus(message);
      });

      socket.on('disconnect', () => {
        const logTag = 'dissconnect';
        const room = this.rooms.find((x) =>
          x
            .Sockets()
            .map((s) => s.id)
            .includes(socket.id)
        );
        if (room === undefined) {
          Logger.logger(logTag).info('room not found, skip');
          return;
        }

        socket.leave(room.id);
        if (room.Sockets().length === 1) {
          this.rooms = this.rooms.filter((r) => r !== room);
        } else {
          room.leave(socket);
          const remoteDisconnectedMesage: RemoteDisconnectedMessage = {
            data: {
              id: socket.id,
            },
          };
          this.socketIo
            .in(room.id)
            .emit('remote-disconnected', remoteDisconnectedMesage);
        }
      });
    });
  };
}
