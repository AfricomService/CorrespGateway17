import dayjs from 'dayjs/esm';
import { ICorresp } from 'app/entities/correspManage/corresp/corresp.model';
import { CorrespStatus } from 'app/entities/enumerations/corresp-status.model';

export interface ITasks {
  id: number;
  object?: string | null;
  content?: string | null;
  contentContentType?: string | null;
  creationDate?: dayjs.Dayjs | null;
  startDate?: dayjs.Dayjs | null;
  dueDate?: dayjs.Dayjs | null;
  closeDate?: dayjs.Dayjs | null;
  responsible?: string | null;
  status?: CorrespStatus | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  taskType?: string | null;
  responsableName?: string | null;
  commentaire?: string | null;
  updatedDate?: dayjs.Dayjs | null;
  corresps?: Pick<ICorresp, 'id'>[] | null;
  responsables?: ResponsableSelection[] | null;
  canModify?: boolean;
  commentaireTraitement?: string | null;
  datePriseEnCharge?: dayjs.Dayjs | null;
}

export type NewTasks = Omit<ITasks, 'id'> & { id: null };

export interface ResponsableSelection {
  id?: number | null;
  tacheId?: number | null;
  codeDept?: string | null;
  matriculePers?: string | null;
  deptName?: string | null;
  personneName?: string | null;
}
