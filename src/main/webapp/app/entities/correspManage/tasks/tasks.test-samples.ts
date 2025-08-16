import dayjs from 'dayjs/esm';

import { CorrespStatus } from 'app/entities/enumerations/corresp-status.model';

import { ITasks, NewTasks } from './tasks.model';

export const sampleWithRequiredData: ITasks = {
  id: 61381,
  object: 'calculate Awesome experiences',
};

export const sampleWithPartialData: ITasks = {
  id: 4549,
  object: 'Switchable Developpeur deposit',
  dueDate: dayjs('2025-08-15T15:14'),
  closeDate: dayjs('2025-08-16T07:11'),
  status: CorrespStatus['CLOSED'],
  createdBy: 'Ouguiya a',
  updatedBy: 'intranet',
  updatedDate: dayjs('2025-08-16T01:29'),
};

export const sampleWithFullData: ITasks = {
  id: 19113,
  object: 'program extensible',
  content: '../fake-data/blob/hipster.png',
  contentContentType: 'unknown',
  creationDate: dayjs('2025-08-15T11:17'),
  startDate: dayjs('2025-08-15T23:42'),
  dueDate: dayjs('2025-08-15T13:32'),
  closeDate: dayjs('2025-08-16T03:07'),
  responsible: 'Ball withdrawal world-class',
  status: CorrespStatus['CANCELLED'],
  createdBy: 'non-volatile',
  updatedBy: 'plug-and-play silver Analyste',
  updatedDate: dayjs('2025-08-15T13:27'),
};

export const sampleWithNewData: NewTasks = {
  object: 'communities feed',
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
