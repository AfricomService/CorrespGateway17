import dayjs from 'dayjs/esm';
import { IDepartement } from 'app/entities/orgacare/departement/departement.model';
import { IEmploye } from 'app/entities/employe/employe.model';

export interface IOrgaEntity {
  id: number;
  name?: string | null;
  description?: string | null;
  createdDate?: dayjs.Dayjs | null;
  updatedDate?: dayjs.Dayjs | null;
  departement?: Pick<IDepartement, 'id'> | null;
  employe?: Pick<IEmploye, 'id'> | null;
}

export type NewOrgaEntity = Omit<IOrgaEntity, 'id'> & { id: null };
