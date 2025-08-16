import { UsualStatus } from 'app/entities/enumerations/usual-status.model';

import { IContactCompany, NewContactCompany } from './contact-company.model';

export const sampleWithRequiredData: IContactCompany = {
  id: 9218,
  nom: 'Account',
};

export const sampleWithPartialData: IContactCompany = {
  id: 89837,
  nom: 'repurpose Home',
  nomabrege: 'payment',
  fax: 'Dinar turquoise',
  email: 'Fortune_Martin@gmail.com',
  webpage: 'web-enabled web',
  etat: UsualStatus['ACTIVE'],
};

export const sampleWithFullData: IContactCompany = {
  id: 80441,
  nom: 'regional Enterprise-wide',
  nomabrege: 'time-frame',
  matrne: 'a Bedfordshire',
  pays: 'Languedoc-Roussillon b',
  adresse: 'withdrawal',
  tel: 'sensor',
  fax: 'Administrateur',
  email: 'Thophraste.Renaud17@yahoo.fr',
  webpage: 'Executif',
  etat: UsualStatus['DISABLED'],
};

export const sampleWithNewData: NewContactCompany = {
  nom: 'function Assistant Buckinghamshire',
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
