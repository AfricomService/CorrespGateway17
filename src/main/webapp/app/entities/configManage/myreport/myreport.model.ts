import dayjs from 'dayjs/esm';
import { IConfigexport } from 'app/entities/configManage/configexport/configexport.model';

export interface IMyreport {
  id: number;
  dateCreated?: dayjs.Dayjs | null;
  loginName?: string | null;
  loginId?: number | null;
  nameFile?: string | null;
  nameFolder?: string | null;
  configExportId?: number | null;
  configexport?: Pick<IConfigexport, 'id'> | null;
}

export type NewMyreport = Omit<IMyreport, 'id'> & { id: null };
