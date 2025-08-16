import dayjs from 'dayjs/esm';
import { ICorresp } from 'app/entities/correspManage/corresp/corresp.model';

export interface IBordereaux {
  id: number;
  reference?: string | null;
  description?: string | null;
  amount?: number | null;
  currency?: string | null;
  status?: string | null;
  issuedDate?: dayjs.Dayjs | null;
  dueDate?: dayjs.Dayjs | null;
  createdDate?: dayjs.Dayjs | null;
  updatedDate?: dayjs.Dayjs | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  corresps?: Pick<ICorresp, 'id'>[] | null;
}

export type NewBordereaux = Omit<IBordereaux, 'id'> & { id: null };
