import dayjs from 'dayjs/esm';

import { IOrgaEntity, NewOrgaEntity } from './orga-entity.model';

export const sampleWithRequiredData: IOrgaEntity = {
  id: 69756,
  name: "Berkshire d'Argenteuil",
};

export const sampleWithPartialData: IOrgaEntity = {
  id: 72371,
  name: 'connecting Frozen Lombards',
};

export const sampleWithFullData: IOrgaEntity = {
  id: 70247,
  name: 'CSS Sleek synthesize',
  description: 'Corse',
  createdDate: dayjs('2025-08-15T14:08'),
  updatedDate: dayjs('2025-08-16T08:19'),
};

export const sampleWithNewData: NewOrgaEntity = {
  name: 'Soft',
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
