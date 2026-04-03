import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { CorrespFormService, CorrespFormGroup } from '../update/corresp-form.service';
import { ICorresp, IContactCopieCorresp } from '../corresp.model';
import { CorrespService, CorrespReferenceItem } from '../service/corresp.service';
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

import dayjs from 'dayjs/esm';
import { ITypedocument } from '../../../configManage/typedocument/typedocument.model';
import { TypedocumentService } from '../../../configManage/typedocument/service/typedocument.service';
import { IDepartement } from '../../../orgacare/departement/departement.model';

import { ContactCompanyService } from 'app/entities/configManage/contact-company/service/contact-company.service';
import { IContactCompany } from 'app/entities/configManage/contact-company/contact-company.model';
import { IPersonCompany } from 'app/entities/configManage/person-company/person-company.model';
import { ParentClassdefService } from 'app/entities/configManage/parent-classdef/service/parent-classdef.service';

import { DepartementTreeFeignDTO } from '../update/DepartementTreeFeignDTO';
import { PersonneFeignDTO } from '../update/PersonneFeignDTO';
import { TypeAffectation } from 'app/entities/correspManage/corresp/update/enums';

import { AccountService } from 'app/core/auth/account.service';
import { Authority } from 'app/config/authority.constants';
import { PjCareService, PjCareDriverInfo, ScanDriver, ScannedPage } from 'app/entities/correspManage/pj/service/pjcare.service';
import { ScanSettingsService } from 'app/entities/correspManage/pj/service/scan-settings.service';
import { ModelNotifService } from 'app/entities/configManage/model-notif/service/model-notif.service';
import { IModelNotif } from 'app/entities/configManage/model-notif/model-notif.model';

import { IMessage, NewMessage } from '../../message/message.model';

interface FileIndexLink {
  index: number;
  uniqueName: string;
}

@Component({
  selector: 'jhi-corresp-out-update',
  templateUrl: './corresp-out-update.component.html',
  styleUrls: ['./corresp-out-update.component.scss'],
})
export class CorrespOutUpdateComponent implements OnInit {
  isSaving = false;
  corresp!: ICorresp;

  isAdminOrBoc = false;

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
  // ── Message email fields (IMessage) ──────────────────────────────────────
  /** sender: auto-filled from current user's email — maps to IMessage.sender */
  msgSender: string = '';
  /** receiver: maps to IMessage.receiver */
  msgReceiver: string = '';
  /** copyTo: maps to IMessage.copyTo */
  msgCopyTo: string = '';

  currentUserFirstName: string = '';
  currentUserLastName: string = '';
  currentUserDepartementName: string = '';

  selectedModel: string | null = null;

  models: IModelNotif[] = [];
  loadingModels = false;
  selectedModelNotif: IModelNotif | null = null;
  showEmailPreviewModal = false;

  // Internal sender (org picker — replaces the old Destinataire org picker)
  expediteurCode: string = '';
  expediteurEmail: string = '';

  // correspType is fixed to 'Sortant' for this component
  correspType = 'Sortant';

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
  priorite = 'Normal';
  destinataire = '';
  destinataireLabel = '';
  dispatchType = '';
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
  loadingCorresps = false;

  showManualExpediteur = false;
  showManualContact: boolean = false;

  taskTree: DepartementTreeFeignDTO[] = [];
  loadingTree = false;
  selectedDept: DepartementTreeFeignDTO | null = null;
  objectKeys = Object.keys;
  treeSearchQuery = '';
  taskTreeFiltered: DepartementTreeFeignDTO[] = [];

  selectedDepartement: string = '';
  selectedDepartementName: string = '';
  selectedResponsables: { codeDept?: string | null; matriculePers?: string | null; displayName?: string | null }[] = [];
  expandedAffectations: Set<string> = new Set();
  expandedNodes: Set<number> = new Set();
  private levelPalette: string[] = ['#1e90ff', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6'];

  orgaList: any[] = [];
  selectedOrgaCode: string | null = null;

  recipientTree: DepartementTreeFeignDTO[] = [];
  recipientTreeFiltered: DepartementTreeFeignDTO[] = [];
  recipientLoadingTree = false;
  recipientSelectedDept: DepartementTreeFeignDTO | null = null;
  recipientTreeSearchQuery = '';
  recipientExpandedNodes: Set<number> = new Set();

  ccTree: DepartementTreeFeignDTO[] = [];
  ccTreeFiltered: DepartementTreeFeignDTO[] = [];
  ccLoadingTree = false;
  ccTreeSearchQuery = '';
  ccExpandedNodes: Set<number> = new Set();
  selectedCcDepts: IContactCopieCorresp[] = [];

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
    private scanSettingsService: ScanSettingsService,
    protected modelNotifService: ModelNotifService
  ) {}

  ngOnInit(): void {
    this.accountService.getAuthenticationState().subscribe(account => {
      if (account && account.authorities) {
        this.isAdminOrBoc = account.authorities.includes(Authority.ADMIN) || account.authorities.includes(Authority.BOC);
        this.msgSender = (account as any).email || (account as any).login || '';
        this.currentUserFirstName = (account as any).firstName || '';
        this.currentUserLastName = (account as any).lastName || '';

        const userId = (account as any)?.id;
        if (userId) {
          this.loadDefaultExpediteurFromUserDepartment(userId);
          this.createDefaultProcessingTask(account);
          this.loadModels();
        }
      }
    });

    this.typeDocumentService.findByCorrespType('Sortant').subscribe(res => {
      this.typedocuments = res.body || [];
      const autre: ITypedocument = {
        id: 0,
        nom: 'Autre',
        defautdest: null,
        defaultobject: null,
        defaultencopie: null,
        labelDD: null,
        labelDCC: null,
        usualstatus: null,
      };
      this.typedocuments.push(autre);
    });

    const today = new Date();
    this.date = today.toISOString().split('T')[0];
    const pastDate = new Date();
    pastDate.setDate(today.getDate() - 15);
    this.maxDate = today.toISOString().split('T')[0];
    this.minDate = pastDate.toISOString().split('T')[0];

    this.loadUsers();
    this.loadActiveCompanies();
    this.loadAllCorresps();
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

  responseSearchExpr = function (dataItem: ICorresp): string {
    return (
      (dataItem.subject ? dataItem.subject + ' ' : '') +
      (dataItem.reference ? dataItem.reference + ' ' : '') +
      (dataItem.idinstance ? dataItem.idinstance : '')
    );
  };

  corresps: ICorresp[] = [];

  loadActiveCompanies(): void {
    this.loadingCompanies = true;
    this.contactCompanyService.getActiveContactCompanies().subscribe({
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

  loadAllCorresps(): void {
    this.loadingCorresps = true;
    this.correspService.query({ page: 0, size: 1000, sort: ['subject,ASC'] }).subscribe({
      next: (res: HttpResponse<ICorresp[]>) => {
        this.corresps = res.body || [];
        this.loadingCorresps = false;
      },
      error: err => {
        console.error('Erreur chargement correspondances', err);
        this.corresps = [];
        this.loadingCorresps = false;
      },
    });
  }

  private loadDefaultExpediteurFromUserDepartment(userId: number): void {
    this.correspService.getDepartementAffectationsByUser(userId).subscribe({
      next: data => {
        const affectations = data || [];

        if (!affectations.length) return;

        // priorité à un département CHEF si présent dans le tableau 'types', sinon le premier
        const dept = affectations.find(a => a.types?.includes('CHEF')) || affectations[0];

        this.expediteur = dept.departementName || dept.departementCode || '';
        this.expediteurCode = dept.departementCode || '';
        this.expediteurEmail = dept.email || '';
        this.currentUserDepartementName = dept.departementName || dept.departementCode || '';
      },
      error: err => {
        console.error('Erreur chargement département utilisateur', err);
      },
    });
  }

  private createDefaultProcessingTask(account: any): void {
    const login = account.login || '';
    const name = [account.firstName, account.lastName].filter(Boolean).join(' ') || login;

    const taskData = {
      typeTask: 'traitement',
      responsable: login,
      dateLimite: '',
      responsableName: name,
      commentaire: '',
      autoBoc: true,
    };

    if (!this.tasks) {
      this.tasks = [];
    }

    // On n'ajoute la tâche que si elle n'existe pas déjà
    const exists = this.tasks.some(t => t.typeTask === 'traitement' && t.responsable === login && t.autoBoc);
    if (!exists) {
      this.tasks.push(taskData);
    }
  }

  onExpediteurChange(companyId: number | null | string): void {
    const id = companyId !== null && companyId !== undefined && companyId !== '' ? Number(companyId) : null;
    this.selectedCompanyId = id;
    this.personsForSelectedCompany = [];
    this.selectedPersonId = null;
    this.contactEmail = '';
    this.contactEmailLabel = '';

    if (id) {
      const company = this.companies.find(c => c.id === id);
      this.expediteur = company ? company.nom || '' : '';
      this.destinataireLabel = company ? company.nom || '' : ''; // ← AJOUT
    } else {
      if (!this.showManualExpediteur) {
        this.expediteur = '';
        this.destinataireLabel = ''; // ← AJOUT
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
      // If person has email, use it as receiver
      if (p.email) this.msgReceiver = p.email;
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
      this.destinataireLabel = ''; // ← AJOUT
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

  onRecipientOrCcChange(): void {
    this.syncDefaultTaskNames();
  }

  private syncDefaultTaskNames(): void {
    if (!this.tasks || this.tasks.length === 0) return;
    this.tasks = this.tasks.map(t => {
      if (t.typeTask === 'traitement' && !t.autoBoc) {
        return { ...t, responsableName: this.destinataireLabel || t.responsableName || '' };
      }
      return t;
    });
  }

  onTypeDocumentChange(): void {
    if (!this.selectedTypeDocument) {
      this.objet = '';
      return;
    }

    this.objet = this.selectedTypeDocument.defaultobject || '';

    if (this.selectedTypeDocument.nom === 'Autre') {
      this.tasks = this.tasks.filter(t => t.autoBoc === true);
    }
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
    // try { this.editForm?.controls?.responseTo?.setValue(this.reponseSur); } catch(e) {}
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
  }

  // --------------------------------------------------------------------------
  // Upload helpers
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
          if (!this.accordionStates['pieces']) this.accordionStates['pieces'] = true;
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
        if (link) this.removeFile(link.index);
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
    if (index === undefined || index < 0 || index >= this.uploadedFiles.length) return;
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
        next: () => this.performFileRemoval(index, link.uniqueName),
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
  // Generate reference then save
  // --------------------------------------------------------------------------
  generateReference(): void {
    this.validationInfoGenErrors = {};
    if (!this.validateInfoGeneralesForm()) {
      this.showNotification("Veuillez remplir tous les champs obligatoires avant d'identifier", 'error');
      return;
    }

    this.isGeneratingReference = true;
    this.parentClassdefService.getNextNumber(CorrespType.OUTGOING as unknown as string).subscribe({
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
  // Save
  // --------------------------------------------------------------------------
  saveCorresp(withReference?: boolean, navigateToDetail?: boolean): void {
    if (this.isSaving) return;
    this.validationInfoGenErrors = {};
    if (!this.validateInfoGeneralesForm()) return;

    this.isSaving = true;
    this.tasksToSave = [];

    if (!this.corresp) this.corresp = {} as ICorresp;

    this.corresp!.courrierDate = dayjs(this.date);
    this.corresp!.subject = this.objet;
    this.corresp!.sender = this.expediteur;
    this.corresp!.contact = this.destinataire;
    this.corresp!.labelDestinataire = this.destinataireLabel;
    this.corresp!.contactEmail = this.contactEmail;
    this.corresp!.labelContactCC = this.contactEmailCCLabel;
    this.corresp!.contactCopies = this.selectedCcDepts.length > 0 ? [...this.selectedCcDepts] : null;
    this.corresp!.responseTo = this.reponseSur;
    this.corresp!.senderReference = this.referenceEmetteur;
    this.corresp!.priority = this.priorite === 'Prioritaire';
    this.corresp!.body = this.htmlContent;
    this.corresp!.dispatchType = (this.dispatchType as DispatchType) || DispatchType.LETTER;
    // Always Sortant
    this.corresp!.corresptype = CorrespType.OUTGOING;

    this.tasks.forEach(t => {
      const taskModel: ITasks = {} as ITasks;
      taskModel.responsible = t.responsable;
      taskModel.dueDate = dayjs(t.dateLimite);
      taskModel.taskType = t.typeTask;
      taskModel.commentaire = t.commentaire;
      if (t.autoBoc) {
        taskModel.responsables = [{ matriculePers: t.responsable }];
      } else if (t.responsable) {
        taskModel.responsables = [{ codeDept: t.responsable }];
      }
      this.tasksToSave.push(taskModel);
    });

    if (this.generatedReference) this.corresp!.reference = this.generatedReference;

    this.correspService
      .saveCorrespWithTasksAndPj(this.corresp, this.tasksToSave, this.pjsToSave, this.selectedTypeDocument, false)
      .subscribe({
        next: (savedCorresp: any) => {
          this.isSaving = false;

          // ── Persister le message email si un modèle et un destinataire sont définis ──
          if (savedCorresp?.id && (this.msgReceiver || this.msgCopyTo)) {
            this.persistEmailMessage(savedCorresp.id);
          }

          if (savedCorresp?.id) {
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

  private persistEmailMessage(correspId: number): void {
    const message: NewMessage = {
      id: null,
      sender: this.msgSender || this.expediteurEmail || null,
      receiver: this.msgReceiver || null,
      copyTo: this.msgCopyTo || null,
      blindCopyTo: null,
      path: null,
      msgID: null,
      parentID: null,
      inReplyTo: null,
      type: this.selectedModelNotif?.name || null,
      etat: 'PENDING',
      correspId: correspId,
      fileId: null,
      uniqueName: null,
      createdBy: this.msgSender || null,
      creationDate: null,
      updatedBy: null,
      updatedDate: null,
    };

    this.correspService.createMessage(message).subscribe({
      next: () => {
        console.log('Message email persisté avec succès');
      },
      error: err => {
        console.error('Erreur lors de la persistance du message email', err);
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
    if (!this.expediteur?.trim()) {
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
  // Tasks
  // --------------------------------------------------------------------------
  saveTask(): void {
    this.validationErrors = {};
    if (!this.validateForm()) return;

    const selections = this.selectedResponsables || [];
    if (selections.length > 0) {
      const createdItems: Array<{ typeTask: string; responsable: any; dateLimite: string; responsableName: string; commentaire: string }> =
        [];
      for (const sel of selections) {
        const codeOrMatricule = sel.matriculePers ? sel.matriculePers : sel.codeDept || '';
        const displayLabel = sel.displayName || codeOrMatricule;
        createdItems.push({
          typeTask: this.selectedType,
          responsable: codeOrMatricule,
          dateLimite: this.dateLimite,
          responsableName: displayLabel,
          commentaire: this.commentaire,
        });
      }
      if (this.isEditMode && this.editingTaskIndex !== null && createdItems.length === 1) {
        this.tasks[this.editingTaskIndex] = createdItems[0];
      } else {
        for (const td of createdItems) this.tasks.push(td);
      }
    } else {
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
    if (!this.accordionStates['taches']) this.accordionStates['taches'] = true;
  }

  resetForm(): void {
    this.selectedType = '';
    this.commentaire = '';
    this.validationErrors = {};
    this.dateLimite = '';
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
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
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

  openTasksModal(content: any, taskIndex?: number): void {
    if (taskIndex !== undefined && taskIndex !== null) {
      this.isEditMode = true;
      this.editingTaskIndex = taskIndex;
      const task = this.tasks[taskIndex];
      this.selectedType = task.typeTask;
      this.commentaire = task.commentaire;
      this.dateLimite = task.dateLimite;
      this.selectedDepartement = task.responsable || '';
      this.selectedDepartementName = task.responsableName || '';
    } else {
      this.isEditMode = false;
      this.editingTaskIndex = null;
      this.resetForm();
    }
    this.prepareAndLoadOrgaThenTree();
    this.modalService.open(content, { size: 'xl' });
  }

  openRecipientModal(content: any): void {
    if (!this.selectedTypeDocument) return;
    this.prepareAndLoadOrgaThenRecipientTree();
    this.modalService.open(content, { size: 'xl' });
  }

  private prepareAndLoadOrgaThenTree(): void {
    if (this.selectedOrgaCode) {
      this.loadTreeForModal(this.selectedOrgaCode);
      return;
    }
    this.correspService.queryOrga().subscribe({
      next: (res: HttpResponse<any[]>) => {
        this.orgaList = res.body || [];
        const first = this.orgaList?.[0];
        if (first) this.selectedOrgaCode = first.code ?? first.orgaCode ?? first.id?.toString() ?? null;
        if (this.selectedOrgaCode) this.loadTreeForModal(this.selectedOrgaCode);
        else this.taskTree = [];
      },
      error: () => {
        this.taskTree = [];
      },
    });
  }

  private prepareAndLoadOrgaThenRecipientTree(): void {
    if (this.selectedOrgaCode) {
      this.loadRecipientTreeForModal(this.selectedOrgaCode);
      return;
    }
    this.correspService.queryOrga().subscribe({
      next: (res: HttpResponse<any[]>) => {
        this.orgaList = res.body || [];
        const first = this.orgaList?.[0];
        if (first) this.selectedOrgaCode = first.code ?? first.orgaCode ?? first.id?.toString() ?? null;
        if (this.selectedOrgaCode) this.loadRecipientTreeForModal(this.selectedOrgaCode);
        else {
          this.recipientTree = [];
          this.recipientTreeFiltered = [];
        }
      },
      error: () => {
        this.recipientTree = [];
        this.recipientTreeFiltered = [];
      },
    });
  }

  loadTreeForModal(orgaCode: string): void {
    if (!orgaCode) {
      this.taskTree = [];
      this.taskTreeFiltered = [];
      return;
    }
    this.loadingTree = true;
    this.correspService.getDepartementHierarchyByOrganigramme(orgaCode).subscribe({
      next: (res: HttpResponse<DepartementTreeFeignDTO[]>) => {
        this.taskTree = this.normalizeTree(res.body || []);
        this.taskTreeFiltered = this.taskTree;
        this.loadingTree = false;
      },
      error: () => {
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
        this.recipientTree = this.normalizeTree(res.body || []);
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

  private normalizeTree(nodes?: DepartementTreeFeignDTO[] | null): DepartementTreeFeignDTO[] {
    if (!nodes) return [];
    return nodes.map(n => this.normalizeNode(n));
  }

  private normalizeNode(node: DepartementTreeFeignDTO): DepartementTreeFeignDTO {
    const children = node.children && Array.isArray(node.children) ? node.children.map(c => this.normalizeNode(c)) : [];
    const rawAff = (node as any).affectationsByType || {};
    const affs: Partial<Record<TypeAffectation, PersonneFeignDTO[]>> = {};
    Object.keys(rawAff).forEach(k => {
      if ((Object.values(TypeAffectation) as string[]).includes(k)) {
        affs[k as TypeAffectation] = (rawAff as any)[k] ?? [];
      } else {
        affs.MEMBRE = ((affs.MEMBRE || []) as PersonneFeignDTO[]).concat((rawAff as any)[k] || []);
      }
    });
    (Object.values(TypeAffectation) as TypeAffectation[]).forEach(t => {
      affs[t] = affs[t] || [];
    });
    return { ...node, children, affectationsByType: affs };
  }

  onSelectDept(node: DepartementTreeFeignDTO): void {
    this.selectedDept = node;
    this.selectedDepartement = node.code ?? '';
    this.selectedDepartementName = node.nom ?? '';
  }

  getResponsablesForNode(node: DepartementTreeFeignDTO): string {
    if (!node || !node.affectationsByType) return '';
    const chefs = (node.affectationsByType['CHEF'] || []).map((p: any) => p.nomPrenom).filter(Boolean);
    const membres = (node.affectationsByType['MEMBRE'] || []).map((p: any) => p.nomPrenom).filter(Boolean);
    if (chefs.length) return chefs.join(', ');
    if (membres.length) return membres.join(', ');
    return '';
  }

  toggleAffectation(nodeId: number, type: string): void {
    const key = `${nodeId}-${type}`;
    if (this.expandedAffectations.has(key)) this.expandedAffectations.delete(key);
    else this.expandedAffectations.add(key);
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
    if (idx >= 0) this.selectedResponsables.splice(idx, 1);
    else this.selectedResponsables.push({ codeDept: code, displayName: node.nom ?? code });
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
    if (idx >= 0) this.selectedResponsables.splice(idx, 1);
    else this.selectedResponsables.push({ codeDept: code || null, matriculePers: matricule, displayName: person.nomPrenom ?? matricule });
  }

  isPersonSelected(node: DepartementTreeFeignDTO, person: PersonneFeignDTO): boolean {
    const code = node.code ?? '';
    const matricule = person.matricule ?? '';
    return !!this.selectedResponsables.find(r => r.matriculePers === matricule && r.codeDept === code);
  }

  toggleNodeExpand(nodeId: number): void {
    if (this.expandedNodes.has(nodeId)) this.expandedNodes.delete(nodeId);
    else this.expandedNodes.add(nodeId);
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
    if (idx >= 0) this.selectedResponsables.splice(idx, 1);
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
    const filteredChildren = (node.children || []).map(c => this.filterNode(c, q)).filter((c): c is DepartementTreeFeignDTO => c !== null);
    const aff = node.affectationsByType || {};
    const filteredAff: Partial<Record<TypeAffectation, PersonneFeignDTO[]>> = {};
    let personMatches = false;
    Object.keys(aff as any).forEach(k => {
      const list = ((aff as any)[k] as PersonneFeignDTO[]) || [];
      const flist = list.filter(p => (p.nomPrenom || '').toLowerCase().includes(q));
      if (flist.length) personMatches = true;
      filteredAff[k as TypeAffectation] = flist;
    });
    if (!deptMatches && !personMatches && filteredChildren.length === 0) return null;
    return { ...node, children: filteredChildren, affectationsByType: filteredAff };
  }

  private applyAutoExpand(nodes: DepartementTreeFeignDTO[]): void {
    const visit = (n: DepartementTreeFeignDTO): void => {
      const children = n.children || [];
      if (children.length > 0) this.expandedNodes.add(n.id);
      Object.keys(n.affectationsByType || {}).forEach(t => {
        const list = ((n.affectationsByType as any)[t] as PersonneFeignDTO[]) || [];
        if (list.length > 0) this.expandedAffectations.add(`${n.id}-${t}`);
      });
      children.forEach(c => visit(c));
    };
    nodes.forEach(n => visit(n));
  }

  onRecipientTreeSearchChange(): void {
    const q = (this.recipientTreeSearchQuery || '').trim().toLowerCase();
    if (!q) {
      this.recipientTreeFiltered = this.recipientTree;
      return;
    }
    this.recipientTreeFiltered = this.filterTree(this.recipientTree, q);
    const visit = (n: DepartementTreeFeignDTO): void => {
      if ((n.children || []).length > 0) this.recipientExpandedNodes.add(n.id);
      (n.children || []).forEach(c => visit(c));
    };
    this.recipientTreeFiltered.forEach(n => visit(n));
  }

  toggleRecipientNodeExpand(nodeId: number): void {
    if (this.recipientExpandedNodes.has(nodeId)) this.recipientExpandedNodes.delete(nodeId);
    else this.recipientExpandedNodes.add(nodeId);
  }

  isRecipientNodeExpanded(nodeId: number): boolean {
    return this.recipientExpandedNodes.has(nodeId);
  }

  onSelectRecipientDept(node: DepartementTreeFeignDTO): void {
    this.recipientSelectedDept = node;
  }

  confirmRecipientSelection(modalRef: any): void {
    if (!this.recipientSelectedDept) return;
    this.destinataireLabel = this.recipientSelectedDept.nom || '';
    this.destinataire = this.recipientSelectedDept.email || '';
    const existingIdx = this.tasks.findIndex(t => t.typeTask === 'traitement' && !t.autoBoc);
    const newTaskData = {
      typeTask: 'traitement',
      responsable: this.recipientSelectedDept.code ?? '',
      dateLimite: existingIdx >= 0 ? this.tasks[existingIdx].dateLimite : '',
      responsableName: this.recipientSelectedDept.nom ?? '',
      commentaire: existingIdx >= 0 ? this.tasks[existingIdx].commentaire : '',
    };
    if (existingIdx >= 0) this.tasks[existingIdx] = newTaskData;
    else this.tasks.push(newTaskData);
    this.onRecipientOrCcChange();
    modalRef.close();
  }

  selectRecipientDept(node: DepartementTreeFeignDTO, modalRef: any): void {
    this.recipientSelectedDept = node;
    this.destinataireLabel = node.nom || '';
    this.destinataire = node.email || '';
    const existingIdx = this.tasks.findIndex(t => t.typeTask === 'traitement' && !t.autoBoc);
    const newTaskData = {
      typeTask: 'traitement',
      responsable: node.code ?? '',
      dateLimite: existingIdx >= 0 ? this.tasks[existingIdx].dateLimite : '',
      responsableName: node.nom ?? '',
      commentaire: existingIdx >= 0 ? this.tasks[existingIdx].commentaire : '',
    };
    if (existingIdx >= 0) this.tasks[existingIdx] = newTaskData;
    else this.tasks.push(newTaskData);
    this.onRecipientOrCcChange();
    modalRef.close();
  }

  clearRecipientDept(): void {
    this.recipientSelectedDept = null;
    this.destinataireLabel = '';
    this.destinataire = '';
    const idx = this.tasks.findIndex(t => t.typeTask === 'traitement' && !t.autoBoc);
    if (idx >= 0) this.tasks.splice(idx, 1);
    this.onRecipientOrCcChange();
  }

  // --------------------------------------------------------------------------
  // CC Modal
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
    this.correspService.queryOrga().subscribe({
      next: (res: HttpResponse<any[]>) => {
        this.orgaList = res.body || [];
        const first = this.orgaList?.[0];
        if (first) this.selectedOrgaCode = first.code ?? first.orgaCode ?? first.id?.toString() ?? null;
        if (this.selectedOrgaCode) this.loadCcTreeForModal(this.selectedOrgaCode);
        else {
          this.ccTree = [];
          this.ccTreeFiltered = [];
        }
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
        this.ccTree = this.normalizeTree(res.body || []);
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
    const visit = (n: DepartementTreeFeignDTO): void => {
      if ((n.children || []).length > 0) this.ccExpandedNodes.add(n.id);
      (n.children || []).forEach(c => visit(c));
    };
    this.ccTreeFiltered.forEach(n => visit(n));
  }

  toggleCcNodeExpand(nodeId: number): void {
    if (this.ccExpandedNodes.has(nodeId)) this.ccExpandedNodes.delete(nodeId);
    else this.ccExpandedNodes.add(nodeId);
  }

  isCcNodeExpanded(nodeId: number): boolean {
    return this.ccExpandedNodes.has(nodeId);
  }

  toggleCcDeptSelection(node: DepartementTreeFeignDTO): void {
    const code = node.code ?? '';
    if (!code) return;
    const idx = this.selectedCcDepts.findIndex(d => d.codeDept === code);
    if (idx >= 0) this.selectedCcDepts.splice(idx, 1);
    else this.selectedCcDepts.push({ idDept: node.id, codeDept: code, nomDept: node.nom ?? code, emailDept: node.email ?? '' });
    this.updateCcLabelsFromSelection();
  }

  isCcDeptSelected(node: DepartementTreeFeignDTO): boolean {
    const code = node.code ?? '';
    return !!this.selectedCcDepts.find(d => d.codeDept === code);
  }

  removeCcDept(cc: IContactCopieCorresp): void {
    const idx = this.selectedCcDepts.findIndex(d => d.codeDept === cc.codeDept);
    if (idx >= 0) this.selectedCcDepts.splice(idx, 1);
    const taskIdx = this.tasks.findIndex(t => t.typeTask === 'lecture' && t.responsable === cc.codeDept);
    if (taskIdx >= 0) this.tasks.splice(taskIdx, 1);
    this.updateCcLabelsFromSelection();
  }

  clearCcSelections(): void {
    this.selectedCcDepts = [];
    this.tasks = this.tasks.filter(t => t.typeTask !== 'lecture');
    this.updateCcLabelsFromSelection();
  }

  // ── Internal Sender Modal (Expéditeur via org) ────────────────────────────
  openSenderModal(content: any): void {
    if (!this.selectedTypeDocument) return;
    this.prepareAndLoadOrgaThenRecipientTree();
    this.modalService.open(content, { size: 'xl' });
  }

  selectSenderDept(node: DepartementTreeFeignDTO, modalRef: any): void {
    this.recipientSelectedDept = node;
    this.expediteur = node.nom || '';
    this.expediteurCode = node.code || '';
    this.expediteurEmail = node.email || '';
    modalRef.close();
  }

  clearSenderDept(): void {
    this.recipientSelectedDept = null;
    this.expediteur = '';
    this.expediteurCode = '';
    this.expediteurEmail = '';
  }

  confirmCcSelection(modalRef: any): void {
    this.updateCcLabelsFromSelection();
    this.syncCcTasks();
    this.onRecipientOrCcChange();
    // auto-populate msgCopyTo from CC dept emails
    this.msgCopyTo = this.selectedCcDepts
      .map(d => d.emailDept || '')
      .filter(Boolean)
      .join(', ');
    modalRef.close();
  }

  private syncCcTasks(): void {
    this.tasks = this.tasks.filter(t => t.typeTask !== 'lecture');
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
  // Users
  // --------------------------------------------------------------------------
  loadUsers(): void {
    this.userService.query({ page: 0, size: 1000, sort: ['firstName,ASC'] }).subscribe((res: HttpResponse<IUser[]>) => {
      this.users = res.body || [];
    });
  }

  // --------------------------------------------------------------------------
  // Misc
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

  toggleAccordion(section: string): void {
    this.accordionStates[section] = !this.accordionStates[section];
  }

  loadModels(): void {
    this.loadingModels = true;
    this.modelNotifService.query({ page: 0, size: 1000, sort: ['name,ASC'] }).subscribe({
      next: (res: HttpResponse<IModelNotif[]>) => {
        this.models = res.body || [];
        this.loadingModels = false;
      },
      error: err => {
        console.error('Erreur chargement modèles', err);
        this.models = [];
        this.loadingModels = false;
      },
    });
  }

  onModelChange(): void {
    // Ne rien faire — le modèle est utilisé uniquement pour la prévisualisation
  }

  // ── PjCare scan ──────────────────────────────────────────────────────────
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
  currentDocumentPages: ScannedPage[] = [];
  private _pendingDriverFromCookie: string = '';

  openScanModal(content: any): void {
    this.scanPreview = null;
    this.scanError = null;
    this.isMerging = false;
    this.currentDocumentPages = [];
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
    this._pendingDriverFromCookie = s.selectedDriver;
  }

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
              const cookieDriver = this._pendingDriverFromCookie;
              const cookieDriverExists = cookieDriver ? this.availableDrivers.some(d => d.key === cookieDriver) : false;
              this.selectedDriver = (cookieDriverExists ? cookieDriver : defaultKey) as ScanDriver;
              this._pendingDriverFromCookie = '';
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
        if (this.scanners.length > 0) this.selectedScanner = this.scanners[0];
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
            this.currentDocumentPages.push({
              data: result.data,
              format: result.format || this.scanFormat,
              preview,
              pageNumber: this.currentDocumentPages.length + 1,
            });
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

  removePage(index: number): void {
    this.currentDocumentPages.splice(index, 1);
    this.currentDocumentPages.forEach((p, i) => (p.pageNumber = i + 1));
    if (this.currentDocumentPages.length === 0) this.scanPreview = null;
  }

  openEmailPreview(): void {
    if (!this.selectedModelNotif) return;
    this.showEmailPreviewModal = true;
  }

  closeEmailPreview(): void {
    this.showEmailPreviewModal = false;
  }

  getEmailPreviewHtml(): string {
    if (!this.selectedModelNotif) return '';

    const model = this.selectedModelNotif;
    const toValue = this.msgReceiver || model.recepientEmailFormule || '';
    const ccValue = this.msgCopyTo || '';
    const subject = model.subjectFormula || '';
    const sender = model.senderEmailFormule || this.msgSender || '';

    // Traitement du contenu du modèle avec les marqueurs
    let modelContent = model.content || '';

    // 1. Remplacer [CORPS_CORRESP] par le corps saisi dans l'éditeur
    const userBody = this.htmlContent || '';
    modelContent = modelContent.replace('[CORPS_CORRESP]', userBody ? `${userBody}<br>` : '');

    // 2. Remplacer [br] par un vrai saut de ligne HTML
    modelContent = modelContent.replace(/\[br\]/g, '<br>');

    // 3. Remplacer les marqueurs de signature
    const fullName = [this.currentUserFirstName, this.currentUserLastName].filter(Boolean).join(' ') || this.msgSender || '';
    modelContent = modelContent.replace('[Votre nom]', `<strong>${fullName}</strong>`);
    modelContent = modelContent.replace(
      '[Votre département]',
      this.currentUserDepartementName ? `<strong>${this.currentUserDepartementName}</strong>` : ''
    );
    modelContent = modelContent.replace('[Votre téléphone]', '');

    // 4. Remplacer [signature] par un séparateur visuel
    modelContent = modelContent.replace('[signature]', '<hr style="border:none;border-top:1px solid #e2e8f0;margin:12px 0;">');

    // Noms des pièces jointes
    const attachmentNames = this.uploadedFiles.map(f => f.name);

    return this.buildEmailHtml({
      to: toValue,
      cc: ccValue,
      subject,
      sender,
      body: modelContent,
      attachments: attachmentNames,
      recipientFormule: model.recepientEmailFormule || '',
    });
  }

  private buildEmailHtml(data: {
    to: string;
    cc: string;
    subject: string;
    sender: string;
    body: string;
    attachments: string[];
    recipientFormule: string;
  }): string {
    const attachmentsHtml =
      data.attachments.length > 0
        ? `<div style="margin-top:16px;padding:10px 14px;background:#f1f5f9;border-radius:6px;border:1px solid #e2e8f0;">
        <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">📎 Pièces jointes</p>
        ${data.attachments
          .map(
            name =>
              `<span style="display:inline-block;background:#fff;border:1px solid #cbd5e1;border-radius:4px;padding:2px 10px;font-size:12px;color:#374151;margin:2px 4px 2px 0;">📄 ${name}</span>`
          )
          .join('')}
      </div>`
        : '';

    return `
    <div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
      <!-- Header -->
      <div style="background:#1e40af;padding:16px 20px;">
        <p style="margin:0;font-size:18px;font-weight:700;color:#fff;">📧 ${data.subject || '(Sans objet)'}</p>
      </div>

      <!-- Meta -->
      <div style="padding:14px 20px;background:#f8fafc;border-bottom:1px solid #e2e8f0;">
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <tr>
            <td style="padding:4px 0;color:#64748b;width:60px;font-weight:600;">De :</td>
            <td style="padding:4px 0;color:#1e293b;">${data.sender}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#64748b;font-weight:600;">À :</td>
            <td style="padding:4px 0;color:#1e293b;">
              ${data.recipientFormule ? `<span style="color:#64748b;margin-right:6px;">${data.recipientFormule}</span>` : ''}
              ${data.to ? `<span style="color:#1e40af;">${data.to}</span>` : ''}
            </td>
          </tr>
          ${
            data.cc
              ? `<tr>
            <td style="padding:4px 0;color:#64748b;font-weight:600;">CC :</td>
            <td style="padding:4px 0;color:#1e40af;">${data.cc}</td>
          </tr>`
              : ''
          }
        </table>
      </div>

      <!-- Body -->
      <div style="padding:20px;font-size:14px;line-height:1.7;color:#1e293b;background:#fff;">
        ${data.body}
      </div>

      ${attachmentsHtml}
    </div>
  `;
  }

  attachScanResult(modal: any): void {
    if (this.currentDocumentPages.length === 0) return;
    if (this.currentDocumentPages.length === 1) {
      const p = this.currentDocumentPages[0];
      const filename = this.objet ? `${this.objet.replace(/[^\p{L}\p{N}_-]/gu, '_')}.${this.scanFormat}` : `scan.${this.scanFormat}`;
      this._attachRawResult(p.data, filename, this.scanFormat, modal);
      return;
    }
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
          if (result.status === 200) this._attachRawResult(result.data, result.file, result.format, modal);
          else this.scanError = result.error || 'Erreur lors de la fusion des pages';
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

  protected readonly CorrespType = CorrespType;
  protected readonly CorrespStatus = CorrespStatus;
}
