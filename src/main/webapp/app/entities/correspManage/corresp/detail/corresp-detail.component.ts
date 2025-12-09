import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import dayjs from 'dayjs/esm';
import { ICorresp } from '../corresp.model';
import { CorrespService } from '../service/corresp.service';
import { TasksService } from '../../tasks/service/tasks.service';
import { ITasks } from '../../tasks/tasks.model';
import { IPj } from '../../pj/pj.model';
import { PjService } from '../../pj/service/pj.service';
import { IUser } from '../../../../admin/user-management/user-management.model';
import { HttpResponse } from '@angular/common/http';
import { DepartementTreeFeignDTO } from '../update/DepartementTreeFeignDTO';
import { IOrga } from '../orga';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ITypedocument } from '../../../configManage/typedocument/typedocument.model';
import { IDepartement } from '../../../orgacare/departement/departement.model';
import { TypedocumentService } from '../../../configManage/typedocument/service/typedocument.service';
import { switchMap } from 'rxjs';
import { FilePreviewComponent } from '../../pj/file-preview/file-preview.component';

// Mocking the Interfaces locally for this example (or import them from your shared models)
export enum CorrespStatus {
  DRAFT = 'DRAFT',
  IN_PROGRESS = 'IN_PROGRESS',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
}

// export interface ITasks {
//   id: number;
//   object?: string | null;
//   responsible?: string | null; // Keeping 'responsible' string for display
//   dueDate?: dayjs.Dayjs | null;
//   status?: CorrespStatus | null;
//   taskType?: string | null;
// }

// export interface IPj {
//   id: number;
//   name?: string | null;
//   fileType?: string | null;
// }

@Component({
  selector: 'jhi-corresp-detail',
  templateUrl: './corresp-detail.component.html',
  styleUrls: ['corresp-detail.scss'],
})
export class CorrespDetailComponent implements OnInit {
  objet: string = '';
  expediteur: string = '';
  destinataireLabel: string = '';
  contactEmail: string = '';
  contactEmailCCLabel: string = '';
  contactEmailCC = '';
  date: string = '';
  reponseSur: string = '';
  minDate!: string;
  maxDate!: string;
  isSaving: boolean = false;
  notificationMessage: string | null = null;
  notificationType: 'success' | 'error' | null = null;
  referenceEmetteur: string = '';
  priorite: boolean = false;
  typedocuments: ITypedocument[] = [];
  validationInfoGenErrors: { [key: string]: string } = {};
  // --- Body Content ---
  htmlContent = '<h3>Rapport Annuel</h3><p>Veuillez trouver ci-joint le rapport détaillé concernant...</p>';
  isEditingBody = false;

  // --- Mock Data Containers ---
  tasks: ITasks[] = [];
  attachments: IPj[] = [];

  // --- Accordion States (Closed by default as requested) ---
  accordionStates: { [key: string]: boolean } = {
    infoGen: true,
    taches: true,
    corps: true,
    pieces: true,
  };

  correspType = '';
  destinataire = '';

  correspLoaded!: ICorresp;
  formattedDate = '';
  selectedTypeDocument!: ITypedocument;
  tachesAssociees: ITasks[] = [];

  pjsLoaded: IPj[] = [];

  orgaList: IOrga[] = [];

  selectedOrga: any = null;

  departements: DepartementTreeFeignDTO[] = [];
  selectedDepartement = '';

  dateLimite = '';
  selectedType = '';
  commentaire = '';

  btnSaveTaskDisabled = false;

  selectedPj: IPj | null = null;

  isUploading = false; // Prevents new uploads while one is in progress

  uploadProgress: Map<string, number> = new Map(); // Per-file progress tracking

  @ViewChild('filePreview') filePreview!: FilePreviewComponent;

  constructor(
    protected activatedRoute: ActivatedRoute,
    protected router: Router,
    private correspService: CorrespService,
    private typeDocumentService: TypedocumentService,
    private taskService: TasksService,
    private pjService: PjService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.loadMockData();
    const id = this.activatedRoute.snapshot.paramMap.get('id');

    this.correspService.find(Number(id)).subscribe(res => {
      this.correspLoaded = res.body!;
      this.htmlContent = this.correspLoaded.body || '';
      // this.formattedDate = dayjs(this.correspLoaded.courrierDate).format('dddd DD MMMM YYYY').toUpperCase();
      // console.log(this.correspLoaded)
      this.objet = this.correspLoaded.subject || '';
      this.expediteur = this.correspLoaded.sender || '';
      this.destinataireLabel = this.correspLoaded.labelDestinataire || '';
      this.contactEmail = this.correspLoaded.contactEmail || '';
      this.contactEmailCCLabel = this.correspLoaded.labelContactCC || '';
      this.date = this.correspLoaded.courrierDate ? dayjs(this.correspLoaded.courrierDate).format('YYYY-MM-DD') : '';
      this.reponseSur = this.correspLoaded.responseTo || '';
      this.referenceEmetteur = this.correspLoaded.senderReference || '';
      this.priorite = this.correspLoaded.priority || false;

      this.typeDocumentService.query({ page: 0, size: 1000 }).subscribe(res => {
        this.typedocuments = res.body!;
        this.selectedTypeDocument = this.typedocuments.find(td => td.id === Number(this.correspLoaded.typeDocumentId))!;
        console.log(this.selectedTypeDocument);
      });
    });

    this.taskService.getAllTasksByCorrespId({ correspId: Number(id) }).subscribe(res => {
      this.tachesAssociees = res.body || [];
      console.log(this.tachesAssociees);
    });

    this.pjService.getAllPjByCorrespId({ correspId: Number(id) }).subscribe(res => {
      this.pjsLoaded = res.body || [];
    });

    this.correspType = 'Arrivée';

    this.correspService.queryOrga().subscribe(res => {
      this.orgaList = res.body!;
    });
  }
  // loadCorresp(id: number): void {
  //   this.correspService.find(id).subscribe((res: HttpResponse<ICorresp>) => {
  //     this.correspLoaded = res.body!;
  //   });
  // }

  formatLongDate(date: dayjs.Dayjs | string | null | undefined): string {
    if (!date) return '';
    return dayjs(date).format('dddd DD MMMM YYYY').toUpperCase();
  }

  formatLongDateWithTime(date: dayjs.Dayjs | string | null | undefined): string {
    if (!date) return '';
    return dayjs(date).format('dddd DD MMMM YYYY - HH:mm').toUpperCase();
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

    if (this.selectedTypeDocument.defautdest) {
      this.correspService.queryOrgaDepsByCode({ code: this.selectedTypeDocument.defautdest }).subscribe({
        next: (res: HttpResponse<IDepartement>) => {
          if (res.body) {
            console.log('res body');
            console.log(res.body);
            this.destinataire = res.body.email || '';
            this.destinataireLabel = res.body.nom || '';
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
  private sanitize(obj: any): any {
    Object.keys(obj).forEach(key => {
      if (obj[key] === undefined) {
        obj[key] = null;
      }
    });
    return obj;
  }

  saveDraft(): void {
    if (!this.correspLoaded) {
      this.showNotification('Aucune correspondance chargée !', 'error');
      return;
    }

    if (!this.selectedTypeDocument) {
      this.showNotification('Veuillez sélectionner un type de document !', 'error');
      return;
    }

    const correspDTO: any = {
      id: this.correspLoaded.id,
      idinstance: this.correspLoaded.idinstance,
      subject: this.objet || 'Sans objet',
      courrierDate: this.date ? dayjs(this.date).toISOString() : dayjs().toISOString(),
      dateCreated: this.correspLoaded.dateCreated ? dayjs(this.correspLoaded.dateCreated).toISOString() : dayjs().toISOString(),
      status: 'DRAFT',
      body: this.htmlContent || '',
      sender: this.expediteur || 'Inconnu',
      contact: this.contactEmail || '',
      contactEmail: this.contactEmail || '',
      contactEmailCc: this.contactEmailCCLabel || '',
      responseTo: this.reponseSur || null,
      senderReference: this.referenceEmetteur || null,
      priority: this.priorite || false,
      corresptype: this.correspLoaded.corresptype || 'STANDARD',
      dispatchType: this.correspLoaded.dispatchType || 'NORMAL',
      labelDestinataire: this.destinataireLabel || '',
      labelContactCC: this.contactEmailCCLabel || '',
    };

    const typeDocumentDTO = this.selectedTypeDocument;

    this.isSaving = true;

    this.correspService.updateCorrespDraft(this.correspLoaded.id, correspDTO, typeDocumentDTO).subscribe({
      next: res => {
        this.isSaving = false;
        this.correspLoaded = res.body!;
        this.htmlContent = this.correspLoaded.body || '';
        this.showNotification('Brouillon enregistré avec succès !', 'success');
      },
      error: err => {
        this.isSaving = false;
        console.error('Erreur mise à jour brouillon', err);
        this.showNotification("Erreur lors de l'enregistrement du brouillon", 'error');
      },
    });
  }

  showNotification(message: string, type: 'success' | 'error') {
    this.notificationMessage = message;
    this.notificationType = type;

    // Supprimer automatiquement après 5 secondes
    setTimeout(() => {
      this.notificationMessage = null;
      this.notificationType = null;
    }, 5000);
  }
  // --- Mock Data Generation ---
  loadMockData(): void {
    // 1. Mock Tasks
    this.tasks = [
      {
        id: 1,
        taskType: 'Validation',
        responsible: 'DIRECTION GENERALE',
        dueDate: dayjs().add(2, 'days'),
        status: CorrespStatus.CLOSED,
        closeDate: dayjs(), // Closed today
      },
      {
        id: 2,
        taskType: 'Signature',
        responsible: 'DIRECTION TECHNIQUE',
        dueDate: dayjs().add(5, 'days'),
        status: CorrespStatus.CLOSED,
        closeDate: dayjs().subtract(1, 'day'), // Closed yesterday
      },
      {
        id: 3,
        taskType: 'Revue',
        responsible: 'COMPTABILITé',
        dueDate: dayjs().add(1, 'day'),
        status: CorrespStatus.IN_PROGRESS,
        closeDate: null, // or undefined
      },
      {
        id: 4,
        taskType: 'Archivage',
        responsible: 'ADministratif',
        dueDate: dayjs().add(10, 'days'),
        status: CorrespStatus.DRAFT,
        closeDate: null,
      },
      {
        id: 5,
        taskType: 'Annulation',
        responsible: 'Direction adjointe',
        dueDate: dayjs().subtract(1, 'day'),
        status: CorrespStatus.CANCELLED,
        closeDate: null,
      },
    ];

    // 2. Mock Attachments
    this.attachments = [
      { id: 101, name: 'CV_Foulen', fileType: 'pdf' },
      { id: 102, name: 'Lettre_De_Motivation', fileType: 'pdf' },
      { id: 103, name: 'Photo_Profil', fileType: 'jpg' },
    ];
  }

  // --- Logic: Task Progress ---
  // get taskCompletionPercentage(): number {
  //   if (!this.tasks || this.tasks.length === 0) {
  //     return 0;
  //   }
  //   const closedTasks = this.tasks.filter(t => t.status === CorrespStatus.CLOSED).length;
  //   return Math.round((closedTasks / this.tasks.length) * 100);
  // }

  get taskCompletionPercentage(): number {
    if (!this.tachesAssociees || this.tachesAssociees.length === 0) {
      return 0;
    }

    const activeTasks = this.tachesAssociees.filter(t => t.status !== CorrespStatus.CANCELLED);
    if (activeTasks.length === 0) {
      return 0;
    }

    const closedTasks = activeTasks.filter(t => t.status === CorrespStatus.CLOSED).length;
    return Math.round((closedTasks / activeTasks.length) * 100);
  }

  // --- Logic: Task Colors ---
  getTaskColor(status?: CorrespStatus | null): string {
    switch (status) {
      case CorrespStatus.DRAFT:
        return 'deeppink'; // Pink
      case CorrespStatus.IN_PROGRESS:
        return '#0d6efd'; // Blue
      case CorrespStatus.CLOSED:
        return '#198754'; // Green
      case CorrespStatus.CANCELLED:
        return '#dc3545'; // Red
      default:
        return '#6c757d'; // Grey default
    }
  }

  getTaskLabel(status?: CorrespStatus | null): string {
    switch (status) {
      case CorrespStatus.DRAFT:
        return 'brouillon'; // Pink
      case CorrespStatus.IN_PROGRESS:
        return 'En cours'; // Blue
      case CorrespStatus.CLOSED:
        return 'achevée'; // Green
      case CorrespStatus.CANCELLED:
        return 'annulée'; // Red
      default:
        return '#6c757d'; // Grey default
    }
  }

  // --- Helper: Format Date ---
  formatDate(date: dayjs.Dayjs | null | undefined): string {
    return date ? date.format('DD/MM/YYYY') : 'pas de date limite';
  }

  // --- Logic: Accordion Toggle ---
  toggleAccordion(section: string): void {
    this.accordionStates[section] = !this.accordionStates[section];
  }

  // --- Logic: Body Edit ---
  toggleEditBody(): void {
    this.isEditingBody = !this.isEditingBody;
  }

  previousState(): void {
    window.history.back();
  }

  protected readonly CorrespStatus = CorrespStatus;

  // ------------------------------------------------------------------------------------------------------------------------

  saveTask(): void {
    this.validationErrors = {};

    if (!this.validateForm()) {
      return;
    }

    this.btnSaveTaskDisabled = true;

    const taskModel: ITasks = {} as ITasks;

    taskModel.responsible = this.selectedDepartement;
    taskModel.dueDate = dayjs(this.dateLimite);
    taskModel.taskType = this.selectedType;
    taskModel.commentaire = this.commentaire;

    console.log(taskModel);

    this.correspService.addTaskToCorresp(taskModel, this.correspLoaded.id).subscribe(res => {
      this.resetForm();

      this.modalService.dismissAll();

      window.location.reload();
    });
  }

  resetForm(): void {
    this.dateLimite = '';
    this.commentaire = '';
    this.validationErrors = {};
    this.selectedDepartement = '';
    this.selectedType = '';
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

    return isValid;
  }

  validationErrors: { [key: string]: string } = {};

  openTasksModal(content: any): void {
    this.selectedOrga = null;
    this.selectedDepartement = '';
    this.resetForm();
    this.modalService.open(content, { size: 'xl' });
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
  }

  deleteTask(correspId: number, tasksId: number): void {
    this.taskService.deleteTaskFromCorrespAndDB(correspId, tasksId).subscribe(res => {
      window.location.reload();
    });
  }

  changeTasksStatus(correspId: number, taskId: number, status: string): void {
    this.correspService.changeTaskStatus({ correspId, taskId, status }).subscribe(res => {
      window.location.reload();
    });
  }

  soumettreCorresp(correspId: number): void {
    this.correspService.soumettreCorresp({ correspId }).subscribe(res => {
      window.location.reload();
    });
  }

  cloturerCorresp(correspId: number): void {
    this.correspService.cloturerCorresp({ correspId }).subscribe(res => {
      window.location.reload();
    });
  }
  generateReference(): void {
    if (!this.correspLoaded || !this.correspLoaded.id) return;

    this.correspService.generateReferenceForCorresp(this.correspLoaded.id).subscribe({
      next: (res: ICorresp) => {
        this.correspLoaded.reference = res.reference;
        console.log('Référence générée :', res.reference);
      },
      error: err => console.error('Erreur génération référence :', err),
    });
  }

  togglePreview(pj: IPj): void {
    if (this.selectedPj && this.selectedPj.id === pj.id) {
      this.selectedPj = null; // Close if clicking the same one
    } else {
      this.selectedPj = pj; // Open new one
    }
  }

  closePreview(): void {
    this.selectedPj = null;
  }

  getStatusLabelAndColor(status: CorrespStatus): { label: string; color: string } {
    switch (status) {
      case CorrespStatus.DRAFT:
        return { label: 'Brouillon', color: 'deeppink' };
      case CorrespStatus.IN_PROGRESS:
        return { label: 'En cours', color: '#0d6efd' }; // bleu
      case CorrespStatus.CLOSED:
        return { label: 'Clôturé', color: '#6a2020' }; // rouge foncé
      default:
        return { label: status, color: 'gray' };
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

  // onFileSelected(event: any): void {
  //   const file = event.target.files[0];
  //   if (file) {
  //     // this.finalPath = '';
  //
  //     const uniquePjName = this.generateRandomId(10);
  //
  //     const pjModel: IPj = {} as IPj;
  //     const parts = file.name.split('.');
  //
  //     pjModel.name = parts.slice(0, -1).join('.');
  //     pjModel.fileType = parts[parts.length - 1];
  //     pjModel.uniqueName = uniquePjName;
  //
  //
  //     // Initialize progress at 0
  //     this.uploadProgress.set(uniquePjName, 0);
  //
  //     // Start upload with progress tracking
  //     this.uploadFileWithProgress(file, uniquePjName, pjModel);
  //   }
  //
  //   event.target.value = ''; // reset input
  // }

  onFileSelected(event: any): void {
    const files: FileList = event.target.files;

    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        const uniquePjName = this.generateRandomId(10);

        const pjModel: IPj = {} as IPj;
        const parts = file.name.split('.');

        pjModel.name = parts.slice(0, -1).join('.');
        pjModel.fileType = parts[parts.length - 1];
        pjModel.uniqueName = uniquePjName;

        // Initialize progress at 0
        this.uploadProgress.set(uniquePjName, 0);

        // Start upload with progress tracking
        this.uploadFileWithProgress(file, uniquePjName, pjModel);
      }
    }

    event.target.value = ''; // reset input
  }

  getProgressValue(): number {
    // There will be only one upload at a time because of isUploading
    const firstKey = Array.from(this.uploadProgress.keys())[0];
    return firstKey ? this.uploadProgress.get(firstKey)! : 0;
  }

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

          this.correspService.addPjToCorresp(pjModel, this.correspLoaded.id).subscribe({
            next: () => {
              console.log('PJ added to corresp successfully');
            },
            error: err => {
              console.error('Failed to assign PJ:', err);
            },
          });

          // Keep progress at 100% briefly, then remove to show complete state
          setTimeout(() => {
            this.uploadProgress.delete(uniqueName);
            this.isUploading = false;

            window.location.reload();
          }, 500);
        }
      },
      error: error => {
        console.error('Upload failed:', error);
        this.uploadProgress.delete(uniqueName);
        this.isUploading = false;

        // Show error to user
        alert('Échec du téléchargement du fichier');
      },
    });
  }

  downloadSelectedPj(): void {
    if (this.filePreview) {
      this.filePreview.downloadFile();
    }
  }

  deletePjWithCorresp(): void {
    const req = { uniqueName: this.selectedPj?.uniqueName, fileType: this.selectedPj?.fileType };

    this.pjService.deletePjWithCorresp(req).subscribe({
      next: () => {
        console.log('File deleted successfully');
        window.location.reload();
      },
      error: error => {
        console.error('Delete failed:', error);
        alert('Échec de la suppression du fichier');
      },
    });
  }
}
