import { UsualStatus } from 'app/entities/enumerations/usual-status.model';

export interface IContactCompany {
  id: number;
  nom?: string | null;
  nomabrege?: string | null;
  matrne?: string | null;
  pays?: string | null;
  adresse?: string | null;
  tel?: string | null;
  fax?: string | null;
  email?: string | null;
  webpage?: string | null;
  etat?: UsualStatus | null;
}

export type NewContactCompany = Omit<IContactCompany, 'id'> & { id: null };
