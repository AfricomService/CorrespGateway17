import dayjs from 'dayjs/esm';

export interface ICustomSearch {
  id: number;
  dateCreation?: dayjs.Dayjs | null;
  readAccess?: string | null;
  visibility?: string | null;
  request?: string | null;
  entitySearching?: string | null;
  userLogin?: string | null;
  name?: string | null;
}

export type NewCustomSearch = Omit<ICustomSearch, 'id'> & { id: null };
