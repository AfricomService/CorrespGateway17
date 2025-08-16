import dayjs from 'dayjs/esm';
import { IPj } from 'app/entities/correspManage/pj/pj.model';
import { CorrespStatus } from 'app/entities/enumerations/corresp-status.model';

export interface INote {
  id: number;
  idinstance?: string | null;
  reference?: string | null;
  subject?: string | null;
  dateCreated?: dayjs.Dayjs | null;
  datePublication?: dayjs.Dayjs | null;
  dateEndPublication?: dayjs.Dayjs | null;
  status?: CorrespStatus | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  updatedDate?: dayjs.Dayjs | null;
  attachment?: Pick<IPj, 'id'> | null;
}

export type NewNote = Omit<INote, 'id'> & { id: null };
