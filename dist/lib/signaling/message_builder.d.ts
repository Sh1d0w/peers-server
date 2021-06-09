import { CreateOfferMessage } from '../data/signaling_data';
export default class MessageBuilder {
    static createOfferMessage: (users: Array<{
        id: string;
        userId: string;
    }>) => CreateOfferMessage;
}
