import dayjs from 'dayjs/esm';

import { IDepartement, NewDepartement } from './departement.model';

export const sampleWithRequiredData: IDepartement = {
  id: 86141,
  code: 'Bedfordshire Chips Balboa',
  name: 'c Inde Jewelery',
};

export const sampleWithPartialData: IDepartement = {
  id: 98636,
  code: 'optical e-commerce du',
  name: 'Bahamian',
  description: 'b online Mauritanie',
  createdDate: dayjs('2025-08-16T08:09'),
};

export const sampleWithFullData: IDepartement = {
  id: 62302,
  code: 'Auto de turn-key',
  name: 'Midi-Pyrénées',
  description: 'Account',
  createdDate: dayjs('2025-08-15T12:45'),
  updatedDate: dayjs('2025-08-16T02:43'),
};

export const sampleWithNewData: NewDepartement = {
  code: 'driver Avon',
  name: 'Poitou-Charentes',
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
