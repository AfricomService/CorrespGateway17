import { Component, OnInit } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, switchMap } from 'rxjs';
import { finalize, map, tap } from 'rxjs/operators';

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
import { IOrga } from '../orga';
import { DepartementTreeFeignDTO } from './DepartementTreeFeignDTO';
import { IDepartement } from '../../../orgacare/departement/departement.model';

import { ContactCompanyService } from 'app/entities/configManage/contact-company/service/contact-company.service';
import { IContactCompany } from 'app/entities/configManage/contact-company/contact-company.model';
import { IPersonCompany } from 'app/entities/configManage/person-company/person-company.model';

// ============================================================================
// 🟠 INTERFACE: FileIndexLink
// ----------------------------------------------------------------------------
// Used to maintain a mapping between a file's index in the local array
// and its uniqueName generated during upload.
// ============================================================================
interface FileIndexLink {
  index: number;
  uniqueName: string;
}

// ============================================================================
// 🟣 COMPONENT: CorrespUpdateComponent
// ----------------------------------------------------------------------------
// Main component class handling the full lifecycle of creating/updating a
// correspondence (Corresp), including file uploads, tasks, validation,
// and saving.
//
// Template: corresp-update.component.html
// Styles:   corresp-update.scss
// ============================================================================
@Component({
  selector: 'jhi-corresp-update',
  templateUrl: './corresp-update.component.html',
  styleUrls: ['corresp-update.scss'],
})
export class CorrespUpdateComponent implements OnInit {
  // ==========================================================================
  // 🟢 SECTION: CLASS-LEVEL VARIABLES AND INITIAL STATE
  // --------------------------------------------------------------------------
  // These properties store all dynamic data, form values, upload progress,
  // lists of users, tasks, attachments, and UI state information.
  // ==========================================================================

  isSaving = false;
  corresp!: ICorresp;

  // --- Storage for tasks and attachments ---
  tasksToSave: ITasks[] = [];
  pjsToSave: IPj[] = [];

  // --- File tracking for uploads ---
  fileLinks: FileIndexLink[] = [];
  uploadProgress: Map<string, number> = new Map(); // Per-file progress tracking
  isUploading = false; // Prevents new uploads while one is in progress

  // --- Rich text (HTML content) body of the correspondence ---
  htmlContent: string = 'Ajouter Votre Contenu !';

  // --- General Info Fields ---
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

  // --- User-related fields for task assignment ---
  users: IUser[] = [];
  userSearch = '';
  selectedUser: IUser[] = [];
  editingTaskIndex: number | null = null;
  isEditMode: boolean = false;

  // --- Reactive Form Reference ---
  editForm: CorrespFormGroup = this.correspFormService.createCorrespFormGroup();

  // --- Function used by search boxes (to display user login) ---
  searchExpr = function (dataItem: IUser): string {
    return dataItem.login!;
  };

  // --- File uploads (local memory only) ---
  uploadedFiles: File[] = [];

  // --- Accordion UI sections open/closed states ---
  accordionStates: { [key: string]: boolean } = {
    infoGen: true,
    taches: true,
    corps: true,
    pieces: true,
  };

  // --- Task list (temporary) ---
  tasks: Array<{ typeTask: string; responsable: any; dateLimite: string; responsableName: string; commentaire: string }> = [];

  correspType!: string;

  // --- Date boundaries for forms (used in date inputs) ---
  minDate!: string;
  maxDate!: string;

  // --- Type Document Management ---
  typedocuments: ITypedocument[] = [];
  selectedTypeDocument?: ITypedocument;

  finalPath = '';

  orgaList: IOrga[] = [];

  selectedOrga: any = null;
  selectedOrgaDest: any = null;
  selectedOrgaCC: any = null;

  departements: DepartementTreeFeignDTO[] = [];
  departementsDest: DepartementTreeFeignDTO[] = [];
  departementsCC: DepartementTreeFeignDTO[] = [];
  selectedDepartement = '';
  selectedDepartementName = '';

  companies: IContactCompany[] = [];
  personsForSelectedCompany: IPersonCompany[] = [];
  selectedCompanyId: number | null = null;
  selectedPersonId: number | null = null;
  loadingCompanies = false;
  loadingPersons = false;
  contactEmailLabel: string = '';

  showManualExpediteur = false;

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

  // ==========================================================================
  // 🟢 LIFECYCLE HOOK: ngOnInit()
  // --------------------------------------------------------------------------

  ngOnInit(): void {
    this.correspService.queryOrga().subscribe(res => {
      this.orgaList = res.body!;
    });

    this.typeDocumentService.query({ page: 0, size: 1000 }).subscribe(res => {
      this.typedocuments = res.body!;

      const autre: ITypedocument = {
        id: 0, // or -1 if you prefer
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
    pastDate.setDate(today.getDate() - 15); // 15 jours avant aujourd’hui

    this.maxDate = today.toISOString().split('T')[0]; // Format YYYY-MM-DD
    this.minDate = pastDate.toISOString().split('T')[0];
    this.route.queryParams.subscribe(params => {
      this.correspType = params['type'];
    });

    this.loadUsers();
    this.loadActiveCompanies();
  }

  loadActiveCompanies(): void {
    this.loadingCompanies = true;
    this.contactCompanyService.getActiveContactCompanies().subscribe({
      next: (res: HttpResponse<IContactCompany[]>) => {
        console.log('loadActiveCompanies response:', res);
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

    console.log('onExpediteurChange raw:', companyId, 'parsed id:', id);

    this.selectedCompanyId = id;
    this.personsForSelectedCompany = [];
    this.selectedPersonId = null;
    this.contactEmail = '';
    this.contactEmailLabel = '';

    // Si id présent, retrouver le nom de la société pour l'afficher comme expediteur
    if (id) {
      const company = this.companies.find(c => c.id === id);
      this.expediteur = company ? company.nom || '' : '';
    } else {
      // si aucune sélection -> on vide expediteur (sauf si on est en mode manuel)
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
        console.log('persons response for company', id, res);
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

    // Si aucun contact n'est sélectionné, réinitialiser les champs
    if (!personId) {
      this.contactEmail = '';
      this.contactEmailLabel = '';
      return;
    }

    // Trouver la personne par son ID dans la liste des contacts
    const p = this.personsForSelectedCompany.find(x => x.id === personId);

    if (p) {
      // Priorité : email > whatsapp > téléphone > nom
      this.contactEmail = p.email || p.whatsapp || p.tel || p.nom || '';
      this.contactEmailLabel = p.nom || '';
    } else {
      // Si la personne n'est pas trouvée, réinitialiser les champs
      this.contactEmail = '';
      this.contactEmailLabel = '';
    }
  }

  toggleManualExpediteur(to?: boolean): void {
    const next = typeof to === 'boolean' ? to : !this.showManualExpediteur;

    if (next) {
      // Passage en mode manuel : on annule la sélection de société
      this.selectedCompanyId = null;
      this.personsForSelectedCompany = [];
      this.selectedPersonId = null;
      this.loadingPersons = false;
      // (on laisse this.expediteur tel quel pour pouvoir saisir)
    } else {
      // Retour au select : on peut vider la valeur manuelle si souhaité
      this.expediteur = '';
      // si la liste n'est pas encore chargée, la recharger
      if (!this.companies || this.companies.length === 0) {
        this.loadActiveCompanies();
      }
    }

    this.showManualExpediteur = next;
  }

  onTypeDocumentChange(): void {
    if (!this.selectedTypeDocument) {
      // Réinitialiser si aucun type document sélectionné
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
            console.log('res body');
            console.log(res.body);
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

            // console.log(this.tasks)
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

    // 3️⃣ Contact en copie (CC)
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
  }

  generateRandomId(length: number = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // ====================================================================================================================================================
  // ====================================================================================================================================================
  // ====================================================================================================================================================
  // ====================================================================================================================================================
  // ====================================================================================================================================================
  // 🟢------------------------------------------------------------- INFO GENERALES----------------------------------------------------------------------
  // ====================================================================================================================================================
  // ====================================================================================================================================================
  // ====================================================================================================================================================
  // ====================================================================================================================================================
  // ====================================================================================================================================================

  uploadFileWithProgress(file: File, uniqueName: string, pjModel: IPj): void {
    this.isUploading = true;

    const req = { uniqueName }; // Pass uniqueName to backend

    this.pjService.uploadPj(file, req).subscribe({
      next: progressOrResponse => {
        if (typeof progressOrResponse === 'number') {
          // Update progress bar
          this.uploadProgress.set(uniqueName, progressOrResponse);
        } else {
          // Upload complete - response is string
          this.uploadProgress.set(uniqueName, 100);
          console.log('Upload successful:', progressOrResponse);

          if (!this.accordionStates['pieces']) {
            this.accordionStates['pieces'] = true;
          }

          pjModel.path = progressOrResponse;
          console.log('pjModel updated:', pjModel);
          // console.log(progressOrResponse)
          // this.finalPath = progressOrResponse
          // console.log(this.finalPath)

          // Keep progress at 100% briefly, then remove to show complete state
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

        // Remove failed upload from arrays
        const link = this.fileLinks.find(l => l.uniqueName === uniqueName);
        if (link) {
          this.removeFile(link.index);
        }

        // Show error to user
        alert('Échec du téléchargement du fichier');
      },
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // this.finalPath = '';

      this.uploadedFiles.push(file);

      const uniquePjName = this.generateRandomId(10);

      const pjModel: IPj = {} as IPj;
      const parts = file.name.split('.');

      pjModel.name = parts.slice(0, -1).join('.');
      pjModel.fileType = parts[parts.length - 1];
      pjModel.uniqueName = uniquePjName;

      // 🔗 link file index to uniqueName
      this.fileLinks.push({ index: this.uploadedFiles.length - 1, uniqueName: uniquePjName });

      // Initialize progress at 0
      this.uploadProgress.set(uniquePjName, 0);

      // Start upload with progress tracking
      this.uploadFileWithProgress(file, uniquePjName, pjModel);

      this.pjsToSave.push(pjModel);

      console.log(this.pjsToSave);
    }

    event.target.value = ''; // reset input
  }

  removeFile(index?: number): void {
    if (index === undefined || index < 0 || index >= this.uploadedFiles.length) {
      return;
    }

    // Find the uniqueName for this file index
    const link = this.fileLinks.find(l => l.index === index);

    if (link?.uniqueName) {
      // Check if file is still uploading
      if (this.uploadProgress.has(link.uniqueName)) {
        alert('Veuillez attendre la fin du téléchargement');
        return;
      }

      // Call delete API

      const file = this.uploadedFiles[link.index];
      const fileName = file?.name ?? '';
      const type = fileName.substring(fileName.lastIndexOf('.') + 1);

      const req = { uniqueName: link.uniqueName, fileType: type };

      console.log(req);

      this.pjService.deletePj(req).subscribe({
        next: () => {
          console.log('File deleted successfully');
          this.performFileRemoval(index, link.uniqueName);
        },
        error: error => {
          console.error('Delete failed:', error);
          alert('Échec de la suppression du fichier');
        },
      });
    } else {
      // No link found, just remove locally
      this.performFileRemoval(index);
    }
  }

  private performFileRemoval(index: number, uniqueName?: string): void {
    // Remove file
    this.uploadedFiles.splice(index, 1);

    // Remove from pjsToSave using uniqueName (if found)
    if (uniqueName) {
      this.pjsToSave = this.pjsToSave.filter(pj => pj.uniqueName !== uniqueName);
      this.uploadProgress.delete(uniqueName);
    }

    // Clean up the mapping
    this.fileLinks = this.fileLinks.filter(l => l.index !== index);

    // Update remaining indexes to stay in sync
    this.fileLinks.forEach(l => {
      if (l.index > index) l.index -= 1;
    });

    console.log(this.pjsToSave);
  }

  getUploadProgress(index: number): number | null {
    const link = this.fileLinks.find(l => l.index === index);
    if (link?.uniqueName && this.uploadProgress.has(link.uniqueName)) {
      return this.uploadProgress.get(link.uniqueName)!;
    }
    return null;
  }

  // ====================================================================================================================================================
  // ====================================================================================================================================================
  // ====================================================================================================================================================
  // ====================================================================================================================================================
  // ====================================================================================================================================================
  // 🟢------------------------------------------------------------- SAVE CORRESP ----------------------------------------------------------------------
  // ====================================================================================================================================================
  // ====================================================================================================================================================
  // ====================================================================================================================================================
  // ====================================================================================================================================================
  // ====================================================================================================================================================

  // affectReference(typeCorresp:string):string{
  //
  // }

  saveCorresp(withReference: boolean): void {
    // Clear previous validation errors
    console.log('INSIDE');
    this.validationInfoGenErrors = {};

    console.log('INSIDE 1');

    // Run validation — if something’s missing, stop here
    if (!this.validateInfoGeneralesForm()) {
      return;
    }

    console.log('INSIDE 2');

    if (!this.corresp) {
      this.corresp = {} as ICorresp; // initialize as empty object
    }

    console.log('INSIDE 3');

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
    // this.corresp!.reference =

    // if (withReference){
    //   this.corresp!.reference = withReference;
    // }

    switch (this.selectedType) {
      case 'Demande de travail':
      case 'Commande':
      case 'Rapport technique':
      case 'Réclamation':
        this.corresp!.dispatchType = DispatchType.EMAIL;
        break;

      case 'Facture':
        this.corresp!.dispatchType = DispatchType.REGISTERED_LETTER;
        break;

      case 'Note interne':
        this.corresp!.dispatchType = DispatchType.LETTER;
        break;

      default:
        this.corresp!.dispatchType = DispatchType.EMAIL;
        break;
    }

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

    console.log(this.corresp);
    console.log(this.tasksToSave);
    console.log(this.pjsToSave);

    this.tasks.forEach(t => {
      const taskModel: ITasks = {} as ITasks;

      taskModel.responsible = t.responsable;
      taskModel.dueDate = dayjs(t.dateLimite);
      taskModel.taskType = t.typeTask;
      taskModel.commentaire = t.commentaire;

      this.tasksToSave.push(taskModel);
    });

    console.log(this.corresp);
    console.log(this.tasksToSave);
    console.log(this.pjsToSave);

    this.correspService
      .saveCorrespWithTasksAndPj(this.corresp, this.tasksToSave, this.pjsToSave, this.selectedTypeDocument, withReference)
      .subscribe(res => {
        // console.log('okk');
        this.router.navigate(['/corresp']);
      });
  }

  validateInfoGeneralesForm(): boolean {
    let isValid = true;
    this.validationInfoGenErrors = {};

    if (!this.objet?.trim()) {
      this.validationInfoGenErrors['objet'] = "L'objet est obligatoire";
      isValid = false;
    }

    // accepte soit une société sélectionnée (selectedCompanyId) soit un expéditeur saisi manuellement (expediteur)
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

    if (!this.contactEmail?.trim()) {
      this.validationInfoGenErrors['contactEmail'] = 'Le contact est obligatoire';
      isValid = false;
    }

    return isValid;
  }

  validationInfoGenErrors: { [key: string]: string } = {};

  // ====================================================================================================================================================
  // ====================================================================================================================================================
  // ====================================================================================================================================================
  // ====================================================================================================================================================
  // ====================================================================================================================================================
  // 🟢-------------------------------------------------------------- TASKS -----------------------------------------------------------------------------
  // ====================================================================================================================================================
  // ====================================================================================================================================================
  // ====================================================================================================================================================
  // ====================================================================================================================================================
  // ====================================================================================================================================================

  saveTask(): void {
    // Reset any previous validation states
    this.validationErrors = {};

    // Validate all fields
    if (!this.validateForm()) {
      return;
    }

    const taskData = {
      typeTask: this.selectedType,
      responsable: this.selectedDepartement,
      dateLimite: this.dateLimite,
      responsableName: this.selectedDepartementName,
      commentaire: this.commentaire,
    };

    // this.tasksToSave.push(taskModel)

    if (this.isEditMode && this.editingTaskIndex !== null) {
      // Update existing task
      this.tasks[this.editingTaskIndex] = taskData;
      console.log('Task updated:', this.tasks[this.editingTaskIndex]);
    } else {
      // Add new task
      this.tasks.push(taskData);
      console.log('Task added:', taskData);
    }

    // Reset form and close modal
    this.resetForm();

    this.modalService.dismissAll();

    if (!this.accordionStates['taches']) {
      this.accordionStates['taches'] = true;
    }
  }

  resetForm(): void {
    this.selectedUser = [];
    this.dateLimite = '';
    this.validationErrors = {};
    this.isEditMode = false;
    this.editingTaskIndex = null;
    this.selectedType = '';
    this.commentaire = '';
    // this.departements = [];
    // this.selectedOrga = null;
  }

  editTask(index: number, modal: any): void {
    this.openTasksModal(modal, index);
  }

  removeTask(index: number): void {
    this.tasks.splice(index, 1);
  }

  getTaskDetails(task: any): any {
    // const userSelected = this.findUserByLogin(task.responsable, this.users);

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

    // Validate task name
    if (!this.selectedType || this.selectedType.trim() === '') {
      this.validationErrors['typeTask'] = 'Le type de la tâche est obligatoire';
      isValid = false;
    }

    // Validate task name
    if (!this.selectedOrga) {
      this.validationErrors['organigramme'] = 'L Organigramme est obligatoire';
      isValid = false;
    }

    if (!this.selectedDepartement || this.selectedDepartement.trim() === '') {
      this.validationErrors['departement'] = 'Le departement est obligatoire';
      isValid = false;
    }

    // // Validate responsible person
    // if (!this.selectedUser || this.selectedUser.length === 0) {
    //   this.validationErrors['responsable'] = 'Le responsable est obligatoire';
    //   isValid = false;
    // }

    return isValid;
  }

  validationErrors: { [key: string]: string } = {};

  // findSelectedDept(codeDept:string):void {
  //   this.correspService.getOrgaCodeByDeptCode({ deptCode: codeDept }).subscribe(res => {
  //     this.selectedOrga = this.orgaList.find(or => or.orgaCode === res.body)!;
  //
  //     this.onOrgaChange();
  //
  //     this.selectDepartmentByCodeInTree(codeDept,this.departements)
  //
  //     console.log(this.departements)
  //
  //   });
  // }

  findSelectedDept(codeDept: string): void {
    this.correspService
      .getOrgaCodeByDeptCode({ deptCode: codeDept })
      .pipe(
        tap(res => (this.selectedOrga = this.orgaList.find(o => o.orgaCode === res.body)!)),
        switchMap(() => this.correspService.queryOrgaDeps({ orgaCode: this.selectedOrga!.orgaCode })),
        tap(res => {
          this.departements = res.body || [];
          this.expandAllDepartments(this.departements);
        })
      )
      .subscribe(() => {
        this.selectDepartmentByCodeInTree(codeDept, this.departements);
      });
  }

  private selectDepartmentByCodeInTree(code: string, tree: DepartementTreeFeignDTO[]): boolean {
    const loop = (nodes: DepartementTreeFeignDTO[]): boolean => {
      for (const node of nodes) {
        if (node.code === code) {
          node.selected = true; // mark directly in the array
          this.selectedDepartement = node.code;
          this.selectedDepartementName = node.nom;
          return true; // stop recursion
        }
        if (node.children?.length) {
          if (loop(node.children)) return true;
        }
      }
      return false;
    };

    return loop(tree);
  }

  openTasksModal(content: any, taskIndex?: number): void {
    if (taskIndex !== undefined && taskIndex !== null) {
      // Edit mode - populate form with existing task data
      this.isEditMode = true;
      this.editingTaskIndex = taskIndex;
      const task = this.tasks[taskIndex];
      this.findSelectedDept(task.responsable);
      this.selectedType = task.typeTask;
      this.commentaire = task.commentaire;
      // this.selectedUser = Array.of(this.findUserByLogin(task.responsable, this.users));
      this.dateLimite = task.dateLimite;
    } else {
      // Add mode - reset for
      // this.selectedOrga = null;
      // this.commentaire = '';
      // this.departements = [];
      this.selectedDepartement = '';
      this.selectedDepartementName = '';
      this.isEditMode = false;
      this.editingTaskIndex = null;
      this.resetForm();
    }
    this.modalService.open(content, { size: 'xl' });
  }

  findUserByLogin(login: string, userList: IUser[]): IUser {
    return userList.find(u => u.login === login)!;
  }

  loadUsers(): void {
    this.userService.query({ page: 0, size: 1000, sort: ['firstName,ASC'] }).subscribe((res: HttpResponse<IUser[]>) => {
      this.users = res.body || [];
    });
  }

  onOrgaChange(): void {
    if (!this.selectedOrga) return;

    const req = { orgaCode: this.selectedOrga.orgaCode };

    this.correspService.queryOrgaDeps(req).subscribe({
      next: res => {
        this.departements = (res.body as DepartementTreeFeignDTO[]) || [];
        this.expandAllDepartments(this.departements);
        // this.departements[0].selected = true;
      },
      error: err => console.error('Erreur lors du chargement des départements', err),
    });
  }

  private expandAllDepartments(nodes: DepartementTreeFeignDTO[]): void {
    nodes.forEach(node => {
      (node as any).expanded = true; // DevExtreme reconnaît 'expanded'
      if (node.children && node.children.length > 0) {
        this.expandAllDepartments(node.children);
      }
    });
  }

  selectDep(event: any) {
    console.log(event);
    this.selectedDepartement = event.itemData.code;
    this.selectedDepartementName = event.itemData.nom;
  }

  // --------------------------------------------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------------------------------------------

  openAddDest(content: any): void {
    this.modalService.open(content, { size: 'lg', centered: true });
  }

  openAddCC(content: any): void {
    this.modalService.open(content, { size: 'lg', centered: true });
  }

  onOrgaChangeDest(): void {
    if (!this.selectedOrgaDest) return;

    const req = { orgaCode: this.selectedOrgaDest.orgaCode };

    this.correspService.queryOrgaDeps(req).subscribe({
      next: res => {
        this.departementsDest = (res.body as DepartementTreeFeignDTO[]) || [];
        this.expandAllDepartments(this.departementsDest);
        // this.departements[0].selected = true;
      },
      error: err => console.error('Erreur lors du chargement des départements', err),
    });
  }

  onOrgaChangeCC(): void {
    if (!this.selectedOrgaCC) return;

    const req = { orgaCode: this.selectedOrgaCC.orgaCode };

    this.correspService.queryOrgaDeps(req).subscribe({
      next: res => {
        this.departementsCC = (res.body as DepartementTreeFeignDTO[]) || [];
        this.expandAllDepartments(this.departementsCC);
        // this.departements[0].selected = true;
      },
      error: err => console.error('Erreur lors du chargement des départements', err),
    });
  }

  selectDepDest(e: any, modal: any): void {
    // this.selectedDepartementDest = e.itemData;
    // this.selectedDepartementDestNom = e.itemData.nom;
    // this.editForm.get('defautdest')?.setValue(e.itemData.code);
    // this.editForm.get('labelDD')?.setValue(e.itemData.nom);

    this.tasks = this.tasks.filter(t => t.responsable !== this.destinataire);

    this.destinataire = e.itemData.code;
    this.destinataireLabel = e.itemData.nom;

    // modal.close();
  }

  selectDepCopie(e: any, modalRef: any): void {
    // this.selectedDepartement1 = e.itemData;
    // this.selectedDepartementNom1 = e.itemData.nom;
    // this.editForm.get('defaultencopie')?.setValue(e.itemData.code);
    // this.editForm.get('labelDCC')?.setValue(e.itemData.nom);
    // modalRef.close();

    this.tasks = this.tasks.filter(t => t.responsable !== this.contactEmailCC);

    this.contactEmailCC = e.itemData.code;
    this.contactEmailCCLabel = e.itemData.nom;
  }

  dismissDest(): void {
    const taskData = {
      typeTask: 'traitement',
      responsable: this.destinataire ?? '',
      dateLimite: '',
      responsableName: this.destinataireLabel ?? '',
      commentaire: '',
    };

    this.tasks.push(taskData);

    this.modalService.dismissAll();
  }

  dismissCC(): void {
    const taskData = {
      typeTask: 'lecture',
      responsable: this.contactEmailCC ?? '',
      dateLimite: '',
      responsableName: this.contactEmailCCLabel ?? '',
      commentaire: '',
    };

    this.tasks.push(taskData);

    this.modalService.dismissAll();
  }

  // --------------------------------------------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------------------------------------------

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

  // Toggle accordion method
  toggleAccordion(section: string): void {
    this.accordionStates[section] = !this.accordionStates[section];
  }
  protected readonly console = console;
  protected readonly CorrespType = CorrespType;
  protected readonly CorrespStatus = CorrespStatus;
}
