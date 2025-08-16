import dayjs from 'dayjs/esm';
import { ICorresp } from 'app/entities/correspManage/corresp/corresp.model';
import { UsualStatus } from 'app/entities/enumerations/usual-status.model';

export interface IPj {
  id: number;
  name?: string | null;
  fileType?: string | null;
  path?: string | null;
  creationDate?: dayjs.Dayjs | null;
  password?: string | null;
  transferable?: boolean | null;
  uniqueName?: string | null;
  status?: UsualStatus | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  updatedDate?: dayjs.Dayjs | null;
  corresps?: Pick<ICorresp, 'id'>[] | null;
}

export type NewPj = Omit<IPj, 'id'> & { id: null };
