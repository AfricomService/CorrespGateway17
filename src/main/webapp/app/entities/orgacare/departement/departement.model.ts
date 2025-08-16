import dayjs from 'dayjs/esm';

export interface IDepartement {
  id: number;
  code?: string | null;
  name?: string | null;
  description?: string | null;
  createdDate?: dayjs.Dayjs | null;
  updatedDate?: dayjs.Dayjs | null;
}

export type NewDepartement = Omit<IDepartement, 'id'> & { id: null };
