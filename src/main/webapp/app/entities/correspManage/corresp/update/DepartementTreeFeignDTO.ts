// src/.../corresp/update/departement-tree-feign-dto.ts
import { PersonneFeignDTO } from './PersonneFeignDTO';
import { TypeAffectation } from './enums';

export interface DepartementTreeFeignDTO {
  id: number;
  code?: string | null;
  nom?: string | null;
  children?: DepartementTreeFeignDTO[] | null;
  // version stricte : Partial<Record<TypeAffectation, PersonneFeignDTO[]>>
  affectationsByType?: Partial<Record<TypeAffectation, PersonneFeignDTO[]>> | null;
}
