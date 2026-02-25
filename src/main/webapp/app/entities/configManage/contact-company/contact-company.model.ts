// src/main/webapp/app/entities/configManage/contact-company/contact-company.model.ts
import { UsualStatus } from 'app/entities/enumerations/usual-status.model';
import { IPersonCompany } from 'app/entities/configManage/person-company/person-company.model';

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

// Type composite : ContactCompany + ses personnes (DTO de lecture)
export interface IContactCompanyWithPersons extends IContactCompany {
  personCompanies?: IPersonCompany[] | null;
}
export type NewContactCompanyWithPersons = Omit<IContactCompanyWithPersons, 'id'> & { id: null };
