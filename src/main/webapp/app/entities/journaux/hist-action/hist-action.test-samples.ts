import dayjs from 'dayjs/esm';

import { IHistAction, NewHistAction } from './hist-action.model';

export const sampleWithRequiredData: IHistAction = {
  id: 77569,
};

export const sampleWithPartialData: IHistAction = {
  id: 91815,
  loginUser: 'Tasty',
  transaction: 'Shirt Bedfordshire Gorgeous',
  actionJson: 'Savings',
};

export const sampleWithFullData: IHistAction = {
  id: 55789,
  dateTransaction: dayjs('2025-08-16T01:02'),
  loginUser: 'feed Limousin',
  transaction: 'Rupee synthesize c',
  actionRef: 'a Vaneau',
  actionJson: 'models',
};

export const sampleWithNewData: NewHistAction = {
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
