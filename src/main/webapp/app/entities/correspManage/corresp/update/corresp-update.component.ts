import { Component, OnInit } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { CorrespFormService, CorrespFormGroup } from './corresp-form.service';
import { ICorresp } from '../corresp.model';
import { CorrespService } from '../service/corresp.service';
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
import { NgForm } from '@angular/forms';

import dayjs from 'dayjs/esm';
import { ITypedocument } from '../../../configManage/typedocument/typedocument.model';
import { TypedocumentService } from '../../../configManage/typedocument/service/typedocument.service';
import { IDepartement } from '../../../orgacare/departement/departement.model';

import { ContactCompanyService } from 'app/entities/configManage/contact-company/service/contact-company.service';
import { IContactCompany } from 'app/entities/configManage/contact-company/contact-company.model';
import { IPersonCompany } from 'app/entities/configManage/person-company/person-company.model';

// <-- NEW: import du DTO de l'arbre (vérifie le chemin si besoin)
import { DepartementTreeFeignDTO } from './DepartementTreeFeignDTO';
import { PersonneFeignDTO } from './PersonneFeignDTO';
import { TypeAffectation } from 'app/entities/correspManage/corresp/update/enums';

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

  tasksToSave: ITasks[] = [];
  pjsToSave: IPj[] = [];
  notificationMessage: string | null = null;
  notificationType: 'success' | 'error' | null = null;

  fileLinks: FileIndexLink[] = [];
  uploadProgress: Map<string, number> = new Map();
  isUploading = false;

  htmlContent: string = 'Ajouter Votre Contenu !';

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

  correspsWithReference: ICorresp[] = [];
  selectedCorrespReference: string | null = null; // stocke la reference sélectionnée (facultatif)
  loadingCorrespsWithRef = false;

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

  tasks: Array<{ typeTask: string; responsable: any; dateLimite: string; responsableName: string; commentaire: string }> = [];

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
  loadingCorresps = false;

  showManualExpediteur = false;
  showManualContact: boolean = false;

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
    protected contactCompanyService: ContactCompanyService
  ) {}

  // --------------------------------------------------------------------------
  // ngOnInit
  // --------------------------------------------------------------------------
  ngOnInit(): void {
    // charger types de documents
    this.typeDocumentService.query({ page: 0, size: 1000 }).subscribe(res => {
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

    this.route.queryParams.subscribe(params => {
      this.correspType = params['type'];
    });

    this.loadUsers();
    this.loadActiveCompanies();
    this.loadAllCorresps();
    this.loadCorrespsWithReferenceList();
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

  onRecipientOrCcChange(): void {
    this.syncDefaultTaskNames();
  }

  private syncDefaultTaskNames(): void {
    if (!this.tasks || this.tasks.length === 0) {
      return;
    }
    this.tasks = this.tasks.map(t => {
      if (t.typeTask === 'traitement') {
        return { ...t, responsableName: this.destinataireLabel || t.responsableName || '' };
      }
      if (t.typeTask === 'lecture') {
        return { ...t, responsableName: this.contactEmailCCLabel || t.responsableName || '' };
      }
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
      return;
    }

    this.objet = this.selectedTypeDocument.defaultobject || '';

    if (this.selectedTypeDocument.nom === 'Autre') {
      this.tasks = [];
    }

    if (this.selectedTypeDocument.defautdest) {
      this.tasks = [];

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
      this.correspService.queryOrgaDepsByCode({ code: this.selectedTypeDocument.defaultencopie }).subscribe({
        next: (res: HttpResponse<IDepartement>) => {
          if (res.body) {
            this.contactEmailCC = res.body.email || '';
            this.contactEmailCCLabel = res.body.nom || '';

            const taskData = {
              typeTask: 'lecture',
              responsable: res.body.code ?? '',
              dateLimite: '',
              responsableName: res.body.nom ?? '',
              commentaire: '',
            };

            this.tasks.push(taskData);
            this.syncDefaultTaskNames();
          } else {
            this.contactEmailCC = '';
            this.contactEmailCCLabel = '';
          }
        },
        error: () => {
          this.contactEmailCC = '';
          this.contactEmailCCLabel = '';
        },
      });
    } else {
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

  loadCorrespsWithReferenceList(): void {
    this.loadingCorrespsWithRef = true;
    // utilise le service que nous avons ajouté précédemment
    this.correspService.getAllWithReferenceList().subscribe({
      next: (res: HttpResponse<ICorresp[]>) => {
        this.correspsWithReference = res.body || [];
        this.loadingCorrespsWithRef = false;
      },
      error: err => {
        console.error('Erreur chargement corresps with reference', err);
        this.correspsWithReference = [];
        this.loadingCorrespsWithRef = false;
      },
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
  // Save correspondance (unchanged)
  // --------------------------------------------------------------------------
  saveCorresp(withReference: boolean): void {
    this.validationInfoGenErrors = {};

    if (!this.validateInfoGeneralesForm()) {
      return;
    }

    if (!this.corresp) {
      this.corresp = {} as ICorresp;
    }

    this.corresp!.courrierDate = dayjs(this.date);
    this.corresp!.subject = this.objet;
    this.corresp!.sender = this.expediteur;
    this.corresp!.contact = this.destinataire;
    this.corresp!.labelDestinataire = this.destinataireLabel;
    this.corresp!.contactEmail = this.contactEmail;
    this.corresp!.labelContactCC = this.contactEmailCCLabel;
    this.corresp!.responseTo = this.reponseSur;
    this.corresp!.senderReference = this.referenceEmetteur;
    this.corresp!.priority = this.priorite === 'Prioritaire';
    this.corresp!.body = this.htmlContent;

    this.corresp!.dispatchType = (this.dispatchType as DispatchType) || DispatchType.EMAIL;

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
      this.tasksToSave.push(taskModel);
    });

    this.correspService
      .saveCorrespWithTasksAndPj(this.corresp, this.tasksToSave, this.pjsToSave, this.selectedTypeDocument, withReference)
      .subscribe((res: any) => {
        if (!withReference) {
          this.router.navigate(['/corresp']);
          return;
        }
        const body: any = res && res.body ? res.body : res;
        if (body && typeof body === 'object') {
          this.corresp = body as ICorresp;
        }
        const ref = body && body.reference ? ` Référence: ${body.reference}` : '';
        this.showNotification(`Correspondance identifiée.${ref}`, 'success');
      });
  }

  validateInfoGeneralesForm(): boolean {
    let isValid = true;
    this.validationInfoGenErrors = {};

    if (!this.objet?.trim()) {
      this.validationInfoGenErrors['objet'] = "L'objet est obligatoire";
      isValid = false;
    }

    if (!this.selectedCompanyId && !this.expediteur?.trim()) {
      this.validationInfoGenErrors['expediteur'] = "L'expéditeur est obligatoire";
      isValid = false;
    }

    if (!this.date) {
      this.validationInfoGenErrors['date'] = 'La date est obligatoire';
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

    const responsibleText = this.getResponsablesSummary() || this.selectedDepartement || '';
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

  private prepareAndLoadOrgaThenTree(): void {
    // Si on a déjà un orgaCode sélectionné, on le charge directement
    if (this.selectedOrgaCode) {
      this.loadTreeForModal(this.selectedOrgaCode);
      return;
    }

    // Sinon on demande la liste des organigrammes puis on charge le premier
    this.correspService.queryOrga().subscribe({
      next: (res: HttpResponse<any[]>) => {
        this.orgaList = res.body || [];
        // essayer de récupérer un code dans plusieurs schémas possibles
        const first = this.orgaList?.[0];
        if (first) {
          this.selectedOrgaCode = first.code ?? first.orgaCode ?? first.id?.toString() ?? null;
        }
        if (this.selectedOrgaCode) {
          this.loadTreeForModal(this.selectedOrgaCode);
        } else {
          // fallback : optionally load a default code
          console.warn('Aucun organigramme trouvé pour charger l’arbre.');
          this.taskTree = [];
        }
      },
      error: err => {
        console.error('Erreur récupération organigrammes', err);
        this.taskTree = [];
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

  // --------------------------------------------------------------------------
  // Users load
  // --------------------------------------------------------------------------
  loadUsers(): void {
    this.userService.query({ page: 0, size: 1000, sort: ['firstName,ASC'] }).subscribe((res: HttpResponse<IUser[]>) => {
      this.users = res.body || [];
    });
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

  protected readonly console = console;
  protected readonly CorrespType = CorrespType;
  protected readonly CorrespStatus = CorrespStatus;
}
