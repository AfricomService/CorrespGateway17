import { Component, OnInit } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';

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

interface FileIndexLink {
  index: number;
  uniqueName: string;
}

@Component({
  selector: 'jhi-corresp-update',
  templateUrl: './corresp-update.component.html',
  styleUrls: ['corresp-update.scss'],
})
export class CorrespUpdateComponent implements OnInit {
  isSaving = false;
  corresp!: ICorresp;
  // correspStatusValues = Object.keys(CorrespStatus);
  // correspTypeValues = Object.keys(CorrespType);
  // dispatchTypeValues = Object.keys(DispatchType);

  // dossiersSharedCollection: IDossier[] = [];
  // bordereauxSharedCollection: IBordereaux[] = [];
  // pjsSharedCollection: IPj[] = [];
  tasksToSave: ITasks[] = [];
  pjsToSave: IPj[] = [];
  fileLinks: FileIndexLink[] = [];

  uploadProgress: Map<string, number> = new Map(); // Track progress per uniqueName
  isUploading = false; // Disable + button during upload

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
  dispatchType = '';
  contactEmail = '';
  contactEmailCC = '';
  referenceEmetteur = '';

  users: IUser[] = [];
  // filteredUsers: any[] = [];
  userSearch = '';
  selectedUser: IUser[] = [];

  editingTaskIndex: number | null = null;
  isEditMode: boolean = false;

  editForm: CorrespFormGroup = this.correspFormService.createCorrespFormGroup();

  searchExpr = function (dataItem: IUser): string {
    return dataItem.login!;
  };

  uploadedFiles: File[] = [];

  accordionStates: { [key: string]: boolean } = {
    infoGen: true, // Open by default
    taches: true, // Open by default
    corps: true, // Open by default
    pieces: true, // Open by default
  };

  tasks: Array<{
    typeTask: string;
    responsable: any;
    dateLimite: string;
  }> = [
    // {
    //   taskObject: 'Développement du module de gestion',
    //   responsable: 'anas.daoud',
    //   dateDebut: '2025-10-15',
    //   dateFin: '2025-10-25',
    //   dateLimite: '2025-10-30'
    // },
    // {
    //   taskObject: 'Révision et correction des bugs',
    //   responsable: 'anas.daoud',
    //   dateDebut: '2025-10-20',
    //   dateFin: '2025-10-28',
    //   dateLimite: '2025-11-05'
    // },
    // {
    //   taskObject: 'Rédaction de la documentation technique',
    //   responsable: 'anas.daoud',
    //   dateDebut: '2025-10-18',
    //   dateFin: '2025-10-26',
    //   dateLimite: '2025-11-02'
    // },
    // {
    //   taskObject: 'Tests et validation des fonctionnalités',
    //   responsable: 'anas.daoud',
    //   dateDebut: '2025-10-22',
    //   dateFin: '2025-11-01',
    //   dateLimite: '2025-11-08'
    // },
    // {
    //   taskObject: 'Déploiement en environnement de production',
    //   responsable: 'anas.daoud',
    //   dateDebut: '2025-11-02',
    //   dateFin: '2025-11-10',
    //   dateLimite: '2025-11-15'
    // }
  ];

  correspType!: string;

  minDate!: string;
  maxDate!: string;

  typedocuments: ITypedocument[] = [
    {
      id: 1,
      nom: 'Demande de travail',
      defautdest: 'administratif@africomesservices.com',
      defaultobject: 'Consultation',
      defaultencopie: 'chef.technique@africomesservices.com',
    },
    {
      id: 2,
      nom: 'Facture',
      defautdest: 'comptabilite@africomesservices.com',
      defaultobject: 'Transmission facture',
      defaultencopie: 'admin@africomesservices.com',
    },
    {
      id: 3,
      nom: 'Rapport technique',
      defautdest: 'support@africomesservices.com',
      defaultobject: 'Rapport d’intervention',
      defaultencopie: 'service.tech@africomesservices.com',
    },
    {
      id: 4,
      nom: 'Note interne',
      defautdest: 'direction@africomesservices.com',
      defaultobject: 'Note interne',
      defaultencopie: 'rh@africomesservices.com',
    },
    {
      id: 5,
      nom: 'Commande',
      defautdest: 'achat@africomesservices.com',
      defaultobject: 'Nouvelle commande',
      defaultencopie: 'logistique@africomesservices.com',
    },
    {
      id: 6,
      nom: 'Réclamation',
      defautdest: 'support.client@africomesservices.com',
      defaultobject: 'Réclamation client',
      defaultencopie: 'qualite@africomesservices.com',
    },
  ];

  selectedTypeDocument?: ITypedocument;

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
    protected route: ActivatedRoute
  ) {}
  ngOnInit(): void {
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
  }

  onTypeDocumentChange() {
    if (this.selectedTypeDocument) {
      this.objet = this.selectedTypeDocument.defaultobject || '';
      this.destinataire = this.selectedTypeDocument.defautdest || '';
      this.contactEmailCC = this.selectedTypeDocument.defaultencopie || '';
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

  // ----------------------------- INFO GENEREALES -----------------------------------------------------

  // onFileSelected(event: any): void {
  //   const file = event.target.files[0];
  //   if (file) {
  //     this.uploadedFiles.push(file);
  //
  //     const uniquePjName =  this.generateRandomId(10);
  //
  //     const pjModel: IPj = {} as IPj;
  //
  //     const parts = file.name.split('.');
  //     pjModel.name = parts.slice(0, -1).join('.');
  //     pjModel.fileType = parts[parts.length - 1];
  //     pjModel.uniqueName = uniquePjName;
  //
  //     this.pjsToSave.push(pjModel)
  //
  //     console.log(this.pjsToSave);
  //
  //   }
  //   event.target.value = ''; // reset input
  // }

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

      this.pjsToSave.push(pjModel);

      // 🔗 link file index to uniqueName
      this.fileLinks.push({ index: this.uploadedFiles.length - 1, uniqueName: uniquePjName });

      // Initialize progress at 0
      this.uploadProgress.set(uniquePjName, 0);

      // Start upload with progress tracking
      this.uploadFileWithProgress(file, uniquePjName);

      console.log(this.pjsToSave);
    }

    event.target.value = ''; // reset input
  }

  uploadFileWithProgress(file: File, uniqueName: string): void {
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
          this.accordionStates['pieces'] = !this.accordionStates['pieces'];

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

  // removeFile(index?: number, uniqueName?: string): void {
  //
  //   if (index !== undefined && index >= 0 && index < this.uploadedFiles.length) {
  //     this.uploadedFiles.splice(index, 1);
  //   }
  //
  //   if (uniqueName) {
  //     this.pjsToSave = this.pjsToSave.filter(pj => pj.uniqueName !== uniqueName);
  //   }
  //
  //   console.log(this.pjsToSave);
  // }

  // removeFile(index?: number): void {
  //   if (index === undefined || index < 0 || index >= this.uploadedFiles.length) {
  //     return;
  //   }
  //
  //   // Find the uniqueName for this file index
  //   const link = this.fileLinks.find(l => l.index === index);
  //
  //   // Remove file
  //   this.uploadedFiles.splice(index, 1);
  //
  //   // Remove from pjsToSave using uniqueName (if found)
  //   if (link?.uniqueName) {
  //     this.pjsToSave = this.pjsToSave.filter(pj => pj.uniqueName !== link.uniqueName);
  //   }
  //
  //   // Clean up the mapping
  //   this.fileLinks = this.fileLinks.filter(l => l.index !== index);
  //
  //   // Update remaining indexes to stay in sync
  //   this.fileLinks.forEach(l => {
  //     if (l.index > index) l.index -= 1;
  //   });
  //
  //   console.log(this.pjsToSave);
  // }

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

  // saveCorresp(): void {
  //   this.validationInfoGenErrors = {};
  //
  //   if (!this.validateInfoGeneralesForm()) {
  //     return;
  //   }
  //
  //   const corresp = {
  //     objet: this.objet,
  //   };
  //
  //   console.log('Task added:', corresp);
  //
  //   // Reset form and close modal
  //   this.resetInfoGenForm();
  //
  // }

  saveCorresp(): void {
    // Clear previous validation errors
    this.validationInfoGenErrors = {};

    // Run validation — if something’s missing, stop here
    if (!this.validateInfoGeneralesForm()) {
      return;
    }

    if (!this.corresp) {
      this.corresp = {} as ICorresp; // initialize as empty object
    }

    this.corresp!.subject = this.objet;
    this.corresp!.sender = this.expediteur;
    this.corresp!.courrierDate = dayjs(this.date);
    this.corresp!.responseTo = this.reponseSur;
    this.corresp!.step = this.etape;
    this.corresp!.priority = this.priorite === 'Prioritaire';
    this.corresp!.responseTo = this.destinataire;
    this.corresp!.body = this.htmlContent;

    this.tasks.forEach(t => {
      const taskModel: ITasks = {} as ITasks;

      taskModel.responsible = t.responsable;
      taskModel.dueDate = dayjs(t.dateLimite);

      this.tasksToSave.push(taskModel);
    });

    // this.uploadedFiles.forEach(f => {
    //
    //   const uniquePjName =  this.generateRandomId(10);
    //
    //   const pjModel: IPj = {} as IPj;
    //
    //   const parts = f.name.split('.');
    //   pjModel.name = parts.slice(0, -1).join('.');
    //   pjModel.fileType = parts[parts.length - 1];
    //   pjModel.uniqueName = uniquePjName;
    //
    //   this.pjsToSave.push(pjModel)
    // })

    console.log(this.corresp);
    console.log(this.tasksToSave);
    console.log(this.pjsToSave);

    this.correspService.saveCorrespWithTasksAndPj(this.corresp, this.tasksToSave, this.pjsToSave).subscribe(res => {
      console.log('okk');
    });

    // console.log('Correspondance enregistrée :', corresp);

    // Reset the form after saving
    // this.resetInfoGenForm();
  }

  resetInfoGenForm(): void {
    this.objet = '';
  }

  validateInfoGeneralesForm(): boolean {
    let isValid = true;
    this.validationInfoGenErrors = {};

    if (!this.objet?.trim()) {
      this.validationInfoGenErrors['objet'] = "L'objet est obligatoire";
      isValid = false;
    }
    if (!this.expediteur?.trim()) {
      this.validationInfoGenErrors['expediteur'] = "L'expéditeur est obligatoire";
      isValid = false;
    }
    if (!this.date) {
      this.validationInfoGenErrors['date'] = 'La date est obligatoire';
      isValid = false;
    }
    if (!this.courrier?.trim()) {
      this.validationInfoGenErrors['courrier'] = 'Le courrier est obligatoire';
      isValid = false;
    }
    if (!this.etape?.trim()) {
      this.validationInfoGenErrors['etape'] = "L'étape est obligatoire";
      isValid = false;
    }
    if (!this.destinataire?.trim()) {
      this.validationInfoGenErrors['destinataire'] = 'Le destinataire est obligatoire';
      isValid = false;
    }
    if (!this.dispatchType?.trim()) {
      this.validationInfoGenErrors['dispatchType'] = "Le type d'envoi est obligatoire";
      isValid = false;
    }

    if (!this.contactEmail?.trim()) {
      this.validationInfoGenErrors['contactEmail'] = 'Le contact est obligatoire';
      isValid = false;
    }

    // if (!this.referenceEmetteur?.trim()) {
    //   this.validationInfoGenErrors['referenceEmetteur'] = "Le contact est obligatoire";
    //   isValid = false;
    // }

    // if (!this.contactEmailCC?.trim()) {
    //   this.validationInfoGenErrors['contactEmailCC'] = "Le contactEmailCC est obligatoire";
    //   isValid = false;
    // }

    return isValid;
  }

  validationInfoGenErrors: { [key: string]: string } = {};

  // ------------------------------------------------- TASKS --------------------------------------------------------------------------------------

  saveTask(): void {
    // Reset any previous validation states
    this.validationErrors = {};

    // Validate all fields
    if (!this.validateForm()) {
      return;
    }

    const taskData = {
      typeTask: this.selectedType,
      responsable: this.selectedUser[0].login,
      dateLimite: this.dateLimite,
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
  }

  editTask(index: number, modal: any): void {
    this.openTasksModal(modal, index);
  }

  removeTask(index: number): void {
    this.tasks.splice(index, 1);
  }

  getTaskDetails(task: any): any {
    const userSelected = this.findUserByLogin(task.responsable, this.users);

    return {
      typeTask: task.typeTask,
      responsableName: `${userSelected.firstName} ${userSelected.lastName}`,
      dateLimite: task.dateLimite ? this.formatDate(task.dateLimite) : '',
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

    // Validate responsible person
    if (!this.selectedUser || this.selectedUser.length === 0) {
      this.validationErrors['responsable'] = 'Le responsable est obligatoire';
      isValid = false;
    }

    // // Validate dates exist
    // if (!this.dateDebut) {
    //   this.validationErrors['dateDebut'] = 'La date de début est obligatoire';
    //   isValid = false;
    // }
    //
    // if (!this.dateFin) {
    //   this.validationErrors['dateFin'] = 'La date de fin est obligatoire';
    //   isValid = false;
    // }
    //
    // if (!this.dateLimite) {
    //   this.validationErrors['dateLimite'] = 'La date limite est obligatoire';
    //   isValid = false;
    // }
    //
    // // Validate date logic if all dates are present
    // if (this.dateDebut && this.dateFin && this.dateLimite) {
    //   const debut = new Date(this.dateDebut);
    //   const fin = new Date(this.dateFin);
    //   const limite = new Date(this.dateLimite);
    //
    //   if (debut >= fin) {
    //     this.validationErrors['dateFin'] = 'La date de fin doit être après la date de début';
    //     isValid = false;
    //   }
    //
    //   if (fin >= limite) {
    //     this.validationErrors['dateLimite'] = 'La date limite doit être après la date de fin';
    //     isValid = false;
    //   }
    //
    //   if (debut >= limite) {
    //     this.validationErrors['dateLimite'] = 'La date limite doit être après la date de début';
    //     isValid = false;
    //   }
    // }

    return isValid;
  }

  validationErrors: { [key: string]: string } = {};

  openTasksModal(content: any, taskIndex?: number): void {
    if (taskIndex !== undefined && taskIndex !== null) {
      // Edit mode - populate form with existing task data
      this.isEditMode = true;
      this.editingTaskIndex = taskIndex;
      const task = this.tasks[taskIndex];

      this.selectedType = task.typeTask;
      this.selectedUser = Array.of(this.findUserByLogin(task.responsable, this.users));
      this.dateLimite = task.dateLimite;
    } else {
      // Add mode - reset form
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
}
