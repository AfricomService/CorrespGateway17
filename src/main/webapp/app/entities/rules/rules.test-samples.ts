import { IRules, NewRules } from './rules.model';

export const sampleWithRequiredData: IRules = {
  id: 20781,
};

export const sampleWithPartialData: IRules = {
  id: 37569,
  name: 'Franche-Comté Profound Wooden',
  file: '../fake-data/blob/hipster.png',
  fileContentType: 'unknown',
};

export const sampleWithFullData: IRules = {
  id: 36615,
  name: 'evolve',
  code: 'parsing',
  isActif: false,
  file: '../fake-data/blob/hipster.png',
  fileContentType: 'unknown',
};

export const sampleWithNewData: NewRules = {
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
