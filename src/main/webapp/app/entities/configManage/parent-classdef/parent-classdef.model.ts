import { INumsequentielle } from 'app/entities/configManage/numsequentielle/numsequentielle.model';
import { CorrespType } from 'app/entities/enumerations/corresp-type.model';

export interface IParentClassdef {
  id: number;
  type?: CorrespType | null;
  formule?: string | null;
  sequenceId?: Pick<INumsequentielle, 'id'> | null;
}

export type NewParentClassdef = Omit<IParentClassdef, 'id'> & { id: null };
