import dayjs from 'dayjs/esm';

export interface IMessage {
  id: number;
  content?: string | null;
  timestamp?: dayjs.Dayjs | null;
}

export type NewMessage = Omit<IMessage, 'id'> & { id: null };
