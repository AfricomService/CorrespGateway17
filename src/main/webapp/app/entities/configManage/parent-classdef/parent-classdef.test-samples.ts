import { CorrespType } from 'app/entities/enumerations/corresp-type.model';

import { IParentClassdef, NewParentClassdef } from './parent-classdef.model';

export const sampleWithRequiredData: IParentClassdef = {
  id: 26938,
};

export const sampleWithPartialData: IParentClassdef = {
  id: 47162,
};

export const sampleWithFullData: IParentClassdef = {
  id: 69975,
  type: CorrespType['OUTGOING'],
};

export const sampleWithNewData: NewParentClassdef = {
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
