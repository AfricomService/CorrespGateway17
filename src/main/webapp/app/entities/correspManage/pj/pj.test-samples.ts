import dayjs from 'dayjs/esm';

import { UsualStatus } from 'app/entities/enumerations/usual-status.model';

import { IPj, NewPj } from './pj.model';

export const sampleWithRequiredData: IPj = {
  id: 86597,
};

export const sampleWithPartialData: IPj = {
  id: 87104,
  name: 'Loan Assistant parsing',
  fileType: 'transmitting human-resource',
  creationDate: dayjs('2025-08-16T08:06'),
  uniqueName: 'Upgradable b superstructure',
  status: UsualStatus['ACTIVE'],
  updatedBy: 'Account metrics',
  updatedDate: dayjs('2025-08-15T18:50'),
};

export const sampleWithFullData: IPj = {
  id: 5927,
  name: 'Bike Sleek',
  fileType: 'Account Rubber Stagiaire',
  path: 'Bahraini withdrawal',
  creationDate: dayjs('2025-08-15T18:54'),
  password: 'Vaneau payment productivity',
  transferable: false,
  uniqueName: 'Steel',
  status: UsualStatus['DELETED'],
  createdBy: 'Games 24/365 input',
  updatedBy: 'Personal',
  updatedDate: dayjs('2025-08-15T19:02'),
};

export const sampleWithNewData: NewPj = {
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
