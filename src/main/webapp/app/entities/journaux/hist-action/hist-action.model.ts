import dayjs from 'dayjs/esm';

export interface IHistAction {
  id: number;
  dateTransaction?: dayjs.Dayjs | null;
  loginUser?: string | null;
  transaction?: string | null;
  actionRef?: string | null;
  actionJson?: string | null;
}

export type NewHistAction = Omit<IHistAction, 'id'> & { id: null };
