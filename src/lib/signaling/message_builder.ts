import { CreateOfferMessage } from '../data/signaling_data';

export default class MessageBuilder {
  static createOfferMessage: (
    users: Array<{ id: string; userId: string }>
  ) => CreateOfferMessage = (users: Array<{ id: string; userId: string }>) => {
    const message: CreateOfferMessage = {
      data: {
        users,
      },
    };
    return message;
  };
}
