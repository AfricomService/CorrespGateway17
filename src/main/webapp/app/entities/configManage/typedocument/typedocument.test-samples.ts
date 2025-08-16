import { UsualStatus } from 'app/entities/enumerations/usual-status.model';

import { ITypedocument, NewTypedocument } from './typedocument.model';

export const sampleWithRequiredData: ITypedocument = {
  id: 76361,
};

export const sampleWithPartialData: ITypedocument = {
  id: 3115,
  nom: 'silver Clothing',
  defautdest: 'Salad neural',
};

export const sampleWithFullData: ITypedocument = {
  id: 61618,
  nom: 'Centre program',
  defautdest: 'brand generating',
  defaultobject: 'Yémen Bourgogne',
  defaultencopie: 'Fish superstructure',
  usualstatus: UsualStatus['DELETED'],
};

export const sampleWithNewData: NewTypedocument = {
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
