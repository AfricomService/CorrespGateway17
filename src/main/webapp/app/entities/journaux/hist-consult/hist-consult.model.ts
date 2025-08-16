import dayjs from 'dayjs/esm';

export interface IHistConsult {
  id: number;
  labelAction?: string | null;
  user?: string | null;
  dateTransaction?: dayjs.Dayjs | null;
  categorie?: string | null;
  navigateur?: string | null;
  ip?: string | null;
  terminal?: string | null;
}

export type NewHistConsult = Omit<IHistConsult, 'id'> & { id: null };
