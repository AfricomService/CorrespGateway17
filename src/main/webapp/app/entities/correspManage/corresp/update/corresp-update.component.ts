import { Component, OnInit } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { CorrespFormService, CorrespFormGroup } from './corresp-form.service';
import { ICorresp, IContactCopieCorresp } from '../corresp.model';
import { CorrespService, CorrespReferenceItem, PagedReferenceResponse } from '../service/corresp.service';
import { AlertError } from 'app/shared/alert/alert-error.model';
import { EventManager, EventWithContent } from 'app/core/util/event-manager.service';
import { DataUtils, FileLoadError } from 'app/core/util/data-util.service';
import { IDossier } from 'app/entities/correspManage/dossier/dossier.model';
import { DossierService } from 'app/entities/correspManage/dossier/service/dossier.service';
import { IBordereaux } from 'app/entities/correspManage/bordereaux/bordereaux.model';
import { BordereauxService } from 'app/entities/correspManage/bordereaux/service/bordereaux.service';
import { IPj } from 'app/entities/correspManage/pj/pj.model';
import { PjService } from 'app/entities/correspManage/pj/service/pj.service';
import { ITasks } from 'app/entities/correspManage/tasks/tasks.model';
import { TasksService } from 'app/entities/correspManage/tasks/service/tasks.service';
import { CorrespStatus } from 'app/entities/enumerations/corresp-status.model';
import { CorrespType } from 'app/entities/enumerations/corresp-type.model';
import { DispatchType } from 'app/entities/enumerations/dispatch-type.model';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UserService } from '../../../user/user.service';
import { IUser } from '../../../../admin/user-management/user-management.model';
import { SocieteItem } from '../service/corresp.service';

import dayjs from 'dayjs/esm';
import { ITypedocument } from '../../../configManage/typedocument/typedocument.model';
import { TypedocumentService } from '../../../configManage/typedocument/service/typedocument.service';
import { IDepartement } from '../../../orgacare/departement/departement.model';

import { ContactCompanyService } from 'app/entities/configManage/contact-company/service/contact-company.service';
import { IContactCompany } from 'app/entities/configManage/contact-company/contact-company.model';
import { IPersonCompany } from 'app/entities/configManage/person-company/person-company.model';
import { ParentClassdefService } from 'app/entities/configManage/parent-classdef/service/parent-classdef.service';

// <-- NEW: import du DTO de l'arbre (vérifie le chemin si besoin)
import { DepartementTreeFeignDTO } from './DepartementTreeFeignDTO';
import { PersonneFeignDTO } from './PersonneFeignDTO';
import { TypeAffectation } from 'app/entities/correspManage/corresp/update/enums';

import { AccountService } from 'app/core/auth/account.service';
import { Account } from 'app/core/auth/account.model';
import { Authority } from 'app/config/authority.constants';
import {
  PjCareService,
  PjCareScanResult,
  PjCareDriverInfo,
  ScanDriver,
  ScannedPage,
  MergePagesRequest,
} from 'app/entities/correspManage/pj/service/pjcare.service';
import { ScanSettingsService } from 'app/entities/correspManage/pj/service/scan-settings.service';

// --------------------------------------------------------------------------
// Small helper interfaces
// --------------------------------------------------------------------------
interface FileIndexLink {
  index: number;
  uniqueName: string;
}

// --------------------------------------------------------------------------
// Component
// --------------------------------------------------------------------------
@Component({
  selector: 'jhi-corresp-update',
  templateUrl: './corresp-update.component.html',
  styleUrls: ['corresp-update.scss'],
})
export class CorrespUpdateComponent implements OnInit {
  // === existing state (kept mostly intact) ===
  isSaving = false;
  corresp!: ICorresp;

  /** true si l'utilisateur courant a le rôle ADMIN et/ou BOC */
  isAdminOrBoc = false;

  /** Référence générée par le bouton "Identifier" — sera utilisée lors de l'enregistrement */
  generatedReference: string | null = null;
  isGeneratingReference = false;

  tasksToSave: ITasks[] = [];
  pjsToSave: IPj[] = [];
  notificationMessage: string | null = null;
  notificationType: 'success' | 'error' | null = null;

  fileLinks: FileIndexLink[] = [];
  uploadProgress: Map<string, number> = new Map();
  isUploading = false;

  htmlContent: string = '';

  taskObject = '';
  responsable = '';
  dateDebut = '';
  dateFin = '';
  dateLimite = '';
  selectedType = '';
  objet = '';
  expediteur = '';
  date = '';
  courrier = '';
  reponseSur = '';
  etape = '';
  priorite: boolean = false;
  destinataire = '';
  destinataireLabel = '';
  dispatchType = DispatchType.LETTER;
  contactEmail = '';
  contactEmailCC = '';
  contactEmailCCLabel = '';
  referenceEmetteur = '';

  commentaire = '';

  users: IUser[] = [];
  userSearch = '';
  selectedUser: IUser[] = [];
  editingTaskIndex: number | null = null;
  isEditMode: boolean = false;

  selectedCorrespReference: string | null = null; // stocke la reference sélectionnée (facultatif)

  // État du modal références
  refsModalOpen = false;
  refsModalPage = 1;
  refsModalTotalPages = 1;
  refsModalTotalItems = 0;
  refsModalPageSize = 10;
  refsModalItems: CorrespReferenceItem[] = [];
  refsModalLoading = false;
  refsModalSearchQuery = '';
  refsSelectedItem: CorrespReferenceItem | null = null;

  mySocietes: SocieteItem[] = [];
  selectedSociete: SocieteItem | null = null;
  loadingSocietes = false;

  editForm: CorrespFormGroup = this.correspFormService.createCorrespFormGroup();

  searchExpr = function (dataItem: IUser): string {
    return dataItem.login!;
  };

  uploadedFiles: File[] = [];

  accordionStates: { [key: string]: boolean } = {
    infoGen: true,
    taches: true,
    corps: true,
    pieces: true,
  };

  tasks: Array<{
    typeTask: string;
    responsable: any;
    dateLimite: string;
    responsableName: string;
    commentaire: string;
    autoBoc?: boolean;
  }> = [];

  correspType!: string;

  minDate!: string;
  maxDate!: string;

  typedocuments: ITypedocument[] = [];
  selectedTypeDocument?: ITypedocument;

  finalPath = '';

  companies: IContactCompany[] = [];
  personsForSelectedCompany: IPersonCompany[] = [];
  selectedCompanyId: number | null = null;
  selectedPersonId: number | null = null;
  loadingCompanies = false;
  loadingPersons = false;
  contactEmailLabel: string = '';

  showManualExpediteur = false;
  showManualContact: boolean = false;

  // === Modal Expéditeur ===
  expediteurModalOpen = false;
  expediteurModalSearch = '';
  expediteurModalFilteredCompanies: IContactCompany[] = [];

  // pagination du modal expéditeur
  expediteurModalPage = 0; // page courante (0-based pour Spring)
  expediteurModalPageSize = 20; // taille de page
  expediteurModalTotalItems = 0; // total d'éléments
  expediteurModalTotalPages = 0; // total de pages
  expediteurModalLoading = false; // indicateur de chargement
  expediteurModalSearchDebounce: any = null; // timer debounce
  hoveredCompanyId: number | null = null;

  // === NEW: Tree related state ===
  taskTree: DepartementTreeFeignDTO[] = []; // arbre récupéré depuis orgacare
  loadingTree = false;
  selectedDept: DepartementTreeFeignDTO | null = null;
  objectKeys = Object.keys; // helper pour template
  treeSearchQuery = '';
  taskTreeFiltered: DepartementTreeFeignDTO[] = [];

  // réintroduction des champs pour stocker la sélection (utilisés par saveTask)
  selectedDepartement: string = '';
  selectedDepartementName: string = '';
  selectedResponsables: { codeDept?: string | null; matriculePers?: string | null; displayName?: string | null }[] = [];
  expandedAffectations: Set<string> = new Set();
  expandedNodes: Set<number> = new Set();
  private levelPalette: string[] = ['#1e90ff', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6'];

  // liste d'organigrammes (optionnel) et code sélectionné
  orgaList: any[] = [];
  selectedOrgaCode: string | null = null;

  recipientTree: DepartementTreeFeignDTO[] = [];
  recipientTreeFiltered: DepartementTreeFeignDTO[] = [];
  recipientLoadingTree = false;
  recipientSelectedDept: DepartementTreeFeignDTO | null = null;
  recipientTreeSearchQuery = '';
  recipientExpandedNodes: Set<number> = new Set();

  // === CC (Contact En Copie) Tree state – multi-select ===
  ccTree: DepartementTreeFeignDTO[] = [];
  ccTreeFiltered: DepartementTreeFeignDTO[] = [];
  ccLoadingTree = false;
  ccTreeSearchQuery = '';
  ccExpandedNodes: Set<number> = new Set();
  selectedCcDepts: IContactCopieCorresp[] = [];

  // Options de type d’envoi (UI)
  dispatchTypeOptions: Array<{ value: DispatchType; label: string }> = [
    { value: DispatchType.LETTER, label: 'Lettre' },
    { value: DispatchType.REGISTERED_LETTER, label: 'Lettre recommandée' },
    { value: DispatchType.EMAIL, label: 'E-mail' },
    { value: DispatchType.FAX, label: 'Fax' },
  ];

  constructor(
    protected dataUtils: DataUtils,
    protected eventManager: EventManager,
    protected correspService: CorrespService,
    protected correspFormService: CorrespFormService,
    protected dossierService: DossierService,
    protected bordereauxService: BordereauxService,
    protected pjService: PjService,
    protected tasksService: TasksService,
    protected activatedRoute: ActivatedRoute,
    protected modalService: NgbModal,
    protected userService: UserService,
    protected route: ActivatedRoute,
    protected typeDocumentService: TypedocumentService,
    public router: Router,
    protected contactCompanyService: ContactCompanyService,
    protected parentClassdefService: ParentClassdefService,
    protected accountService: AccountService,
    private pjCareService: PjCareService,
    private scanSettingsService: ScanSettingsService
  ) {}

  // --------------------------------------------------------------------------
  // ngOnInit
  // --------------------------------------------------------------------------
  ngOnInit(): void {
    // Vérifier si l'utilisateur a le rôle ADMIN ou BOC
    this.accountService.getAuthenticationState().subscribe(account => {
      if (account && account.authorities) {
        this.isAdminOrBoc = account.authorities.includes(Authority.ADMIN) || account.authorities.includes(Authority.BOC);
      }
    });

    const today = new Date();
    this.date = today.toISOString().split('T')[0];

    const pastDate = new Date();
    pastDate.setDate(today.getDate() - 15);
    this.maxDate = today.toISOString().split('T')[0];
    this.minDate = pastDate.toISOString().split('T')[0];

    this.route.queryParams.subscribe(params => {
      this.correspType = params['type'];

      // ✅ NE PAS charger les typedocuments ici — c'est reloadTypedocuments() qui s'en charge
      // après que loadMySocietes() ait résolu le codeSociete.

      // Auto-create a "traitement" task for BOC users creating an Arrivée corresp
      if (this.correspType === 'Arrivée') {
        this.accountService.getAuthenticationState().subscribe(account => {
          if (
            account &&
            account.authorities &&
            (account.authorities.includes(Authority.BOC) || account.authorities.includes(Authority.ADMIN))
          ) {
            const userLogin = account.login;
            const userName = [account.firstName, account.lastName].filter(Boolean).join(' ') || userLogin;

            const alreadyExists = this.tasks.some(t => t.typeTask === 'traitement' && t.responsable === userLogin);
            if (!alreadyExists) {
              this.tasks.push({
                typeTask: 'traitement',
                responsable: userLogin,
                dateLimite: '',
                responsableName: userName,
                commentaire: '',
                autoBoc: true,
              });

              if (!this.accordionStates['taches']) {
                this.accordionStates['taches'] = true;
              }
            }
          }
        });
      }
    });

    this.loadUsers();
    this.loadActiveCompanies();
    this.loadMySocietes();
  }

  // --------------------------------------------------------------------------
  // Company / persons helpers
  // --------------------------------------------------------------------------
  companySearchExpr = function (dataItem: IContactCompany): string {
    return dataItem.nom || '';
  };

  personSearchExpr = function (dataItem: IPersonCompany): string {
    return (dataItem.nom ? dataItem.nom + ' ' : '') + (dataItem.email ? dataItem.email + ' ' : '') + (dataItem.tel ? dataItem.tel : '');
  };

  // NOUVEAU — on charge toutes les actives en une seule page large pour le dx-select-box contact
  loadActiveCompanies(): void {
    this.loadingCompanies = true;
    this.contactCompanyService.getActiveContactCompanies(0, 1000).subscribe({
      next: (res: HttpResponse<IContactCompany[]>) => {
        this.companies = res.body || [];
        this.loadingCompanies = false;
      },
      error: err => {
        console.error('Failed to load companies', err);
        this.companies = [];
        this.loadingCompanies = false;
      },
    });
  }

  onExpediteurChange(companyId: number | null | string): void {
    const id = companyId !== null && companyId !== undefined && companyId !== '' ? Number(companyId) : null;

    this.selectedCompanyId = id;
    this.personsForSelectedCompany = [];
    this.selectedPersonId = null;
    this.contactEmail = '';
    this.contactEmailLabel = '';

    if (id) {
      // D'abord chercher dans companies (chargé pour le Contact)
      const companyInList = this.companies.find(c => c.id === id);
      if (companyInList) {
        this.expediteur = companyInList.nom || '';
      } else {
        // Si la société vient du modal et n'est pas dans companies,
        // elle est passée directement via selectCompanyFromModal
        // donc expediteur est déjà défini — on ne le réinitialise pas
      }
    } else {
      if (!this.showManualExpediteur) {
        this.expediteur = '';
      }
    }

    if (!id) {
      this.loadingPersons = false;
      return;
    }

    this.loadingPersons = true;
    this.contactCompanyService.getActivePersonsByCompany(id).subscribe({
      next: (res: HttpResponse<IPersonCompany[]>) => {
        this.personsForSelectedCompany = res.body || [];
        this.loadingPersons = false;
      },
      error: err => {
        console.error('Erreur load persons', err);
        this.personsForSelectedCompany = [];
        this.loadingPersons = false;
      },
    });
  }

  onSelectContactPerson(personId: number | null): void {
    this.selectedPersonId = personId;

    if (!personId) {
      this.contactEmail = '';
      this.contactEmailLabel = '';
      return;
    }

    const p = this.personsForSelectedCompany.find(x => x.id === personId);

    if (p) {
      this.contactEmail = p.email || p.whatsapp || p.tel || p.nom || '';
      this.contactEmailLabel = p.nom || '';
    } else {
      this.contactEmail = '';
      this.contactEmailLabel = '';
    }
  }

  toggleManualExpediteur(to?: boolean): void {
    const next = typeof to === 'boolean' ? to : !this.showManualExpediteur;
    if (next) {
      this.selectedCompanyId = null;
      this.personsForSelectedCompany = [];
      this.selectedPersonId = null;
      this.loadingPersons = false;
    } else {
      this.expediteur = '';
      if (!this.companies || this.companies.length === 0) {
        this.loadActiveCompanies();
      }
    }
    this.showManualExpediteur = next;
  }

  toggleManualContact(to?: boolean): void {
    const next = typeof to === 'boolean' ? to : !this.showManualContact;
    this.showManualContact = next;
    if (!next) {
      this.selectedPersonId = null;
      this.contactEmail = '';
    }
  }

  openExpediteurModal(): void {
    this.expediteurModalSearch = '';
    this.expediteurModalPage = 0;
    this.expediteurModalFilteredCompanies = [];
    this.expediteurModalOpen = true;
    this.loadExpediteurModalPage();
  }

  closeExpediteurModal(): void {
    this.expediteurModalOpen = false;
  }

  onExpediteurModalSearchChange(): void {
    // Debounce 300ms pour éviter trop d'appels pendant la frappe
    if (this.expediteurModalSearchDebounce) {
      clearTimeout(this.expediteurModalSearchDebounce);
    }
    this.expediteurModalSearchDebounce = setTimeout(() => {
      this.expediteurModalPage = 0;
      this.loadExpediteurModalPage();
    }, 300);
  }

  loadExpediteurModalPage(page?: number): void {
    if (page !== undefined) {
      this.expediteurModalPage = page;
    }

    this.expediteurModalLoading = true;

    this.contactCompanyService
      .searchActiveContactCompanies(this.expediteurModalSearch || '', this.expediteurModalPage, this.expediteurModalPageSize)
      .subscribe({
        next: res => {
          this.expediteurModalFilteredCompanies = res.body || [];

          // lire le total depuis les headers X-Total-Count (standard JHipster)
          const totalCount = res.headers.get('X-Total-Count');
          this.expediteurModalTotalItems = totalCount ? +totalCount : 0;
          this.expediteurModalTotalPages = Math.ceil(this.expediteurModalTotalItems / this.expediteurModalPageSize);

          this.expediteurModalLoading = false;
        },
        error: () => {
          this.expediteurModalFilteredCompanies = [];
          this.expediteurModalLoading = false;
        },
      });
  }

  // NOUVEAU — on définit directement les champs sans dépendre de this.companies
  selectCompanyFromModal(company: IContactCompany): void {
    this.expediteurModalOpen = false;

    // Définir directement les champs depuis l'objet company du modal
    this.selectedCompanyId = company.id;
    this.expediteur = company.nom || '';

    // Réinitialiser le contact
    this.personsForSelectedCompany = [];
    this.selectedPersonId = null;
    this.contactEmail = '';
    this.contactEmailLabel = '';

    // Charger les personnes pour ce company
    this.loadingPersons = true;
    this.contactCompanyService.getActivePersonsByCompany(company.id).subscribe({
      next: (res: HttpResponse<IPersonCompany[]>) => {
        this.personsForSelectedCompany = res.body || [];
        this.loadingPersons = false;
      },
      error: err => {
        console.error('Erreur load persons', err);
        this.personsForSelectedCompany = [];
        this.loadingPersons = false;
      },
    });
  }

  clearExpediteurSelection(): void {
    this.selectedCompanyId = null;
    this.personsForSelectedCompany = [];
    this.selectedPersonId = null;
    this.contactEmail = '';
    this.contactEmailLabel = '';
    this.expediteur = '';
  }

  onRecipientOrCcChange(): void {
    this.syncDefaultTaskNames();
  }

  private syncDefaultTaskNames(): void {
    if (!this.tasks || this.tasks.length === 0) {
      return;
    }
    this.tasks = this.tasks.map(t => {
      if (t.typeTask === 'traitement' && !t.autoBoc) {
        return { ...t, responsableName: this.destinataireLabel || t.responsableName || '' };
      }
      // Pour les tâches "lecture", chaque tâche garde son propre responsableName (nom du département CC)
      // On ne les écrase pas avec un label global car il y a plusieurs CC
      return t;
    });
  }

  onTypeDocumentChange(): void {
    if (!this.selectedTypeDocument) {
      this.objet = '';
      this.destinataire = '';
      this.destinataireLabel = '';
      this.contactEmailCC = '';
      this.contactEmailCCLabel = '';
      this.selectedCcDepts = [];
      return;
    }

    this.objet = this.selectedTypeDocument.defaultobject || '';

    if (this.selectedTypeDocument.nom === 'Autre') {
      this.tasks = this.tasks.filter(t => t.autoBoc === true);
    }

    if (this.selectedTypeDocument.defautdest) {
      this.tasks = this.tasks.filter(t => t.autoBoc === true);

      this.correspService.queryOrgaDepsByCode({ code: this.selectedTypeDocument.defautdest }).subscribe({
        next: (res: HttpResponse<IDepartement>) => {
          if (res.body) {
            this.destinataire = res.body.email || '';
            this.destinataireLabel = res.body.nom || '';

            const taskData = {
              typeTask: 'traitement',
              responsable: res.body.code ?? '',
              dateLimite: '',
              responsableName: res.body.nom ?? '',
              commentaire: '',
            };

            this.tasks.push(taskData);
          } else {
            this.destinataire = '';
          }
        },
        error: () => {
          this.destinataire = '';
          this.destinataireLabel = '';
        },
      });
    } else {
      this.destinataire = '';
      this.destinataireLabel = '';
    }

    if (this.selectedTypeDocument.defaultencopie) {
      // Splitter les codes multiples
      const codes = this.selectedTypeDocument.defaultencopie
        .split(',')
        .map(c => c.trim())
        .filter(c => !!c);

      this.selectedCcDepts = [];
      this.tasks = this.tasks.filter(t => t.typeTask !== 'lecture');

      // Appel individuel pour chaque code
      codes.forEach(code => {
        this.correspService.queryOrgaDepsByCode({ code }).subscribe({
          next: (res: HttpResponse<IDepartement>) => {
            if (res.body) {
              // Éviter les doublons
              if (!this.selectedCcDepts.find(d => d.codeDept === res.body!.code)) {
                this.selectedCcDepts.push({
                  idDept: res.body.id ?? null,
                  codeDept: res.body.code ?? '',
                  nomDept: res.body.nom ?? '',
                  emailDept: res.body.email ?? '',
                });
              }

              this.updateCcLabelsFromSelection();

              // Ajouter une tâche lecture par département
              if (!this.tasks.find(t => t.typeTask === 'lecture' && t.responsable === (res.body!.code ?? ''))) {
                this.tasks.push({
                  typeTask: 'lecture',
                  responsable: res.body.code ?? '',
                  dateLimite: '',
                  responsableName: res.body.nom ?? '',
                  commentaire: '',
                });
              }

              this.syncDefaultTaskNames();
            }
          },
          error: () => {
            console.warn(`Département introuvable pour le code: ${code}`);
          },
        });
      });
    } else {
      this.selectedCcDepts = [];
      this.contactEmailCC = '';
      this.contactEmailCCLabel = '';
    }

    this.syncDefaultTaskNames();
  }

  generateRandomId(length: number = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Ouvrir le modal de sélection de référence
  openRefsModal(): void {
    this.refsModalPage = 1;
    this.refsModalSearchQuery = '';
    this.refsModalItems = [];
    this.refsModalOpen = true;
    this.loadRefsModalPage(1);
  }

  closeRefsModal(): void {
    this.refsModalOpen = false;
  }

  loadRefsModalPage(page: number): void {
    this.refsModalLoading = true;
    this.correspService.getReferences(page, this.refsModalPageSize, this.refsModalSearchQuery).subscribe({
      next: res => {
        this.refsModalItems = res.content;
        this.refsModalPage = res.currentPage;
        this.refsModalTotalPages = res.totalPages;
        this.refsModalTotalItems = res.totalItems;
        this.refsModalLoading = false;
      },
      error: () => {
        this.refsModalItems = [];
        this.refsModalLoading = false;
      },
    });
  }

  onRefsModalSearchChange(): void {
    this.refsModalPage = 1;
    this.loadRefsModalPage(1);
  }

  refsModalGoToPage(page: number): void {
    if (page < 1 || page > this.refsModalTotalPages) return;
    this.loadRefsModalPage(page);
  }

  selectRefItem(item: CorrespReferenceItem): void {
    this.refsSelectedItem = item;
    this.reponseSur = item.reference;
    this.refsModalOpen = false;
    // Pour corresp-update uniquement — garder la synchro avec le formGroup si besoin :
    try {
      this.editForm?.controls?.responseTo?.setValue(this.reponseSur);
    } catch (e) {}
  }

  clearReponseSur(): void {
    this.refsSelectedItem = null;
    this.reponseSur = '';
  }

  formatRefDate(date?: string | null): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  onSelectReponseSur(reference: string | null): void {
    this.reponseSur = reference ?? '';
    this.selectedCorrespReference = reference;

    // Si tu utilises le formGroup et que tu veux stocker la valeur dedans :
    try {
      // nom du control dans CorrespFormGroup : "responseTo" ? adapte si différent
      if (this.editForm && this.editForm.controls && this.editForm.controls.responseTo) {
        this.editForm.controls.responseTo.setValue(this.reponseSur);
      }
    } catch (e) {
      // ignore si le control n'existe pas
    }
  }

  // --------------------------------------------------------------------------
  // Upload helpers (unchanged)
  // --------------------------------------------------------------------------
  uploadFileWithProgress(file: File, uniqueName: string, pjModel: IPj): void {
    this.isUploading = true;

    const req = { uniqueName };

    this.pjService.uploadPj(file, req).subscribe({
      next: progressOrResponse => {
        if (typeof progressOrResponse === 'number') {
          this.uploadProgress.set(uniqueName, progressOrResponse);
        } else {
          this.uploadProgress.set(uniqueName, 100);

          if (!this.accordionStates['pieces']) {
            this.accordionStates['pieces'] = true;
          }

          pjModel.path = progressOrResponse;

          setTimeout(() => {
            this.uploadProgress.delete(uniqueName);
            this.isUploading = false;
          }, 500);
        }
      },
      error: error => {
        console.error('Upload failed:', error);
        this.uploadProgress.delete(uniqueName);
        this.isUploading = false;

        const link = this.fileLinks.find(l => l.uniqueName === uniqueName);
        if (link) {
          this.removeFile(link.index);
        }

        alert('Échec du téléchargement du fichier');
      },
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.uploadedFiles.push(file);

      const uniquePjName = this.generateRandomId(10);

      const pjModel: IPj = {} as IPj;
      const parts = file.name.split('.');

      pjModel.name = parts.slice(0, -1).join('.');
      pjModel.fileType = parts[parts.length - 1];
      pjModel.uniqueName = uniquePjName;

      this.fileLinks.push({ index: this.uploadedFiles.length - 1, uniqueName: uniquePjName });

      this.uploadProgress.set(uniquePjName, 0);

      this.uploadFileWithProgress(file, uniquePjName, pjModel);

      this.pjsToSave.push(pjModel);
    }

    event.target.value = '';
  }

  removeFile(index?: number): void {
    if (index === undefined || index < 0 || index >= this.uploadedFiles.length) {
      return;
    }

    const link = this.fileLinks.find(l => l.index === index);

    if (link?.uniqueName) {
      if (this.uploadProgress.has(link.uniqueName)) {
        alert('Veuillez attendre la fin du téléchargement');
        return;
      }

      const file = this.uploadedFiles[link.index];
      const fileName = file?.name ?? '';
      const type = fileName.substring(fileName.lastIndexOf('.') + 1);

      const req = { uniqueName: link.uniqueName, fileType: type };

      this.pjService.deletePj(req).subscribe({
        next: () => {
          this.performFileRemoval(index, link.uniqueName);
        },
        error: error => {
          console.error('Delete failed:', error);
          alert('Échec de la suppression du fichier');
        },
      });
    } else {
      this.performFileRemoval(index);
    }
  }

  private performFileRemoval(index: number, uniqueName?: string): void {
    this.uploadedFiles.splice(index, 1);

    if (uniqueName) {
      this.pjsToSave = this.pjsToSave.filter(pj => pj.uniqueName !== uniqueName);
      this.uploadProgress.delete(uniqueName);
    }

    this.fileLinks = this.fileLinks.filter(l => l.index !== index);

    this.fileLinks.forEach(l => {
      if (l.index > index) l.index -= 1;
    });
  }

  getUploadProgress(index: number): number | null {
    const link = this.fileLinks.find(l => l.index === index);
    if (link?.uniqueName && this.uploadProgress.has(link.uniqueName)) {
      return this.uploadProgress.get(link.uniqueName)!;
    }
    return null;
  }

  // --------------------------------------------------------------------------
  // Identifier : génère la référence puis sauvegarde et navigue vers le détail
  // --------------------------------------------------------------------------
  generateReference(): void {
    // Valider les champs obligatoires AVANT de générer la référence
    this.validationInfoGenErrors = {};
    if (!this.validateInfoGeneralesForm()) {
      this.showNotification("Veuillez remplir tous les champs obligatoires avant d'identifier", 'error');
      return;
    }

    // Déduire le corresptype selon la sélection courante
    let correspTypeValue: string = '';
    switch (this.correspType) {
      case 'Arrivée':
        correspTypeValue = CorrespType.INCOMING as unknown as string;
        break;
      case 'Sortant':
        correspTypeValue = CorrespType.OUTGOING as unknown as string;
        break;
      case 'Interne':
        correspTypeValue = CorrespType.INTERNAL as unknown as string;
        break;
    }

    if (!correspTypeValue) {
      this.showNotification("Veuillez sélectionner le type de correspondance avant d'identifier", 'error');
      return;
    }

    this.isGeneratingReference = true;
    // Récupérer le codeSociete depuis la société sélectionnée
    const societeCode = this.selectedSociete?.codeSociete ?? null;

    this.parentClassdefService.getNextNumber(correspTypeValue, societeCode).subscribe({
      next: nextNumber => {
        this.generatedReference = nextNumber || '';
        this.isGeneratingReference = false;
        this.showNotification(`Référence générée : ${this.generatedReference}`, 'success');
        this.saveCorresp(false, true);
      },
      error: () => {
        this.isGeneratingReference = false;
        this.showNotification('Échec de la génération de la référence', 'error');
      },
    });
  }

  // --------------------------------------------------------------------------
  // Save correspondance
  // --------------------------------------------------------------------------
  saveCorresp(withReference?: boolean, navigateToDetail?: boolean): void {
    // Protection contre le double-clic
    if (this.isSaving) {
      return;
    }

    this.validationInfoGenErrors = {};

    if (!this.validateInfoGeneralesForm()) {
      return;
    }

    this.isSaving = true;

    // Réinitialiser les listes pour éviter l'accumulation lors de clics multiples
    this.tasksToSave = [];

    if (!this.corresp) {
      this.corresp = {} as ICorresp;
    }

    this.corresp!.courrierDate = dayjs(this.date).add(10, 'hour');
    this.corresp!.subject = this.objet;
    this.corresp!.sender = this.expediteur;
    this.corresp!.contact = this.destinataire;
    this.corresp!.labelDestinataire = this.destinataireLabel;
    this.corresp!.contactEmail = this.contactEmail;
    this.corresp!.labelContactCC = this.contactEmailCCLabel;
    this.corresp!.contactCopies = this.selectedCcDepts.length > 0 ? [...this.selectedCcDepts] : null;
    this.corresp!.responseTo = this.reponseSur;
    this.corresp!.senderReference = this.referenceEmetteur;
    this.corresp!.priority = this.priorite === true || (this.priorite as any) === 'Prioritaire';
    this.corresp!.body = this.htmlContent;

    this.corresp!.dispatchType = (this.dispatchType as DispatchType) || DispatchType.LETTER;

    switch (this.correspType) {
      case 'Arrivée':
        this.corresp!.corresptype = CorrespType.INCOMING;
        break;
      case 'Sortant':
        this.corresp!.corresptype = CorrespType.OUTGOING;
        break;
      case 'Interne':
        this.corresp!.corresptype = CorrespType.INTERNAL;
        break;
    }

    this.tasks.forEach(t => {
      const taskModel: ITasks = {} as ITasks;
      taskModel.responsible = t.responsable;
      taskModel.dueDate = dayjs(t.dateLimite);
      taskModel.taskType = t.typeTask;
      taskModel.commentaire = t.commentaire;

      // Peupler responsables pour alimenter la table responsable_tache côté backend
      if (t.autoBoc) {
        // Tâche BOC auto-créée : le responsable est un matricule (login du user)
        taskModel.responsables = [{ matriculePers: t.responsable }];
      } else if (t.responsable) {
        // Tâche standard : le responsable est un code département
        taskModel.responsables = [{ codeDept: t.responsable }];
      }

      this.tasksToSave.push(taskModel);
    });

    // Utiliser la référence générée par "Identifier" si disponible
    if (this.generatedReference) {
      this.corresp!.reference = this.generatedReference;
    }

    // Mémoriser si une tâche BOC auto-créée existe avant le save
    const hasAutoBocTask = this.tasks.some(t => t.autoBoc === true);

    // Persister la société sélectionnée
    // Persister la société sélectionnée
    if (this.selectedSociete) {
      this.corresp!.idSociete = this.selectedSociete.id;
      this.corresp!.nomSociete = this.selectedSociete.raisonSociale;
      this.corresp!.codeUniqueSociete = this.selectedSociete.codeSociete ?? null;
    }

    this.correspService
      .saveCorrespWithTasksAndPj(this.corresp, this.tasksToSave, this.pjsToSave, this.selectedTypeDocument, false)
      .subscribe({
        next: (savedCorresp: any) => {
          this.isSaving = false;

          // Si l'utilisateur BOC a une tâche de traitement auto-créée,
          // on change son statut en IN_PROGRESS après la sauvegarde
          if (hasAutoBocTask && savedCorresp?.id) {
            this.tasksService.getAllTasksByCorrespId({ correspId: savedCorresp.id }).subscribe({
              next: (tasksRes: HttpResponse<ITasks[]>) => {
                const savedTasks = tasksRes.body || [];
                const bocTask = savedTasks.find(t => t.taskType === 'traitement');
                if (bocTask && bocTask.id) {
                  this.correspService.changeTaskStatus(savedCorresp.id, bocTask.id, 'IN_PROGRESS').subscribe({
                    next: () => {
                      // Navigation après le changement de statut réussi
                      this.router.navigate(['/corresp', savedCorresp.id, 'view']);
                    },
                    error: () => {
                      // En cas d'erreur du changeTaskStatus, on navigue quand même
                      this.router.navigate(['/corresp', savedCorresp.id, 'view']);
                    },
                  });
                } else {
                  // Pas de tâche traitement trouvée, navigation normale
                  this.router.navigate(['/corresp', savedCorresp.id, 'view']);
                }
              },
              error: () => {
                // Erreur lors de la récupération des tâches, navigation normale
                this.router.navigate(['/corresp', savedCorresp.id, 'view']);
              },
            });
          } else if (savedCorresp?.id) {
            this.router.navigate(['/corresp', savedCorresp.id, 'view']);
          } else {
            this.router.navigate(['/corresp']);
          }
        },
        error: () => {
          this.isSaving = false;
        },
      });
  }

  // --------------------------------------------------------------------------
  // Soumettre correspondance (ADMIN / BOC uniquement)
  // --------------------------------------------------------------------------
  soumettreCorresp(): void {
    if (!this.corresp?.id) {
      this.showNotification("Veuillez d'abord enregistrer la correspondance avant de la soumettre.", 'error');
      return;
    }
    this.isSaving = true;
    this.correspService.soumettreCorresp({ correspId: this.corresp.id }).subscribe({
      next: () => {
        this.isSaving = false;
        this.showNotification('Correspondance soumise avec succès.', 'success');
        this.router.navigate(['/corresp', this.corresp.id, 'view']);
      },
      error: () => {
        this.isSaving = false;
        this.showNotification('Échec de la soumission de la correspondance.', 'error');
      },
    });
  }

  // --------------------------------------------------------------------------
  // Clôturer correspondance (ADMIN / BOC uniquement)
  // --------------------------------------------------------------------------
  cloturerCorresp(): void {
    if (!this.corresp?.id) {
      this.showNotification("Veuillez d'abord enregistrer la correspondance avant de la clôturer.", 'error');
      return;
    }
    this.isSaving = true;
    this.correspService.cloturerCorresp({ correspId: this.corresp.id }).subscribe({
      next: () => {
        this.isSaving = false;
        this.showNotification('Correspondance clôturée avec succès.', 'success');
        this.router.navigate(['/corresp', this.corresp.id, 'view']);
      },
      error: () => {
        this.isSaving = false;
        this.showNotification('Échec de la clôture de la correspondance.', 'error');
      },
    });
  }

  validateInfoGeneralesForm(): boolean {
    let isValid = true;
    this.validationInfoGenErrors = {};

    if (!this.selectedTypeDocument) {
      this.validationInfoGenErrors['typeDocument'] = 'Le type de document est obligatoire';
      isValid = false;
    }

    if (!this.objet?.trim()) {
      this.validationInfoGenErrors['objet'] = "L'objet est obligatoire";
      isValid = false;
    }

    if (!this.date) {
      this.validationInfoGenErrors['date'] = 'La date est obligatoire';
      isValid = false;
    }

    if (!this.selectedCompanyId && !this.expediteur?.trim()) {
      this.validationInfoGenErrors['expediteur'] = "L'expéditeur est obligatoire";
      isValid = false;
    }

    if (!this.destinataireLabel?.trim()) {
      this.validationInfoGenErrors['destinataire'] = 'Le destinataire est obligatoire';
      isValid = false;
    }

    return isValid;
  }

  validationInfoGenErrors: { [key: string]: string } = {};

  // --------------------------------------------------------------------------
  // TASKS logic (updated to use selectedDepartement)
  // --------------------------------------------------------------------------
  saveTask(): void {
    this.validationErrors = {};

    if (!this.validateForm()) {
      return;
    }

    const selections = this.selectedResponsables || [];
    if (selections.length > 0) {
      // Crée une tâche par sélection, avec affichage lisible (nom pour DEPT, nomPrenom pour PERS)
      const createdItems: Array<{ typeTask: string; responsable: any; dateLimite: string; responsableName: string; commentaire: string }> =
        [];
      for (const sel of selections) {
        const codeOrMatricule = sel.matriculePers ? sel.matriculePers : sel.codeDept || '';
        const displayLabel = sel.displayName || codeOrMatricule;
        const taskData = {
          typeTask: this.selectedType,
          responsable: codeOrMatricule,
          dateLimite: this.dateLimite,
          responsableName: displayLabel,
          commentaire: this.commentaire,
        };
        createdItems.push(taskData);
      }
      if (this.isEditMode && this.editingTaskIndex !== null && createdItems.length === 1) {
        this.tasks[this.editingTaskIndex] = createdItems[0];
      } else {
        // En mode création ou multi-sélection en édition, on ajoute chaque item
        for (const td of createdItems) {
          this.tasks.push(td);
        }
      }
    } else {
      // Fallback: une seule sélection par département (ancien comportement)
      const responsibleText = this.selectedDepartement || '';
      const taskData = {
        typeTask: this.selectedType,
        responsable: responsibleText,
        dateLimite: this.dateLimite,
        responsableName: this.selectedDepartementName || responsibleText,
        commentaire: this.commentaire,
      };
      if (this.isEditMode && this.editingTaskIndex !== null) {
        this.tasks[this.editingTaskIndex] = taskData;
      } else {
        this.tasks.push(taskData);
      }
    }

    this.resetForm();
    this.modalService.dismissAll();

    if (!this.accordionStates['taches']) {
      this.accordionStates['taches'] = true;
    }
  }

  resetForm(): void {
    this.selectedType = '';
    this.commentaire = '';
    this.validationErrors = {};
    this.dateLimite = '';
    // reset selected departement (optional)
    this.selectedDepartement = '';
    this.selectedDepartementName = '';
    this.selectedDept = null;
    this.selectedResponsables = [];
    this.expandedNodes.clear();
    this.expandedAffectations.clear();
  }

  editTask(index: number, modal: any): void {
    this.openTasksModal(modal, index);
  }

  removeTask(index: number): void {
    this.tasks.splice(index, 1);
  }

  getTaskDetails(task: any): any {
    return {
      typeTask: task.typeTask,
      responsableName: task.responsable,
      responsableDisplay: task.responsableName,
      dateLimite: task.dateLimite ? this.formatDate(task.dateLimite) : '',
      commentaire: task.commentaire,
    };
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  validateForm(): boolean {
    let isValid = true;
    this.validationErrors = {};

    if (!this.selectedType || this.selectedType.trim() === '') {
      this.validationErrors['typeTask'] = 'Le type de la tâche est obligatoire';
      isValid = false;
    }

    return isValid;
  }

  validationErrors: { [key: string]: string } = {};

  // --------------------------------------------------------------------------
  // OPEN TASKS MODAL: load tree when modal opens
  // --------------------------------------------------------------------------
  openTasksModal(content: any, taskIndex?: number): void {
    if (taskIndex !== undefined && taskIndex !== null) {
      this.isEditMode = true;
      this.editingTaskIndex = taskIndex;
      const task = this.tasks[taskIndex];
      this.selectedType = task.typeTask;
      this.commentaire = task.commentaire;
      this.dateLimite = task.dateLimite;
      // restore selected departement fields if stored
      this.selectedDepartement = task.responsable || '';
      this.selectedDepartementName = task.responsableName || '';
    } else {
      this.isEditMode = false;
      this.editingTaskIndex = null;
      this.resetForm();
    }

    // Charger l'arbre pour le modal (on demande l'organigramme si non renseigné)
    this.prepareAndLoadOrgaThenTree();

    this.modalService.open(content, { size: 'xl' });
  }

  openRecipientModal(content: any): void {
    if (!this.selectedTypeDocument) {
      return;
    }
    this.prepareAndLoadOrgaThenRecipientTree();
    this.modalService.open(content, { size: 'xl' });
  }

  private prepareAndLoadOrgaThenTree(): void {
    if (this.selectedOrgaCode) {
      this.loadTreeForModal(this.selectedOrgaCode);
      return;
    }

    const orgaCode = this.selectedSociete?.codeOrganigramme;
    if (!orgaCode) {
      console.warn('Aucun codeOrganigramme disponible pour la société sélectionnée.');
      this.taskTree = [];
      this.taskTreeFiltered = [];
      return;
    }

    this.correspService.getOrgacareByOrgaCode(orgaCode).subscribe({
      next: (res: HttpResponse<any>) => {
        const orgacare = res.body;
        if (orgacare) {
          this.selectedOrgaCode = orgacare.orgaCode ?? orgacare.code ?? orgaCode;
        } else {
          this.selectedOrgaCode = orgaCode;
        }
        this.loadTreeForModal(this.selectedOrgaCode!);
      },
      error: err => {
        console.error('Erreur récupération orgacare', err);
        this.taskTree = [];
        this.taskTreeFiltered = [];
      },
    });
  }

  private prepareAndLoadOrgaThenRecipientTree(): void {
    if (this.selectedOrgaCode) {
      this.loadRecipientTreeForModal(this.selectedOrgaCode);
      return;
    }

    const orgaCode = this.selectedSociete?.codeOrganigramme;
    if (!orgaCode) {
      this.recipientTree = [];
      this.recipientTreeFiltered = [];
      return;
    }

    this.correspService.getOrgacareByOrgaCode(orgaCode).subscribe({
      next: (res: HttpResponse<any>) => {
        const orgacare = res.body;
        this.selectedOrgaCode = orgacare?.orgaCode ?? orgacare?.code ?? orgaCode;
        this.loadRecipientTreeForModal(this.selectedOrgaCode!);
      },
      error: () => {
        this.recipientTree = [];
        this.recipientTreeFiltered = [];
      },
    });
  }

  // --------------------------------------------------------------------------
  // Load tree from backend and normalize it
  // --------------------------------------------------------------------------
  loadTreeForModal(orgaCode: string): void {
    if (!orgaCode) {
      this.taskTree = [];
      this.taskTreeFiltered = [];
      return;
    }
    this.loadingTree = true;
    this.correspService.getDepartementHierarchyByOrganigramme(orgaCode).subscribe({
      next: (res: HttpResponse<DepartementTreeFeignDTO[]>) => {
        const body = res.body || [];
        this.taskTree = this.normalizeTree(body);
        this.taskTreeFiltered = this.taskTree;
        this.loadingTree = false;
      },
      error: err => {
        console.error('Erreur getDepartementHierarchyByOrganigramme', err);
        this.taskTree = [];
        this.taskTreeFiltered = [];
        this.loadingTree = false;
      },
    });
  }

  private loadRecipientTreeForModal(orgaCode: string): void {
    if (!orgaCode) {
      this.recipientTree = [];
      this.recipientTreeFiltered = [];
      return;
    }
    this.recipientLoadingTree = true;
    this.correspService.getDepartementTreeOnlyByOrganigramme(orgaCode).subscribe({
      next: (res: HttpResponse<DepartementTreeFeignDTO[]>) => {
        const body = res.body || [];
        this.recipientTree = this.normalizeTree(body);
        this.recipientTreeFiltered = this.recipientTree;
        this.recipientLoadingTree = false;
      },
      error: () => {
        this.recipientTree = [];
        this.recipientTreeFiltered = [];
        this.recipientLoadingTree = false;
      },
    });
  }

  // --------------------------------------------------------------------------
  // Normalisation / util (défensif)
  // --------------------------------------------------------------------------
  private normalizeTree(nodes?: DepartementTreeFeignDTO[] | null): DepartementTreeFeignDTO[] {
    if (!nodes) return [];
    return nodes.map(n => this.normalizeNode(n));
  }

  private normalizeNode(node: DepartementTreeFeignDTO): DepartementTreeFeignDTO {
    const children = node.children && Array.isArray(node.children) ? node.children.map(c => this.normalizeNode(c)) : [];

    const rawAff = (node as any).affectationsByType || {};
    const affs: Partial<Record<TypeAffectation, PersonneFeignDTO[]>> = {};

    // copier proprement les clés connues
    Object.keys(rawAff).forEach(k => {
      if ((Object.values(TypeAffectation) as string[]).includes(k)) {
        affs[k as TypeAffectation] = (rawAff as any)[k] ?? [];
      } else {
        // clé inconnue: defensive -> fusionner dans MEMBRE
        affs.MEMBRE = ((affs.MEMBRE || []) as PersonneFeignDTO[]).concat((rawAff as any)[k] || []);
      }
    });

    (Object.values(TypeAffectation) as TypeAffectation[]).forEach(t => {
      affs[t] = affs[t] || [];
    });

    return {
      ...node,
      children,
      affectationsByType: affs,
    };
  }

  // --------------------------------------------------------------------------
  // Selection d'un noeud (departement) dans l'arbre
  // --------------------------------------------------------------------------
  onSelectDept(node: DepartementTreeFeignDTO): void {
    this.selectedDept = node;
    this.selectedDepartement = node.code ?? '';
    this.selectedDepartementName = node.nom ?? '';
  }

  // Utilitaire pour afficher les responsables d'un nœud (liste de noms)
  getResponsablesForNode(node: DepartementTreeFeignDTO): string {
    if (!node || !node.affectationsByType) return '';
    const chefs = (node.affectationsByType['CHEF'] || []).map((p: any) => p.nomPrenom).filter(Boolean);
    const membres = (node.affectationsByType['MEMBRE'] || []).map((p: any) => p.nomPrenom).filter(Boolean);
    // priorité chefs
    if (chefs.length) return chefs.join(', ');
    if (membres.length) return membres.join(', ');
    return '';
  }

  // --- helpers: multi sélection + affichage
  private getResponsablesSummary(): string {
    if (!this.selectedResponsables || this.selectedResponsables.length === 0) return '';
    const parts: string[] = [];
    for (const r of this.selectedResponsables) {
      if (r.matriculePers) {
        parts.push(r.matriculePers);
      } else if (r.codeDept) {
        parts.push(r.codeDept);
      }
    }
    return parts.join(', ');
  }

  toggleAffectation(nodeId: number, type: string): void {
    const key = `${nodeId}-${type}`;
    if (this.expandedAffectations.has(key)) {
      this.expandedAffectations.delete(key);
    } else {
      this.expandedAffectations.add(key);
    }
  }

  isAffectationExpanded(nodeId: number, type: string): boolean {
    return this.expandedAffectations.has(`${nodeId}-${type}`);
  }

  getAffectationKeys(node: DepartementTreeFeignDTO): string[] {
    if (!node.affectationsByType) return [];
    return Object.keys(node.affectationsByType).filter(k => {
      const list = (node.affectationsByType as any)[k];
      return Array.isArray(list) && list.length > 0;
    });
  }

  getPeopleForType(node: DepartementTreeFeignDTO, type: string): PersonneFeignDTO[] {
    if (!node.affectationsByType) return [];
    return (node.affectationsByType as any)[type] || [];
  }

  toggleDeptSelection(node: DepartementTreeFeignDTO): void {
    const code = node.code ?? '';
    if (!code) return;
    const idx = this.selectedResponsables.findIndex(r => r.codeDept === code && !r.matriculePers);
    if (idx >= 0) {
      this.selectedResponsables.splice(idx, 1);
    } else {
      this.selectedResponsables.push({ codeDept: code, displayName: node.nom ?? code });
    }
  }

  isDeptSelected(node: DepartementTreeFeignDTO): boolean {
    const code = node.code ?? '';
    return !!this.selectedResponsables.find(r => r.codeDept === code && !r.matriculePers);
  }

  togglePersonSelection(node: DepartementTreeFeignDTO, person: PersonneFeignDTO): void {
    const code = node.code ?? '';
    const matricule = person.matricule ?? '';
    if (!matricule) return;
    const idx = this.selectedResponsables.findIndex(r => r.matriculePers === matricule && r.codeDept === code);
    if (idx >= 0) {
      this.selectedResponsables.splice(idx, 1);
    } else {
      this.selectedResponsables.push({ codeDept: code || null, matriculePers: matricule, displayName: person.nomPrenom ?? matricule });
    }
  }

  isPersonSelected(node: DepartementTreeFeignDTO, person: PersonneFeignDTO): boolean {
    const code = node.code ?? '';
    const matricule = person.matricule ?? '';
    return !!this.selectedResponsables.find(r => r.matriculePers === matricule && r.codeDept === code);
  }

  toggleNodeExpand(nodeId: number): void {
    if (this.expandedNodes.has(nodeId)) {
      this.expandedNodes.delete(nodeId);
    } else {
      this.expandedNodes.add(nodeId);
    }
  }

  isNodeExpanded(nodeId: number): boolean {
    return this.expandedNodes.has(nodeId);
  }

  removeSelection(sel: { codeDept?: string | null; matriculePers?: string | null }): void {
    let idx = -1;
    if (sel.matriculePers) {
      idx = this.selectedResponsables.findIndex(r => r.matriculePers === sel.matriculePers && r.codeDept === (sel.codeDept ?? r.codeDept));
    } else if (sel.codeDept) {
      idx = this.selectedResponsables.findIndex(r => r.codeDept === sel.codeDept && !r.matriculePers);
    }
    if (idx >= 0) {
      this.selectedResponsables.splice(idx, 1);
    }
  }

  clearSelections(): void {
    this.selectedResponsables = [];
  }

  getLevelColor(level: number): string {
    return this.levelPalette[level % this.levelPalette.length];
  }

  private showNotification(message: string, type: 'success' | 'error') {
    this.notificationMessage = message;
    this.notificationType = type;
    setTimeout(() => {
      this.notificationMessage = null;
      this.notificationType = null;
    }, 5000);
  }

  getTaskTypeBg(type?: string | null): string {
    const k = (type || '').toString().toLowerCase();
    if (k === 'lecture') return '#e8f2ff';
    if (k === 'signature') return '#efe8ff';
    if (k === 'traitement') return '#fff0e6';
    if (k === 'validation') return '#e9f7ee';
    return '#f8f9fa';
  }

  getTaskTypeAccent(type?: string | null): string {
    const k = (type || '').toString().toLowerCase();
    if (k === 'lecture') return '#1e7bff';
    if (k === 'signature') return '#6d28d9';
    if (k === 'traitement') return '#f97316';
    if (k === 'validation') return '#16a34a';
    return '#6c757d';
  }

  onTreeSearchChange(): void {
    const q = (this.treeSearchQuery || '').trim().toLowerCase();
    if (!q) {
      this.taskTreeFiltered = this.taskTree;
      return;
    }
    this.taskTreeFiltered = this.filterTree(this.taskTree, q);
    this.applyAutoExpand(this.taskTreeFiltered);
  }

  private filterTree(nodes: DepartementTreeFeignDTO[], q: string): DepartementTreeFeignDTO[] {
    return nodes.map(n => this.filterNode(n, q)).filter((n): n is DepartementTreeFeignDTO => n !== null);
  }

  private filterNode(node: DepartementTreeFeignDTO, q: string): DepartementTreeFeignDTO | null {
    const name = (node.nom || '').toLowerCase();
    const deptMatches = name.includes(q);

    const filteredChildren =
      (node.children || []).map(c => this.filterNode(c, q)).filter((c): c is DepartementTreeFeignDTO => c !== null) || [];

    const aff = node.affectationsByType || {};
    const filteredAff: Partial<Record<TypeAffectation, PersonneFeignDTO[]>> = {};
    let personMatches = false;
    Object.keys(aff as any).forEach(k => {
      const list = ((aff as any)[k] as PersonneFeignDTO[]) || [];
      const flist = list.filter(p => (p.nomPrenom || '').toLowerCase().includes(q));
      if (flist.length) personMatches = true;
      filteredAff[k as TypeAffectation] = flist;
    });

    const keepNode = deptMatches || personMatches || filteredChildren.length > 0;
    if (!keepNode) return null;

    return {
      ...node,
      children: filteredChildren,
      affectationsByType: filteredAff,
    };
  }

  private applyAutoExpand(nodes: DepartementTreeFeignDTO[]): void {
    const nodesToExpand: number[] = [];
    const affectationsToExpand: string[] = [];

    const visit = (n: DepartementTreeFeignDTO): void => {
      const id = n.id;
      const children = n.children || [];
      const aff = n.affectationsByType || {};

      if (children.length > 0) {
        nodesToExpand.push(id);
      }

      Object.keys(aff as any).forEach(t => {
        const list = ((aff as any)[t] as PersonneFeignDTO[]) || [];
        if (list.length > 0) {
          affectationsToExpand.push(`${id}-${t}`);
        }
      });

      children.forEach(c => visit(c));
    };

    nodes.forEach(n => visit(n));

    nodesToExpand.forEach(id => this.expandedNodes.add(id));
    affectationsToExpand.forEach(key => this.expandedAffectations.add(key));
  }

  onRecipientTreeSearchChange(): void {
    const q = (this.recipientTreeSearchQuery || '').trim().toLowerCase();
    if (!q) {
      this.recipientTreeFiltered = this.recipientTree;
      return;
    }
    this.recipientTreeFiltered = this.filterTree(this.recipientTree, q);
    this.applyRecipientAutoExpand(this.recipientTreeFiltered);
  }

  private applyRecipientAutoExpand(nodes: DepartementTreeFeignDTO[]): void {
    const nodesToExpand: number[] = [];
    const visit = (n: DepartementTreeFeignDTO): void => {
      const id = n.id;
      const children = n.children || [];
      if (children.length > 0) {
        nodesToExpand.push(id);
      }
      children.forEach(c => visit(c));
    };
    nodes.forEach(n => visit(n));
    nodesToExpand.forEach(id => this.recipientExpandedNodes.add(id));
  }

  toggleRecipientNodeExpand(nodeId: number): void {
    if (this.recipientExpandedNodes.has(nodeId)) {
      this.recipientExpandedNodes.delete(nodeId);
    } else {
      this.recipientExpandedNodes.add(nodeId);
    }
  }

  isRecipientNodeExpanded(nodeId: number): boolean {
    return this.recipientExpandedNodes.has(nodeId);
  }

  onSelectRecipientDept(node: DepartementTreeFeignDTO): void {
    this.recipientSelectedDept = node;
  }

  confirmRecipientSelection(modalRef: any): void {
    if (!this.recipientSelectedDept) {
      return;
    }
    this.destinataireLabel = this.recipientSelectedDept.nom || '';
    this.destinataire = this.recipientSelectedDept.email || '';

    // Mettre à jour ou créer la tâche "traitement" associée au destinataire
    // (ignorer la tâche BOC auto-créée qui est aussi de type 'traitement')
    const existingIdx = this.tasks.findIndex(t => t.typeTask === 'traitement' && !t.autoBoc);
    const newTaskData = {
      typeTask: 'traitement',
      responsable: this.recipientSelectedDept.code ?? '',
      dateLimite: existingIdx >= 0 ? this.tasks[existingIdx].dateLimite : '',
      responsableName: this.recipientSelectedDept.nom ?? '',
      commentaire: existingIdx >= 0 ? this.tasks[existingIdx].commentaire : '',
    };
    if (existingIdx >= 0) {
      this.tasks[existingIdx] = newTaskData;
    } else {
      this.tasks.push(newTaskData);
    }

    this.onRecipientOrCcChange();
    modalRef.close();
  }

  selectRecipientDept(node: DepartementTreeFeignDTO, modalRef: any): void {
    this.recipientSelectedDept = node;
    this.destinataireLabel = node.nom || '';
    this.destinataire = node.email || '';

    // Mettre à jour ou créer la tâche "traitement" associée au destinataire
    // (ignorer la tâche BOC auto-créée qui est aussi de type 'traitement')
    const existingIdx = this.tasks.findIndex(t => t.typeTask === 'traitement' && !t.autoBoc);
    const newTaskData = {
      typeTask: 'traitement',
      responsable: node.code ?? '',
      dateLimite: existingIdx >= 0 ? this.tasks[existingIdx].dateLimite : '',
      responsableName: node.nom ?? '',
      commentaire: existingIdx >= 0 ? this.tasks[existingIdx].commentaire : '',
    };
    if (existingIdx >= 0) {
      this.tasks[existingIdx] = newTaskData;
    } else {
      this.tasks.push(newTaskData);
    }

    this.onRecipientOrCcChange();
    modalRef.close();
  }

  clearRecipientDept(): void {
    this.recipientSelectedDept = null;
    this.destinataireLabel = '';
    this.destinataire = '';
    // Supprimer la tâche "traitement" associée au destinataire (pas la tâche BOC)
    const idx = this.tasks.findIndex(t => t.typeTask === 'traitement' && !t.autoBoc);
    if (idx >= 0) {
      this.tasks.splice(idx, 1);
    }
    this.onRecipientOrCcChange();
  }

  // --------------------------------------------------------------------------
  // CC (Contact En Copie) – multi-select tree
  // --------------------------------------------------------------------------
  openCcModal(content: any): void {
    this.prepareAndLoadOrgaThenCcTree();
    this.modalService.open(content, { size: 'xl' });
  }

  private prepareAndLoadOrgaThenCcTree(): void {
    if (this.selectedOrgaCode) {
      this.loadCcTreeForModal(this.selectedOrgaCode);
      return;
    }

    const orgaCode = this.selectedSociete?.codeOrganigramme;
    if (!orgaCode) {
      this.ccTree = [];
      this.ccTreeFiltered = [];
      return;
    }

    this.correspService.getOrgacareByOrgaCode(orgaCode).subscribe({
      next: (res: HttpResponse<any>) => {
        const orgacare = res.body;
        this.selectedOrgaCode = orgacare?.orgaCode ?? orgacare?.code ?? orgaCode;
        this.loadCcTreeForModal(this.selectedOrgaCode!);
      },
      error: () => {
        this.ccTree = [];
        this.ccTreeFiltered = [];
      },
    });
  }

  private loadCcTreeForModal(orgaCode: string): void {
    if (!orgaCode) {
      this.ccTree = [];
      this.ccTreeFiltered = [];
      return;
    }
    this.ccLoadingTree = true;
    this.correspService.getDepartementTreeOnlyByOrganigramme(orgaCode).subscribe({
      next: (res: HttpResponse<DepartementTreeFeignDTO[]>) => {
        const body = res.body || [];
        this.ccTree = this.normalizeTree(body);
        this.ccTreeFiltered = this.ccTree;
        this.ccLoadingTree = false;
      },
      error: () => {
        this.ccTree = [];
        this.ccTreeFiltered = [];
        this.ccLoadingTree = false;
      },
    });
  }

  onCcTreeSearchChange(): void {
    const q = (this.ccTreeSearchQuery || '').trim().toLowerCase();
    if (!q) {
      this.ccTreeFiltered = this.ccTree;
      return;
    }
    this.ccTreeFiltered = this.filterTree(this.ccTree, q);
    this.applyCcAutoExpand(this.ccTreeFiltered);
  }

  private applyCcAutoExpand(nodes: DepartementTreeFeignDTO[]): void {
    const nodesToExpand: number[] = [];
    const visit = (n: DepartementTreeFeignDTO): void => {
      const children = n.children || [];
      if (children.length > 0) {
        nodesToExpand.push(n.id);
      }
      children.forEach(c => visit(c));
    };
    nodes.forEach(n => visit(n));
    nodesToExpand.forEach(id => this.ccExpandedNodes.add(id));
  }

  toggleCcNodeExpand(nodeId: number): void {
    if (this.ccExpandedNodes.has(nodeId)) {
      this.ccExpandedNodes.delete(nodeId);
    } else {
      this.ccExpandedNodes.add(nodeId);
    }
  }

  isCcNodeExpanded(nodeId: number): boolean {
    return this.ccExpandedNodes.has(nodeId);
  }

  toggleCcDeptSelection(node: DepartementTreeFeignDTO): void {
    const code = node.code ?? '';
    if (!code) return;
    const idx = this.selectedCcDepts.findIndex(d => d.codeDept === code);
    if (idx >= 0) {
      this.selectedCcDepts.splice(idx, 1);
    } else {
      this.selectedCcDepts.push({
        idDept: node.id,
        codeDept: code,
        nomDept: node.nom ?? code,
        emailDept: node.email ?? '',
      });
    }
    this.updateCcLabelsFromSelection();
  }

  isCcDeptSelected(node: DepartementTreeFeignDTO): boolean {
    const code = node.code ?? '';
    return !!this.selectedCcDepts.find(d => d.codeDept === code);
  }

  removeCcDept(cc: IContactCopieCorresp): void {
    const idx = this.selectedCcDepts.findIndex(d => d.codeDept === cc.codeDept);
    if (idx >= 0) {
      this.selectedCcDepts.splice(idx, 1);
    }
    // Retirer la tâche "lecture" associée à ce département
    const taskIdx = this.tasks.findIndex(t => t.typeTask === 'lecture' && t.responsable === cc.codeDept);
    if (taskIdx >= 0) {
      this.tasks.splice(taskIdx, 1);
    }
    this.updateCcLabelsFromSelection();
  }

  clearCcSelections(): void {
    this.selectedCcDepts = [];
    // Retirer toutes les tâches "lecture"
    this.tasks = this.tasks.filter(t => t.typeTask !== 'lecture');
    this.updateCcLabelsFromSelection();
  }

  confirmCcSelection(modalRef: any): void {
    this.updateCcLabelsFromSelection();
    this.syncCcTasks();
    this.onRecipientOrCcChange();
    modalRef.close();
  }

  /**
   * Supprime toutes les tâches "lecture" existantes et en recrée une par département CC sélectionné.
   */
  private syncCcTasks(): void {
    // Retirer toutes les tâches "lecture"
    this.tasks = this.tasks.filter(t => t.typeTask !== 'lecture');

    // Créer une tâche "lecture" par département CC
    for (const cc of this.selectedCcDepts) {
      this.tasks.push({
        typeTask: 'lecture',
        responsable: cc.codeDept ?? '',
        dateLimite: '',
        responsableName: cc.nomDept ?? cc.codeDept ?? '',
        commentaire: '',
      });
    }
  }

  private updateCcLabelsFromSelection(): void {
    if (this.selectedCcDepts.length === 0) {
      this.contactEmailCCLabel = '';
      this.contactEmailCC = '';
    } else {
      this.contactEmailCCLabel = this.selectedCcDepts.map(d => d.nomDept || d.codeDept || '').join(', ');
      this.contactEmailCC = this.selectedCcDepts
        .map(d => d.emailDept || '')
        .filter(Boolean)
        .join(', ');
    }
  }

  // --------------------------------------------------------------------------
  // Users load
  // --------------------------------------------------------------------------
  loadUsers(): void {
    // this.userService.query({ page: 0, size: 1000, sort: ['firstName,ASC'] }).subscribe((res: HttpResponse<IUser[]>) => {
    //   this.users = res.body || [];
    // });
  }

  // --------------------------------------------------------------------------
  // Misc / file helpers
  // --------------------------------------------------------------------------
  byteSize(base64String: string): string {
    return this.dataUtils.byteSize(base64String);
  }

  openFile(base64String: string, contentType: string | null | undefined): void {
    this.dataUtils.openFile(base64String, contentType);
  }

  setFileData(event: Event, field: string, isImage: boolean): void {
    this.dataUtils.loadFileToForm(event, this.editForm, field, isImage).subscribe({
      error: (err: FileLoadError) =>
        this.eventManager.broadcast(new EventWithContent<AlertError>('correspCareApp.error', { ...err, key: 'error.file.' + err.key })),
    });
  }

  previousState(): void {
    window.history.back();
  }

  save(): void {
    this.isSaving = true;
    const corresp = this.correspFormService.getCorresp(this.editForm);
    if (corresp.id !== null) {
      this.subscribeToSaveResponse(this.correspService.update(corresp));
    } else {
      this.subscribeToSaveResponse(this.correspService.create(corresp));
    }
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<ICorresp>>): void {
    result.pipe(finalize(() => this.onSaveFinalize())).subscribe({
      next: () => this.onSaveSuccess(),
      error: () => this.onSaveError(),
    });
  }

  protected onSaveSuccess(): void {
    this.previousState();
  }

  protected onSaveError(): void {
    // Api for inheritance.
  }

  protected onSaveFinalize(): void {
    this.isSaving = false;
  }

  toggleAccordion(section: string): void {
    this.accordionStates[section] = !this.accordionStates[section];
  }

  // ── PjCare methods ─────────────────────────────────────────────────────────

  openScanModal(content: any): void {
    this.scanPreview = null;
    this.scanError = null;
    this.isMerging = false;
    this.currentDocumentPages = [];

    // Si des paramètres sont déjà mémorisés, fermer les sections de config
    const hasSavedSettings = this.scanSettingsService.hasSettings();
    this.accordionStates['scanSource'] = !hasSavedSettings;
    this.accordionStates['scanParams'] = !hasSavedSettings;

    this.loadScanSettings();
    this.checkPjCare();
    this.modalService.open(content, { size: 'lg' });
  }

  private loadScanSettings(): void {
    const s = this.scanSettingsService.load();
    this.scanFormat = s.scanFormat;
    this.scanDpi = s.scanDpi;
    this.scanQuality = s.scanQuality;
    this.scanBitdepth = s.scanBitdepth;
    this.scanDuplex = s.scanDuplex;
    this.scanExcludeBlank = s.scanExcludeBlank;
    this.scanBlankThreshold = s.scanBlankThreshold;
    this.scanCoverageThreshold = s.scanCoverageThreshold;
    // selectedDriver : sera écrasé par checkPjCare() si le driver sauvegardé
    // est encore disponible — on le stocke temporairement
    this._pendingDriverFromCookie = s.selectedDriver;
  }

  // Stockage temporaire du driver lu depuis le cookie
  // (sera appliqué après le chargement de la liste des drivers)
  private _pendingDriverFromCookie: string = '';

  saveScanSettings(): void {
    this.scanSettingsService.save({
      scanFormat: this.scanFormat,
      scanDpi: this.scanDpi,
      scanQuality: this.scanQuality,
      scanBitdepth: this.scanBitdepth,
      scanDuplex: this.scanDuplex,
      scanExcludeBlank: this.scanExcludeBlank,
      scanBlankThreshold: this.scanBlankThreshold,
      scanCoverageThreshold: this.scanCoverageThreshold,
      selectedDriver: this.selectedDriver as string,
    });
  }

  resetScanSettings(): void {
    this.scanSettingsService.reset();
    // Remettre les valeurs par défaut dans la vue
    this.scanFormat = 'pdf';
    this.scanDpi = 150;
    this.scanQuality = 75;
    this.scanBitdepth = 'color';
    this.scanDuplex = false;
    this.scanExcludeBlank = false;
    this.scanBlankThreshold = 240;
    this.scanCoverageThreshold = 5;
  }

  checkPjCare(): void {
    this.loadingScanners = true;
    this.loadingDrivers = true;

    this.pjCareService.getHealth().subscribe({
      next: res => {
        if (res && res.status === 200) {
          this.pjcareAvailable = true;
          this.pjCareService.getDrivers().subscribe({
            next: driverRes => {
              this.availableDrivers = driverRes.drivers || [];
              const defaultKey = res.defaultDriver || (this.availableDrivers[0]?.key ?? '');

              // Restaurer le driver depuis le cookie s'il est encore disponible
              const cookieDriver = this._pendingDriverFromCookie;
              const cookieDriverExists = cookieDriver ? this.availableDrivers.some(d => d.key === cookieDriver) : false;

              this.selectedDriver = (cookieDriverExists ? cookieDriver : defaultKey) as ScanDriver;
              this._pendingDriverFromCookie = ''; // vider après usage
              this.loadingDrivers = false;
              this.loadScannersForDriver(this.selectedDriver as ScanDriver);
            },
            error: () => {
              this.availableDrivers = [];
              this.loadingDrivers = false;
              this.loadScannersForDriver(undefined);
            },
          });
        } else {
          this.pjcareAvailable = false;
          this.loadingScanners = false;
          this.loadingDrivers = false;
        }
      },
      error: () => {
        this.pjcareAvailable = false;
        this.loadingScanners = false;
        this.loadingDrivers = false;
      },
    });
  }

  loadScannersForDriver(driver?: ScanDriver): void {
    this.loadingScanners = true;
    this.scanners = [];
    this.selectedScanner = '';

    this.pjCareService.getScanners(driver).subscribe({
      next: scanRes => {
        this.scanners = scanRes.scanners || [];
        if (this.scanners.length > 0) {
          this.selectedScanner = this.scanners[0];
        }
        this.loadingScanners = false;
      },
      error: () => {
        this.scanners = [];
        this.loadingScanners = false;
      },
    });
  }

  onDriverChange(): void {
    this.scanPreview = null;
    this.scanError = null;
    this.loadScannersForDriver((this.selectedDriver as ScanDriver) || undefined);
  }

  launchScan(): void {
    this.isScanning = true;
    this.scanError = null;
    this.scanPreview = null;

    this.saveScanSettings();

    this.pjCareService
      .scan({
        source: this.selectedScanner,
        driver: (this.selectedDriver as ScanDriver) || undefined,
        format: this.scanFormat as any,
        dpi: this.scanDpi,
        jpegquality: this.scanQuality,
        bitdepth: this.scanBitdepth,
        duplex: this.scanDuplex,
        name: this.objet || 'scan',
        excludeBlank: this.scanExcludeBlank,
        blankThreshold: this.scanBlankThreshold,
        coverageThreshold: this.scanCoverageThreshold,
      })
      .subscribe({
        next: result => {
          this.isScanning = false;
          if (result.status === 200) {
            const preview = this.scanFormat !== 'pdf' ? `data:image/${this.scanFormat};base64,${result.data}` : null;

            this.scanPreview = preview ?? 'pdf';

            // Ajouter au buffer du document courant
            const page: ScannedPage = {
              data: result.data,
              format: result.format || this.scanFormat,
              preview,
              pageNumber: this.currentDocumentPages.length + 1,
            };
            this.currentDocumentPages.push(page);
          } else {
            this.scanError = result.error || 'Erreur inconnue';
          }
        },
        error: () => {
          this.isScanning = false;
          this.scanError = 'PjCare inaccessible. Vérifiez que le service tourne.';
        },
      });
  }

  /** true si la société a été pré-sélectionnée via le modal (queryParam) */
  societeFromModal = false;

  loadMySocietes(): void {
    this.loadingSocietes = true;
    const societeId = this.route.snapshot.queryParamMap.get('societeId');

    this.correspService.getMySocietes().subscribe({
      next: societes => {
        this.mySocietes = societes;
        if (societes.length === 1) {
          this.selectedSociete = societes[0];
          this.societeFromModal = false;
        } else if (societes.length > 1 && societeId) {
          const found = societes.find(s => s.id === +societeId);
          if (found) {
            this.selectedSociete = found;
            this.societeFromModal = true;
            if (!found.codeSociete) {
              const societeCode = this.route.snapshot.queryParamMap.get('societeCode');
              if (societeCode) {
                this.selectedSociete = { ...found, codeSociete: societeCode };
              }
            }
          }
        }
        this.loadingSocietes = false;

        // ✅ Recharger les typedocuments maintenant qu'on a le codeSociete
        this.reloadTypedocuments();
      },
      error: () => {
        this.mySocietes = [];
        this.loadingSocietes = false;
      },
    });
  }

  private reloadTypedocuments(): void {
    let correspTypeForBackend = '';
    if (this.correspType === 'Arrivée') {
      correspTypeForBackend = 'Entrant';
    } else if (this.correspType === 'Sortant') {
      correspTypeForBackend = 'Sortant';
    } else if (this.correspType === 'Interne') {
      correspTypeForBackend = 'Interne';
    }

    const codeSociete = this.selectedSociete?.codeSociete ?? null;

    const loadTypedocs$ = correspTypeForBackend
      ? this.typeDocumentService.findByCorrespType(correspTypeForBackend, codeSociete)
      : this.typeDocumentService.query({ page: 0, size: 1000 });

    loadTypedocs$.subscribe(res => {
      this.typedocuments = res.body || [];
    });
  }

  compareSociete(a: SocieteItem | null, b: SocieteItem | null): boolean {
    return a != null && b != null && a.id === b.id;
  }

  removePage(index: number): void {
    this.currentDocumentPages.splice(index, 1);
    this.currentDocumentPages.forEach((p, i) => (p.pageNumber = i + 1));
    if (this.currentDocumentPages.length === 0) {
      this.scanPreview = null;
    }
  }

  attachScanResult(modal: any): void {
    if (this.currentDocumentPages.length === 0) return;

    // Cas 1 page : attachement direct sans fusion réseau
    if (this.currentDocumentPages.length === 1) {
      const p = this.currentDocumentPages[0];
      const filename = this.objet ? `${this.objet.replace(/[^\p{L}\p{N}_-]/gu, '_')}.${this.scanFormat}` : `scan.${this.scanFormat}`;
      this._attachRawResult(p.data, filename, this.scanFormat, modal);
      return;
    }

    // Plusieurs pages → fusion via /api/MergePages
    this.isMerging = true;
    this.scanError = null;

    this.pjCareService
      .mergePages({
        pages: this.currentDocumentPages.map(p => ({ data: p.data, format: p.format })),
        outputFormat: this.scanFormat as any,
        jpegquality: this.scanQuality,
        name: this.objet || 'document',
      })
      .subscribe({
        next: result => {
          this.isMerging = false;
          if (result.status === 200) {
            this._attachRawResult(result.data, result.file, result.format, modal);
          } else {
            this.scanError = result.error || 'Erreur lors de la fusion des pages';
          }
        },
        error: () => {
          this.isMerging = false;
          this.scanError = 'Erreur lors de la fusion des pages';
        },
      });
  }

  private _attachRawResult(base64: string, filename: string, format: string, modal: any): void {
    const mimeType = format === 'pdf' ? 'application/pdf' : `image/${format}`;
    const byteString = atob(base64);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
    const blob = new Blob([ab], { type: mimeType });
    const file = new File([blob], filename, { type: mimeType });

    this.uploadedFiles.push(file);
    const uniquePjName = this.generateRandomId(10);
    const pjModel: IPj = {} as IPj;
    const parts = filename.split('.');
    pjModel.name = parts.slice(0, -1).join('.');
    pjModel.fileType = parts[parts.length - 1];
    pjModel.uniqueName = uniquePjName;

    this.fileLinks.push({ index: this.uploadedFiles.length - 1, uniqueName: uniquePjName });
    this.uploadProgress.set(uniquePjName, 0);
    this.uploadFileWithProgress(file, uniquePjName, pjModel);
    this.pjsToSave.push(pjModel);

    this.accordionStates['pieces'] = true;
    modal.close();
  }

  // ── PjCare scan state ──────────────────────────────────────────────────────
  pjcareAvailable = false;
  scanners: string[] = [];
  selectedScanner = '';
  scanFormat: 'jpg' | 'png' | 'pdf' | 'tiff' = 'pdf';
  scanDpi = 150;
  scanQuality = 75;
  scanBitdepth: 'color' | 'gray' | 'bw' = 'color';
  scanDuplex = false;
  isScanning = false;
  isMerging = false;
  scanPreview: string | null = null;
  scanError: string | null = null;
  loadingScanners = false;
  availableDrivers: PjCareDriverInfo[] = [];
  selectedDriver: ScanDriver | '' = '';
  loadingDrivers = false;
  scanExcludeBlank = false;
  scanBlankThreshold = 240;
  scanCoverageThreshold = 5;

  /** Buffer multi-pages du document en cours — toutes les pages seront fusionnées en UN seul fichier */
  currentDocumentPages: ScannedPage[] = [];

  protected readonly console = console;
  protected readonly CorrespType = CorrespType;
  protected readonly CorrespStatus = CorrespStatus;
}
