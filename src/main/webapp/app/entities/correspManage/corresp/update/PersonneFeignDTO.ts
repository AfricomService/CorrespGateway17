// src/main/webapp/app/entities/correspManage/corresp/update/personne-feign-dto.ts
import { Etat } from './enums'; // <-- assure-toi que le chemin relatif est correct

export interface PersonneFeignDTO {
  id?: number | null;
  matricule?: string | null;
  nomPrenom?: string | null;
  email?: string | null;
  numTelephone?: string | null;
  genre?: string | null;
  cin?: string | null;
  etat?: Etat | null; // maintenant importé
  etatContractuelle?: string | null;
  dateCreation?: string | null;
  dateDebutContrat?: string | null;
  idContratActif?: number | null;
  idTypeContratActif?: number | null;
  affectationId?: number | null;
  gradeId?: number | null;
  fonctionId?: number | null;
  role?: string | null;
}
