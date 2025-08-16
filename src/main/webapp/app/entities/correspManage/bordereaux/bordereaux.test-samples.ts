import dayjs from 'dayjs/esm';

import { IBordereaux, NewBordereaux } from './bordereaux.model';

export const sampleWithRequiredData: IBordereaux = {
  id: 61930,
  reference: 'transmit Gorgeous',
  amount: 31311,
  status: 'synergize',
  issuedDate: dayjs('2025-08-16T06:49'),
};

export const sampleWithPartialData: IBordereaux = {
  id: 95394,
  reference: 'Gibraltar Intelligent SMTP',
  amount: 44809,
  status: 'Chips',
  issuedDate: dayjs('2025-08-15T16:11'),
  createdDate: dayjs('2025-08-16T09:25'),
  createdBy: 'index Small index',
};

export const sampleWithFullData: IBordereaux = {
  id: 34477,
  reference: 'Chair c',
  description: 'revolutionize',
  amount: 55872,
  currency: 'Auvergne hub',
  status: 'Ball',
  issuedDate: dayjs('2025-08-16T01:21'),
  dueDate: dayjs('2025-08-15T15:29'),
  createdDate: dayjs('2025-08-16T07:30'),
  updatedDate: dayjs('2025-08-15T20:34'),
  createdBy: 'Alsace driver Account',
  updatedBy: 'payment hack',
};

export const sampleWithNewData: NewBordereaux = {
  reference: 'c quantify',
  amount: 87930,
  status: 'Charlemagne Credit',
  issuedDate: dayjs('2025-08-15T17:00'),
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
