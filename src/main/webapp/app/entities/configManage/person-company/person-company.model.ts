import { UsualStatus } from 'app/entities/enumerations/usual-status.model';

export interface IPersonCompany {
  id: number;
  nom?: string | null;
  pays?: string | null;
  adresse?: string | null;
  tel?: string | null;
  fax?: string | null;
  email?: string | null;
  whatsapp?: string | null;
  etat?: UsualStatus | null;
  contactCompanyId?: number | null;
}

export type NewPersonCompany = Omit<IPersonCompany, 'id'> & { id: null };
