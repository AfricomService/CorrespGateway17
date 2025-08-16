import dayjs from 'dayjs/esm';
import { ICorresp } from 'app/entities/correspManage/corresp/corresp.model';
import { UsualStatus } from 'app/entities/enumerations/usual-status.model';

export interface IDossier {
  id: number;
  name?: string | null;
  isPublic?: boolean | null;
  responsible?: string | null;
  status?: UsualStatus | null;
  dossierList?: string | null;
  dossierListContentType?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  updatedDate?: dayjs.Dayjs | null;
  corresps?: Pick<ICorresp, 'id'>[] | null;
}

export type NewDossier = Omit<IDossier, 'id'> & { id: null };
