import dayjs from 'dayjs/esm';

export interface IConfigexport {
  id: number;
  label?: string | null;
  active?: boolean | null;
  excelFile?: string | null;
  excelFileContentType?: string | null;
  dateCreated?: dayjs.Dayjs | null;
  configMappingJson?: string | null;
  readAccess?: string | null;
}

export type NewConfigexport = Omit<IConfigexport, 'id'> & { id: null };
