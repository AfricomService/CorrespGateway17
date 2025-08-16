import dayjs from 'dayjs/esm';

import { ICompany, NewCompany } from './company.model';

export const sampleWithRequiredData: ICompany = {
  id: 32440,
  name: 'Danemark Provence-Alpes-Côte',
};

export const sampleWithPartialData: ICompany = {
  id: 1226,
  name: 'Granite',
  registrationNumber: 'Tenge Intelligent',
  email: 'Alphe17@gmail.com',
  createdDate: dayjs('2025-08-16T06:12'),
};

export const sampleWithFullData: ICompany = {
  id: 27933,
  name: 'Chips Dauphine',
  registrationNumber: 'Granite panel',
  address: 'Tasty sexy JSON',
  email: 'Gdon_Boyer@yahoo.fr',
  phoneNumber: 'Grocery a aggregate',
  website: 'back-end Poitou-Charentes models',
  foundedDate: dayjs('2025-08-16T07:43'),
  createdDate: dayjs('2025-08-16T01:50'),
  updatedDate: dayjs('2025-08-16T07:13'),
};

export const sampleWithNewData: NewCompany = {
  name: 'Cambridgeshire Saint-Bernard',
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
