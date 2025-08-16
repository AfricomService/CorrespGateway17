import { UsualStatus } from 'app/entities/enumerations/usual-status.model';

import { IPersonCompany, NewPersonCompany } from './person-company.model';

export const sampleWithRequiredData: IPersonCompany = {
  id: 84612,
  nom: 'capability withdrawal budgetary',
};

export const sampleWithPartialData: IPersonCompany = {
  id: 40354,
  nom: 'Frozen interfaces Rhône-Alpes',
  pays: 'schemas interface Realigned',
  tel: 'deposit Norwegian Sleek',
  email: 'Abel_Jean44@hotmail.fr',
  whatsapp: 'a card',
  etat: UsualStatus['DISABLED'],
};

export const sampleWithFullData: IPersonCompany = {
  id: 15222,
  nom: 'Frozen Cambridgeshire Kwacha',
  pays: 'Account',
  adresse: 'bypassing Handmade matrix',
  tel: 'Account',
  fax: 'parsing',
  email: 'Josphine.Gerard45@gmail.com',
  whatsapp: 'Shoes morph',
  etat: UsualStatus['DISABLED'],
};

export const sampleWithNewData: NewPersonCompany = {
  nom: 'deposit Bosnie-Herzégovine',
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
