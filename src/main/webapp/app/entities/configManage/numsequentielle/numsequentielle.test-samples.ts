import { INumsequentielle, NewNumsequentielle } from './numsequentielle.model';

export const sampleWithRequiredData: INumsequentielle = {
  id: '169fd702-c227-4bd0-a116-228197169662',
  nextNumber: 94724,
};

export const sampleWithPartialData: INumsequentielle = {
  id: 'ca2571ba-694f-466c-b03a-4442d4ff27f5',
  nextNumber: 76023,
  format: 'Frozen harness digital',
};

export const sampleWithFullData: INumsequentielle = {
  id: '31050dd3-033b-4d55-92af-08624399cc3a',
  prefix: 'Mouse synthesize',
  nextNumber: 62724,
  format: 'payment Intelligent bandwidth',
};

export const sampleWithNewData: NewNumsequentielle = {
  nextNumber: 53675,
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
