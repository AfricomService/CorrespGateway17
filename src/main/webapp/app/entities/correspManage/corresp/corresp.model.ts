import dayjs from 'dayjs/esm';
import { IDossier } from 'app/entities/correspManage/dossier/dossier.model';
import { IBordereaux } from 'app/entities/correspManage/bordereaux/bordereaux.model';
import { IPj } from 'app/entities/correspManage/pj/pj.model';
import { ITasks } from 'app/entities/correspManage/tasks/tasks.model';
import { CorrespStatus } from 'app/entities/enumerations/corresp-status.model';
import { CorrespType } from 'app/entities/enumerations/corresp-type.model';
import { DispatchType } from 'app/entities/enumerations/dispatch-type.model';

export interface IContactCopieCorresp {
  id?: number | null;
  idCorrsp?: number | null;
  idDept?: number | null;
  codeDept?: string | null;
  nomDept?: string | null;
  emailDept?: string | null;
}

export interface ICorresp {
  id: number;
  idinstance?: string | null;
  typeDocumentId?: string | null;
  reference?: string | null;
  subject?: string | null;
  dateCreated?: dayjs.Dayjs | null;
  courrierDate?: dayjs.Dayjs | null;
  status?: CorrespStatus | null;
  priority?: boolean | null;
  body?: string | null;
  corresptype?: CorrespType | null;
  sender?: string | null;
  needsResponse?: boolean | null;
  responseTo?: string | null;
  step?: string | null;
  stepCode?: string | null;
  processId?: number | null;
  processVersion?: string | null;
  contact?: string | null;
  senderReference?: string | null;
  dispatchType?: DispatchType | null;
  contactCompany?: string | null;
  personCompany?: string | null;
  contactAddress?: string | null;
  contactEmail?: string | null;
  contactEmailCc?: string | null;
  contactCopies?: IContactCopieCorresp[] | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  labelDestinataire?: string | null;
  labelContactCC?: string | null;
  updatedDate?: dayjs.Dayjs | null;
  dossiers?: Pick<IDossier, 'id'>[] | null;
  bordereaux?: Pick<IBordereaux, 'id'>[] | null;
  attachments?: Pick<IPj, 'id'>[] | null;
  tasks?: Pick<ITasks, 'id'>[] | null;
  modelNotifId?: string | null;
  //msgReceiver?: string | null;  // transient, pour passer au backend
  //msgCopyTo?: string | null;    // transient
}

export type NewCorresp = Omit<ICorresp, 'id'> & { id: null };
