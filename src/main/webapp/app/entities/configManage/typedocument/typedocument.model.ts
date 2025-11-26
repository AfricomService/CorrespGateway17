import { UsualStatus } from 'app/entities/enumerations/usual-status.model';

export interface ITypedocument {
  id: number;
  nom?: string | null;
  defautdest?: string | null;
  defaultobject?: string | null;
  defaultencopie?: string | null;
  labelDD?: string | null;
  labelDCC?: string | null;
  usualstatus?: UsualStatus | null;
}

export type NewTypedocument = Omit<ITypedocument, 'id'> & { id: null };
