import dayjs from 'dayjs/esm';

export interface IModelNotif {
  id: string;
  name?: string | null;
  famille?: string | null;
  code?: string | null;
  content?: string | null;
  subjectFormula?: string | null;
  senderEmailFormule?: string | null;
  recepientEmailFormule?: string | null;
  createdDate?: dayjs.Dayjs | null;
}

export type NewModelNotif = Omit<IModelNotif, 'id'> & { id: null };
