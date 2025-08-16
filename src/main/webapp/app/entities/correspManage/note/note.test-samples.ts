import dayjs from 'dayjs/esm';

import { CorrespStatus } from 'app/entities/enumerations/corresp-status.model';

import { INote, NewNote } from './note.model';

export const sampleWithRequiredData: INote = {
  id: 79739,
  idinstance: '6a38f257-aea8-4a05-bfb9-6501b3ad75fa',
  subject: 'Sharable b',
  dateCreated: dayjs('2025-08-16T03:03'),
  datePublication: dayjs('2025-08-15T19:25'),
  dateEndPublication: dayjs('2025-08-15T11:56'),
  status: CorrespStatus['CLOSED'],
};

export const sampleWithPartialData: INote = {
  id: 92983,
  idinstance: 'afb4a89b-1c38-4053-be45-53035f7598cd',
  subject: 'paradigms',
  dateCreated: dayjs('2025-08-15T15:53'),
  datePublication: dayjs('2025-08-15T17:33'),
  dateEndPublication: dayjs('2025-08-15T17:17'),
  status: CorrespStatus['IN_PROGRESS'],
  createdBy: 'bypassing Saint-Jacques synthesizing',
  updatedDate: dayjs('2025-08-16T07:59'),
};

export const sampleWithFullData: INote = {
  id: 50177,
  idinstance: 'e8226fa7-0bb3-4760-834b-345d1daa3f67',
  reference: "Pompe d'Alésia",
  subject: '1080p',
  dateCreated: dayjs('2025-08-16T04:39'),
  datePublication: dayjs('2025-08-15T23:28'),
  dateEndPublication: dayjs('2025-08-16T01:34'),
  status: CorrespStatus['CANCELLED'],
  createdBy: 'Centre Monaco navigating',
  updatedBy: 'deliverables Phased Music',
  updatedDate: dayjs('2025-08-15T12:47'),
};

export const sampleWithNewData: NewNote = {
  idinstance: 'd44467b1-ce1d-47a0-8efe-e76bbe5a6efe',
  subject: 'integrate',
  dateCreated: dayjs('2025-08-16T08:48'),
  datePublication: dayjs('2025-08-15T15:06'),
  dateEndPublication: dayjs('2025-08-15T20:38'),
  status: CorrespStatus['DRAFT'],
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
