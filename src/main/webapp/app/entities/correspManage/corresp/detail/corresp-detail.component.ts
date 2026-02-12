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
// import { IOrga } from '../orga';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ITypedocument } from '../../../configManage/typedocument/typedocument.model';
import { IDepartement } from '../../../orgacare/departement/departement.model';
import { TypedocumentService } from '../../../configManage/typedocument/service/typedocument.service';
import { switchMap } from 'rxjs';
import { FilePreviewComponent } from '../../pj/file-preview/file-preview.component';
import { saveAs } from 'file-saver';
import { ContactCompanyService } from 'app/entities/configManage/contact-company/service/contact-company.service';
import { IContactCompany } from 'app/entities/configManage/contact-company/contact-company.model';
import { IPersonCompany } from 'app/entities/configManage/person-company/person-company.model';
import { PersonneFeignDTO } from '../update/PersonneFeignDTO';
import { TypeAffectation } from '../update/enums';

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

  // orgaList: IOrga[] = [];

  // selectedOrga: any = null;

  companies: IContactCompany[] = [];
  personsForSelectedCompany: IPersonCompany[] = [];
  selectedCompanyId: number | null = null;
  selectedPersonId: number | null = null;
  loadingCompanies = false;
  loadingPersons = false;
  showManualExpediteur = true;
  showManualContact = true;
  companySearchExpr = function (dataItem: IContactCompany): string {
    return dataItem.nom || '';
  };
  personSearchExpr = function (dataItem: IPersonCompany): string {
    return (dataItem.nom ? dataItem.nom + ' ' : '') + (dataItem.email ? dataItem.email + ' ' : '') + (dataItem.tel ? dataItem.tel : '');
  };

  // departements: DepartementTreeFeignDTO[] = [];
  selectedDepartement = '';
  selectedDepartementName = '';
  selectedResponsables: { codeDept?: string | null; matriculePers?: string | null; displayName?: string | null }[] = [];

  // === NEW: Tree related state ===
  taskTree: DepartementTreeFeignDTO[] = []; // arbre récupéré depuis orgacare
  loadingTree = false;
  selectedDept: DepartementTreeFeignDTO | null = null;

  // liste d'organigrammes (optionnel) et code sélectionné
  orgaList: any[] = [];
  selectedOrgaCode: string | null = null;

  dateLimite = '';
  selectedType = '';
  commentaire = '';

  btnSaveTaskDisabled = false;

  selectedPj: IPj | null = null;

  isUploading = false; // Prevents new uploads while one is in progress

  uploadProgress: Map<string, number> = new Map(); // Per-file progress tracking

  bodyHtmlContent = '';

  selectedPjToDelete!: IPj;

  @ViewChild('filePreview') filePreview!: FilePreviewComponent;

  treeSearchQuery = '';
  taskTreeFiltered: DepartementTreeFeignDTO[] = [];

  constructor(
    protected activatedRoute: ActivatedRoute,
    protected router: Router,
    private correspService: CorrespService,
    private typeDocumentService: TypedocumentService,
    private taskService: TasksService,
    private pjService: PjService,
    private modalService: NgbModal,
    protected contactCompanyService: ContactCompanyService
  ) {}

  ngOnInit(): void {
    this.loadMockData();
    const id = this.activatedRoute.snapshot.paramMap.get('id');

    this.correspService.find(Number(id)).subscribe(res => {
      this.correspLoaded = res.body!;
      // this.htmlContent = this.correspLoaded.body || '';
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

      //TODO - GET MESSAGE BY CORRESP ID AND GET PATH AND PASS IT BELOW
      //
      this.correspService.loadBodyFromFile({ correspId: this.correspLoaded.id }).subscribe(res => {
        console.log('res lazy body');
        console.log(res);
        this.htmlContent = res;
      });

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

    // this.correspService.queryOrga().subscribe(res => {
    //   this.orgaList = res.body!;
    // });
    this.loadActiveCompanies();
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

  loadActiveCompanies(): void {
    this.loadingCompanies = true;
    this.contactCompanyService.getActiveContactCompanies().subscribe({
      next: (res: HttpResponse<IContactCompany[]>) => {
        this.companies = res.body || [];
        this.loadingCompanies = false;
      },
      error: () => {
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
      error: () => {
        this.personsForSelectedCompany = [];
        this.loadingPersons = false;
      },
    });
  }

  onSelectContactPerson(personId: number | null): void {
    this.selectedPersonId = personId;
    if (!personId) {
      this.contactEmail = '';
      return;
    }
    const p = this.personsForSelectedCompany.find(x => x.id === personId);
    if (p) {
      this.contactEmail = p.email || p.whatsapp || p.tel || p.nom || '';
    } else {
      this.contactEmail = '';
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
        // this.htmlContent = this.correspLoaded.body || '';
        this.correspService.loadBodyFromFile({ correspId: this.correspLoaded.id }).subscribe(res => {
          console.log('res lazy body');
          console.log(res);
          this.htmlContent = res;
        });
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

  // --- helper: convert dayjs/string -> ISO string or null
  private toIso(value: any): string | null {
    if (!value) return null;
    // dayjs objects have toISOString via toJSON
    if (typeof value === 'object' && typeof (value as any).toJSON === 'function') {
      try {
        return (value as any).toJSON();
      } catch {
        return String(value);
      }
    }
    // string already
    return String(value);
  }

  // --- helper: build a readable summary of selectedResponsables (for object/responsible display)
  private getResponsablesSummary(): string {
    if (!this.selectedResponsables || this.selectedResponsables.length === 0) return '';
    const parts: string[] = [];
    for (const r of this.selectedResponsables) {
      if (r.matriculePers) {
        // prefer person name if you have matricule -> but we only have matricule; use matricule
        parts.push(r.matriculePers);
      } else if (r.codeDept) {
        parts.push(r.codeDept);
      }
    }
    return parts.join(', ');
  }

  // --- replace existing saveTask() with this ---
  saveTask(): void {
    if (this.btnSaveTaskDisabled) {
      return;
    }
    // reset client-side errors
    this.validationErrors = {};

    if (!this.validateForm()) {
      return;
    }

    this.btnSaveTaskDisabled = true;

    // build 'object' (server requires non-null)
    const responsibleText = this.getResponsablesSummary() || this.selectedDepartement || '';
    const taskTypeText = this.selectedType ? this.selectedType.toUpperCase() : 'N/A';

    let objectBuilder = `${responsibleText} effectuera la tâche de ${taskTypeText}`;
    if (this.dateLimite) {
      const formatted = dayjs(this.dateLimite).format('DD/MM/YYYY');
      objectBuilder += ` en ne dépassant pas la date limite du ${formatted}`;
    }

    // prepare payload
    const taskModel: any = {
      object: objectBuilder,
      taskType: this.selectedType || null,
      commentaire: this.commentaire || null,
      // responsible for display (optional) — keep readable label
      responsible: responsibleText || this.selectedDepartement || null,
      // dueDate as ISO string (server expects String or date)
      dueDate: this.dateLimite ? this.toIso(dayjs(this.dateLimite)) : null,
      // responsables: only include fields that actually exist (no empty keys)
      responsables: (this.selectedResponsables || [])
        .map(r => {
          const out: any = {};
          if (r.codeDept) out.codeDept = r.codeDept;
          if (r.matriculePers) out.matriculePers = r.matriculePers;
          return out;
        })
        .filter(x => Object.keys(x).length > 0),
    };

    // debug
    console.log('POST /api/corresps/{id}/tasks payload =', taskModel);

    // call service: your CorrespService.addTaskToCorresp expects ITasks and converts dates
    this.correspService.addTaskToCorresp(taskModel, this.correspLoaded.id).subscribe({
      next: resp => {
        this.btnSaveTaskDisabled = false;
        this.resetForm();
        this.modalService.dismissAll();
        // refresh local tasks list (without full reload)
        this.taskService.getAllTasksByCorrespId({ correspId: this.correspLoaded.id }).subscribe(r => {
          this.tachesAssociees = r.body || [];
        });
        this.showNotification('Tâche ajoutée avec succès', 'success');
      },
      error: err => {
        this.btnSaveTaskDisabled = false;
        console.error('Erreur ajout tâche', err);

        // Try to parse JHipster / Problem JSON with fieldErrors
        if (err && err.error) {
          const payload = err.error;
          // if fieldErrors present, map to validationErrors
          if (Array.isArray(payload.fieldErrors) && payload.fieldErrors.length) {
            payload.fieldErrors.forEach((fe: any) => {
              // fe.field may be 'object' etc.
              this.validationErrors[fe.field] = fe.message || 'Valeur invalide';
            });
            this.showNotification('Erreur de validation : corrigez les champs indiqués', 'error');
            return;
          }
          // generic message
          if (payload.message) {
            this.showNotification(payload.message, 'error');
            return;
          }
        }

        // fallback
        this.showNotification("Erreur lors de l'ajout de la tâche (serveur)", 'error');
      },
    });
  }

  resetForm(): void {
    this.dateLimite = '';
    this.commentaire = '';
    this.validationErrors = {};
    this.selectedDepartement = '';
    this.selectedDepartementName = '';
    this.selectedDept = null;
    this.selectedType = '';
    this.selectedResponsables = [];
  }

  validateForm(): boolean {
    let isValid = true;
    this.validationErrors = {};

    // Validate task name
    if (!this.selectedType || this.selectedType.trim() === '') {
      this.validationErrors['typeTask'] = 'Le type de la tâche est obligatoire';
      isValid = false;
    }

    if (!this.selectedResponsables || this.selectedResponsables.length === 0) {
      this.validationErrors['responsables'] = 'Sélectionnez au moins un responsable (dépt ou personne)';
      isValid = false;
    }

    return isValid;
  }

  validationErrors: { [key: string]: string } = {};

  openTasksModal(content: any): void {
    // this.selectedOrga = null;
    this.selectedDepartement = '';
    this.resetForm();
    this.prepareAndLoadOrgaThenTree();
    this.modalService.open(content, { size: 'xl' });
  }

  openDeleteModal(content: any): void {
    this.modalService.open(content, { centered: true, size: 'xl' });
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
  expandedAffectations: Set<string> = new Set();
  expandedNodes: Set<number> = new Set();
  private levelPalette: string[] = ['#1e90ff', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6'];

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
    // Only return keys that have people
    return Object.keys(node.affectationsByType).filter(k => {
      const list = (node.affectationsByType as any)[k];
      return Array.isArray(list) && list.length > 0;
    });
  }

  getPeopleForType(node: DepartementTreeFeignDTO, type: string): PersonneFeignDTO[] {
    if (!node.affectationsByType) return [];
    return (node.affectationsByType as any)[type] || [];
  }

  onSelectDept(node: DepartementTreeFeignDTO): void {
    this.selectedDept = node;
    this.selectedDepartement = node.code ?? '';
    this.selectedDepartementName = node.nom ?? '';
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

  // onOrgaChange(): void {
  //   if (!this.selectedOrga) return;
  //
  //   const req = { orgaCode: this.selectedOrga.orgaCode };
  //
  //   this.correspService.queryOrgaDeps(req).subscribe({
  //     next: res => {
  //       this.departements = (res.body as DepartementTreeFeignDTO[]) || [];
  //       this.expandAllDepartments(this.departements);
  //       // this.departements[0].selected = true;
  //     },
  //     error: err => console.error('Erreur lors du chargement des départements', err),
  //   });
  // }
  //
  // private expandAllDepartments(nodes: DepartementTreeFeignDTO[]): void {
  //   nodes.forEach(node => {
  //     (node as any).expanded = true; // DevExtreme reconnaît 'expanded'
  //     if (node.children && node.children.length > 0) {
  //       this.expandAllDepartments(node.children);
  //     }
  //   });
  // }
  //
  // selectDep(event: any) {
  //   console.log(event);
  //   this.selectedDepartement = event.itemData.code;
  // }

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

  // downloadSelectedPj(pjId:number): void {
  //   // if (this.filePreview) {
  //   //   this.filePreview.downloadPjWithoutSelecting(pjId);
  //   // }
  // }

  public downloadSelectedPj(pj: IPj) {
    this.pjService.getFile(pj.id).subscribe({
      next: (blob: Blob) => {
        saveAs(blob, pj.name + '.' + pj.fileType);
      },
      error: err => {
        console.error('Download failed', err);
      },
    });
  }

  openDeletePjModal(content: any, pj: IPj) {
    this.selectedPjToDelete = pj;

    this.modalService.open(content, { centered: true, size: 'lg' });
  }

  deletePjWithCorresp(): void {
    const req = { uniqueName: this.selectedPjToDelete.uniqueName, fileType: this.selectedPjToDelete.fileType };

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

  deleteCorresp(): void {
    this.correspService.delete(this.correspLoaded.id).subscribe(res => {
      this.router.navigate(['/corresp']);
    });
  }
}
