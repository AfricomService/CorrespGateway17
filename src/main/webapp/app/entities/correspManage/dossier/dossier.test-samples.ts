import dayjs from 'dayjs/esm';

import { UsualStatus } from 'app/entities/enumerations/usual-status.model';

import { IDossier, NewDossier } from './dossier.model';

export const sampleWithRequiredData: IDossier = {
  id: 33437,
};

export const sampleWithPartialData: IDossier = {
  id: 68018,
  updatedDate: dayjs('2025-08-15T15:02'),
};

export const sampleWithFullData: IDossier = {
  id: 51610,
  name: 'Tunisie haptic',
  isPublic: false,
  responsible: 'card backing',
  status: UsualStatus['ACTIVE'],
  dossierList: '../fake-data/blob/hipster.png',
  dossierListContentType: 'unknown',
  createdBy: 'Maurice Bedfordshire back-end',
  updatedBy: 'Avon',
  updatedDate: dayjs('2025-08-16T06:26'),
};

export const sampleWithNewData: NewDossier = {
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
