import dayjs from 'dayjs/esm';
import { NotificationStatus } from 'app/entities/enumerations/notification-status.model';

export interface INotif {
  id: string;
  title?: string | null;
  body?: string | null;
  recipientEmail?: string | null;
  recipeientccemail?: string | null;
  receipientbccemail?: string | null;
  senderEmail?: string | null;
  sentDate?: dayjs.Dayjs | null;
  status?: NotificationStatus | null;
  typeNotif?: string | null;
  messageID?: number | null;
}

export type NewNotif = Omit<INotif, 'id'> & { id: null };
