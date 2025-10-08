import dayjs from 'dayjs/esm';

import { ICustomSearch, NewCustomSearch } from './custom-search.model';

export const sampleWithRequiredData: ICustomSearch = {
  id: 72438,
};

export const sampleWithPartialData: ICustomSearch = {
  id: 8812,
  dateCreation: dayjs('2025-09-30T07:45'),
  readAccess: 'a generate',
  request: 'reinvent synergies calculating',
  entitySearching: 'invoice',
};

export const sampleWithFullData: ICustomSearch = {
  id: 65369,
  dateCreation: dayjs('2025-09-30T09:42'),
  readAccess: 'c payment',
  visibility: 'Consultant',
  request: 'Investment',
  entitySearching: 'Fantastic connecting',
  userLogin: 'SSL',
  name: 'compress communities',
};

export const sampleWithNewData: NewCustomSearch = {
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
