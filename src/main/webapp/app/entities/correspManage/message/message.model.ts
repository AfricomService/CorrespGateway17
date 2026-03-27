import dayjs from 'dayjs/esm';

export interface IMessage {
  id: number;
  sender?: string | null;
  receiver?: any | null;
  copyTo?: any | null;
  blindCopyTo?: any | null;
  path?: string | null;
  msgID?: string | null;
  parentID?: string | null;
  inReplyTo?: string | null;
  type?: string | null;
  etat?: string | null;
  correspId?: number | null;
  fileId?: number | null;
  uniqueName?: string | null;
  createdBy?: string | null;
  creationDate?: dayjs.Dayjs | null;
  updatedBy?: string | null;
  updatedDate?: dayjs.Dayjs | null;
}

export type NewMessage = Omit<IMessage, 'id'> & { id: null };
