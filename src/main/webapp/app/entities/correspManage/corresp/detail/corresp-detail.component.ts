import { Component, OnInit } from '@angular/core';
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
  // --- General Info Data (Mocked for display) ---
  objet = 'Demande de validation budgétaire 2025';
  expediteur = 'Jean Dupont (Direction Financière)';
  destinataire = 'Direction Générale';
  date: string = dayjs().format('YYYY-MM-DD');
  contactEmail = 'jean.dupont@company.com';

  // --- Body Content ---
  htmlContent = '<h3>Rapport Annuel</h3><p>Veuillez trouver ci-joint le rapport détaillé concernant...</p>';
  isEditingBody = false;

  // --- Mock Data Containers ---
  tasks: ITasks[] = [];
  attachments: IPj[] = [];

  // --- Accordion States (Closed by default as requested) ---
  accordionStates: { [key: string]: boolean } = {
    infoGen: false,
    taches: true,
    corps: false,
    pieces: true,
  };

  correspType = '';

  correspLoaded!: ICorresp;
  formattedDate = '';

  tachesAssociees: ITasks[] = [];

  pjsLoaded: IPj[] = [];

  orgaList: IOrga[] = [];

  selectedOrga: any = null;

  departements: DepartementTreeFeignDTO[] = [];
  selectedDepartement = '';

  dateLimite = '';
  selectedType = '';

  btnSaveTaskDisabled = false;

  constructor(
    protected activatedRoute: ActivatedRoute,
    protected router: Router,
    private correspService: CorrespService,
    private taskService: TasksService,
    private pjService: PjService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.loadMockData();
    const id = this.activatedRoute.snapshot.paramMap.get('id');
    this.correspService.find(Number(id)).subscribe(res => {
      this.correspLoaded = res.body!;
      // this.formattedDate = dayjs(this.correspLoaded.courrierDate).format('dddd DD MMMM YYYY').toUpperCase();
      // console.log(this.correspLoaded)
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

  formatLongDate(date: dayjs.Dayjs | string | null | undefined): string {
    if (!date) return ''; // Return empty string or '-' if date is missing

    return dayjs(date).format('dddd DD MMMM YYYY').toUpperCase();
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

    console.log(taskModel);

    this.correspService.addTaskToCorresp(taskModel, this.correspLoaded.id).subscribe(res => {
      this.resetForm();

      this.modalService.dismissAll();

      window.location.reload();
    });
  }

  resetForm(): void {
    this.dateLimite = '';
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
    this.selectedDepartement = event.itemData.nom;
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
}
