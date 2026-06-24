import { Component, OnInit, ViewChild, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import dayjs from 'dayjs/esm';
import { ICorresp, IContactCopieCorresp } from '../corresp.model';
import { CorrespService, CorrespReferenceItem } from '../service/corresp.service';
import { TasksService } from '../../tasks/service/tasks.service';
import { ITasks } from '../../tasks/tasks.model';
import { IPj } from '../../pj/pj.model';
import { PjService } from '../../pj/service/pj.service';
import { HttpResponse } from '@angular/common/http';
import { DepartementTreeFeignDTO } from '../update/DepartementTreeFeignDTO';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ITypedocument } from '../../../configManage/typedocument/typedocument.model';
import { IDepartement } from '../../../orgacare/departement/departement.model';
import { TypedocumentService } from '../../../configManage/typedocument/service/typedocument.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { FilePreviewComponent } from '../../pj/file-preview/file-preview.component';
import { saveAs } from 'file-saver';
import { ContactCompanyService } from 'app/entities/configManage/contact-company/service/contact-company.service';
import { IContactCompany } from 'app/entities/configManage/contact-company/contact-company.model';
import { IPersonCompany } from 'app/entities/configManage/person-company/person-company.model';
import { PersonneFeignDTO } from '../update/PersonneFeignDTO';
import { TypeAffectation } from '../update/enums';
import { DispatchType } from 'app/entities/enumerations/dispatch-type.model';
import { CorrespStatus } from 'app/entities/enumerations/corresp-status.model';
import { CorrespPermissionsDTO, PermissionDTO } from '../../permissions.model';
import { AccountService } from 'app/core/auth/account.service';
import { Account } from 'app/core/auth/account.model';
import { Authority } from 'app/config/authority.constants';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { PjCareService, PjCareDriverInfo, ScanDriver, ScannedPage } from 'app/entities/correspManage/pj/service/pjcare.service';
import { ScanSettingsService } from 'app/entities/correspManage/pj/service/scan-settings.service';
import { ModelNotifService } from 'app/entities/configManage/model-notif/service/model-notif.service';
import { IModelNotif } from 'app/entities/configManage/model-notif/model-notif.model';

@Component({
  selector: 'jhi-corresp-detail-outgoing',
  templateUrl: './corresp-detail-outgoing.component.html',
  styleUrls: ['corresp-detail-outgoing.component.scss'],
})
export class CorrespDetailOutgoingComponent implements OnInit {
  // ── Champs de base ─────────────────────────────────────────────────────────
  objet = '';
  expediteur = '';
  destinataireLabel = '';
  contactEmail = '';
  contactEmailCCLabel = '';
  contactEmailCC = '';
  date = '';
  reponseSur = '';
  minDate!: string;
  maxDate!: string;
  isSaving = false;
  notificationMessage: string | null = null;
  notificationType: 'success' | 'error' | null = null;
  referenceEmetteur = '';
  priorite = false;
  typedocuments: ITypedocument[] = [];
  validationInfoGenErrors: { [key: string]: string } = {};
  htmlContent = '';
  isEditingBody = false;

  // ── Données ────────────────────────────────────────────────────────────────
  tasks: ITasks[] = [];
  attachments: IPj[] = [];

  // ── Accordéons ────────────────────────────────────────────────────────────
  accordionStates: { [key: string]: boolean } = {
    infoGen: true,
    taches: true,
    corps: true,
    pieces: true,
  };

  correspType = '';
  destinataire = '';
  correspLoaded!: ICorresp;
  selectedTypeDocument: ITypedocument | null = null;
  tachesAssociees: ITasks[] = [];
  pjsLoaded: IPj[] = [];

  // ── Sociétés / contacts ────────────────────────────────────────────────────
  companies: IContactCompany[] = [];
  personsForSelectedCompany: IPersonCompany[] = [];
  selectedCompanyId: number | null = null;
  selectedPersonId: number | null = null;
  loadingCompanies = false;
  loadingPersons = false;
  showManualExpediteur = true;
  showManualContact = true;
  companySearchExpr = (dataItem: IContactCompany): string => dataItem.nom || '';
  personSearchExpr = (dataItem: IPersonCompany): string =>
    (dataItem.nom ? dataItem.nom + ' ' : '') + (dataItem.email ? dataItem.email + ' ' : '') + (dataItem.tel ? dataItem.tel : '');

  // ── Modal références ───────────────────────────────────────────────────────
  refsModalOpen = false;
  refsModalPage = 1;
  refsModalTotalPages = 1;
  refsModalTotalItems = 0;
  refsModalPageSize = 10;
  refsModalItems: CorrespReferenceItem[] = [];
  refsModalLoading = false;
  refsModalSearchQuery = '';
  refsSelectedItem: CorrespReferenceItem | null = null;

  // ── Organigramme / arbre ───────────────────────────────────────────────────
  selectedDepartement = '';
  selectedDepartementName = '';
  selectedResponsables: { codeDept?: string | null; matriculePers?: string | null; displayName?: string | null }[] = [];
  taskTree: DepartementTreeFeignDTO[] = [];
  loadingTree = false;
  selectedDept: DepartementTreeFeignDTO | null = null;
  orgaList: any[] = [];
  selectedOrgaCode: string | null = null;

  // ── Tâche ──────────────────────────────────────────────────────────────────
  dateLimite = '';
  selectedType = '';
  commentaire = '';
  btnSaveTaskDisabled = false;
  editingPendingTaskIndex = -1;
  treeSearchQuery = '';
  selectedTaskId: number | null = null;
  taskTreeFiltered: DepartementTreeFeignDTO[] = [];

  // ── Destinataire tree ──────────────────────────────────────────────────────
  recipientTree: DepartementTreeFeignDTO[] = [];
  recipientTreeFiltered: DepartementTreeFeignDTO[] = [];
  recipientLoadingTree = false;
  recipientSelectedDept: DepartementTreeFeignDTO | null = null;
  recipientTreeSearchQuery = '';
  recipientExpandedNodes: Set<number> = new Set();

  // ── CC tree ────────────────────────────────────────────────────────────────
  ccTree: DepartementTreeFeignDTO[] = [];
  ccTreeFiltered: DepartementTreeFeignDTO[] = [];
  ccLoadingTree = false;
  ccTreeSearchQuery = '';
  ccExpandedNodes: Set<number> = new Set();
  selectedCcDepts: IContactCopieCorresp[] = [];

  // ── Pending tasks ──────────────────────────────────────────────────────────
  pendingTasks: Array<{
    typeTask: string;
    responsable: string;
    dateLimite: string;
    responsableName: string;
    commentaire: string;
  }> = [];

  // ── Dispatch (OUTGOING spécifique) ─────────────────────────────────────────
  dispatchType: DispatchType | '' = '';
  dispatchTypeOptions: Array<{ value: DispatchType; label: string }> = [
    { value: DispatchType.LETTER, label: 'Lettre' },
    { value: DispatchType.REGISTERED_LETTER, label: 'Lettre recommandée' },
    { value: DispatchType.EMAIL, label: 'E-mail' },
    { value: DispatchType.FAX, label: 'Fax' },
  ];

  // ── Permissions ────────────────────────────────────────────────────────────
  canReadCorresp = false;
  canWriteCorresp = false;
  canDeleteCorresp = false;
  canAdminCorresp = false;
  taskPermissions: { [key: number]: PermissionDTO } = {};
  userAclTaskIds: Set<number> = new Set<number>();
  private userAclTasksMap: Map<number, ITasks> = new Map();
  private currentAccountLogin: string | null = null;
  private currentUserId: string | null = null;
  isGlobalAdmin = false;
  isAdminOrBoc = false;

  // ── Cache résolution noms depts ────────────────────────────────────────────
  private deptNameByCode: Map<string, string> = new Map();

  // ── Email receiver / CC (depuis N8N/message) ───────────────────────────────
  messageReceiverEmails: string[] = [];
  messageCopyToEmails: string[] = [];

  // ── Modal email avant soumission (OUTGOING spécifique) ─────────────────────
  models: IModelNotif[] = [];
  selectedModelNotifForSubmit: IModelNotif | null = null;
  currentUserFirstNameDetail = '';
  currentUserLastNameDetail = '';
  currentUserDepartementNameDetail = '';
  currentUserEmailDetail = '';
  draftEmailReceiver = '';
  draftEmailCopyTo = '';
  loadingModels = false;

  showEmailSubmitModal = false;
  isLoadingEmailPreview = false;
  emailPreviewHtml = '';
  emailPreviewSubject = '';
  emailPreviewFrom = '';
  emailPreviewTo = '';
  emailPreviewCc = '';
  emailPreviewModelName = '';
  emailPreviewError = '';
  isSendingEmailOnSubmit = false;
  sendEmailOnSubmitError = '';
  sendEmailOnSubmitSuccess = false;
  savedEmailMessageId: number | null = null;

  // ── PjCare / scan ──────────────────────────────────────────────────────────
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
  private _pendingDriverFromCookie = '';
  currentDocumentPages: ScannedPage[] = [];

  // ── Upload ─────────────────────────────────────────────────────────────────
  selectedPj: IPj | null = null;
  isUploading = false;
  uploadProgress: Map<string, number> = new Map();
  selectedPjToDelete!: IPj;

  // ── Tree expand state ──────────────────────────────────────────────────────
  expandedAffectations: Set<string> = new Set();
  expandedNodes: Set<number> = new Set();
  private levelPalette: string[] = ['#1e90ff', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6'];

  // ── Task comment state ─────────────────────────────────────────────────────
  validationErrors: { [key: string]: string } = {};
  taskCompletionState: Map<number, { showComment: boolean; comment: string }> = new Map();
  taskCancellationState: Map<number, { showComment: boolean; comment: string }> = new Map();

  @ViewChild('filePreview') filePreview!: FilePreviewComponent;

  // ── Windows-1256 table ─────────────────────────────────────────────────────
  private readonly WIN1256: number[] = [
    8364, 1662, 8218, 402, 8222, 8230, 8224, 8225, 710, 8240, 1657, 8249, 338, 1670, 1688, 1672, 1711, 8216, 8217, 8220, 8221, 8226, 8211,
    8212, 1705, 8482, 1681, 8250, 339, 8204, 8205, 1722, 160, 1548, 162, 163, 164, 165, 166, 167, 168, 169, 1726, 171, 172, 173, 174, 175,
    176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 1563, 187, 188, 189, 190, 1567, 1729, 1569, 1570, 1571, 1572, 1573, 1574, 1575, 1576,
    1577, 1578, 1579, 1580, 1581, 1582, 1583, 1584, 1585, 1586, 1587, 1588, 1589, 1590, 215, 1591, 1592, 1593, 1594, 1600, 1601, 1602, 1603,
    224, 1604, 226, 1605, 1606, 1607, 1608, 231, 232, 233, 234, 235, 1609, 1610, 238, 239, 1611, 1612, 1613, 1614, 244, 1615, 1616, 247,
    1617, 249, 1618, 251, 252, 8206, 8207, 1746,
  ];

  constructor(
    protected activatedRoute: ActivatedRoute,
    protected router: Router,
    private correspService: CorrespService,
    private typeDocumentService: TypedocumentService,
    private taskService: TasksService,
    private pjService: PjService,
    private modalService: NgbModal,
    protected contactCompanyService: ContactCompanyService,
    private accountService: AccountService,
    private sanitizer: DomSanitizer,
    private pjCareService: PjCareService,
    private scanSettingsService: ScanSettingsService,
    private modelNotifService: ModelNotifService
  ) {}

  // ── Getters ────────────────────────────────────────────────────────────────

  get isEditableLeft(): boolean {
    const st = this.correspLoaded?.status;
    return st === CorrespStatus.DRAFT || st === CorrespStatus.DISPATCH;
  }

  get safeHtmlContent(): SafeHtml {
    let raw = this.htmlContent || this.correspLoaded?.body || '';
    raw = this.fixWindows1256(raw);
    raw = raw.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    raw = raw.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '');
    raw = raw.replace(/<!--\[if[\s\S]*?<!\[endif\]-->/gi, '');
    const bodyMatch = raw.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) raw = bodyMatch[1];
    raw = this.fixArabicDirection(raw);
    return this.sanitizer.bypassSecurityTrustHtml(raw);
  }

  /**
   * OUTGOING : admin/boc OU ACL write — pas de restriction au rôle seul
   */
  get canSoumettreCorresp(): boolean {
    if (!this.correspLoaded) return false;
    const status = this.correspLoaded.status;
    if (status !== CorrespStatus.DRAFT && status !== CorrespStatus.DISPATCH) return false;
    return this.isAdminOrBoc || this.canWriteCorresp || this.canAdminCorresp;
  }

  /**
   * OUTGOING : admin/boc OU ACL write
   */
  get canCloturerCorresp(): boolean {
    if (!this.correspLoaded) return false;
    if (this.correspLoaded.status !== CorrespStatus.IN_PROGRESS) return false;
    return this.isAdminOrBoc || this.canWriteCorresp || this.canAdminCorresp;
  }

  /**
   * OUTGOING : toutes les tâches incluses (pas de filtre DRAFT pour les non-admins)
   */
  get taskCompletionPercentage(): number {
    if (!this.tachesAssociees || this.tachesAssociees.length === 0) return 0;
    const activeTasks = this.tachesAssociees.filter(t => t.status !== CorrespStatus.CANCELLED);
    if (activeTasks.length === 0) return 0;
    const closedTasks = activeTasks.filter(t => t.status === CorrespStatus.CLOSED).length;
    return Math.round((closedTasks / activeTasks.length) * 100);
  }

  get canManageAttachments(): boolean {
    if (this.canWriteCorresp || this.canAdminCorresp || this.isGlobalAdmin) return true;
    const accessibleTasks = (this.tachesAssociees || []).filter(t => this.userAclTaskIds.has(t.id));
    return accessibleTasks.some(t => {
      const tt = (t.taskType || '').toLowerCase();
      return (tt === 'traitement' || tt === 'signature' || tt === 'validation') && t.status === CorrespStatus.IN_PROGRESS;
    });
  }

  get visibleTasksCount(): number {
    // OUTGOING : toutes les tâches visibles (y compris DRAFT)
    return (this.tachesAssociees || []).length;
  }

  get isReadOnlyAclUser(): boolean {
    if (this.canWriteCorresp || this.canAdminCorresp || this.isGlobalAdmin) return false;
    const accessibleTasks = (this.tachesAssociees || []).filter(t => this.userAclTaskIds.has(t.id));
    if (accessibleTasks.length === 0) return false;
    const hasActiveWritableTask = accessibleTasks.some(t => {
      const tt = (t.taskType || '').toLowerCase();
      return (tt === 'traitement' || tt === 'signature' || tt === 'validation') && t.status === CorrespStatus.IN_PROGRESS;
    });
    if (hasActiveWritableTask) return false;
    return accessibleTasks.every(t => {
      const tt = (t.taskType || '').toLowerCase();
      return tt === 'lecture' || t.status === CorrespStatus.CLOSED;
    });
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.accountService.identity().subscribe(acc => {
      const roles = acc?.authorities ?? [];
      this.isGlobalAdmin = Array.isArray(roles) && roles.includes('ROLE_ADMIN');
      this.isAdminOrBoc = Array.isArray(roles) && (roles.includes(Authority.ADMIN) || roles.includes(Authority.BOC));
      this.applyDispatchPermissionsForAdminOrBoc();
      this.currentUserFirstNameDetail = (acc as any)?.firstName || '';
      this.currentUserLastNameDetail = (acc as any)?.lastName || '';
      this.currentUserEmailDetail = (acc as any)?.email || (acc as any)?.login || '';
    });

    this.modelNotifService.queryByFamilleEmail({ page: 0, size: 1000, sort: ['name,ASC'] }).subscribe({
      next: (res: HttpResponse<IModelNotif[]>) => {
        this.models = res.body || [];
      },
      error: () => {
        this.models = [];
      },
    });

    const qp = this.activatedRoute.snapshot.queryParamMap.get('taskId');
    this.selectedTaskId = qp != null && qp !== '' ? Number(qp) : null;
    this.onWindowResize();

    const id = this.activatedRoute.snapshot.paramMap.get('id');

    this.correspService.find(Number(id)).subscribe(res => {
      this.correspLoaded = res.body!;
      this.selectedOrgaCode = null;
      this.loadPermissionsForCorresp(Number(this.correspLoaded.id));
      this.objet = this.correspLoaded.subject || '';
      this.expediteur = this.correspLoaded.sender || '';
      this.destinataireLabel = this.correspLoaded.labelDestinataire || '';
      this.contactEmail = this.correspLoaded.contactEmail || '';
      this.contactEmailCCLabel = this.correspLoaded.labelContactCC || '';

      if (this.correspLoaded.contactCopies?.length) {
        this.selectedCcDepts = this.correspLoaded.contactCopies.map(cc => ({
          id: cc.id ?? null,
          idCorrsp: cc.idCorrsp ?? null,
          idDept: cc.idDept ?? null,
          codeDept: cc.codeDept ?? null,
          nomDept: cc.nomDept ?? null,
          emailDept: cc.emailDept ?? null,
        }));
      } else if (this.contactEmailCCLabel) {
        this.selectedCcDepts = this.contactEmailCCLabel
          .split(',')
          .map(s => s.trim())
          .filter(s => s.length > 0)
          .map(name => ({ nomDept: name, codeDept: name }));
      }

      this.date = this.correspLoaded.courrierDate ? dayjs(this.correspLoaded.courrierDate).format('YYYY-MM-DD') : '';
      this.reponseSur = this.correspLoaded.responseTo || '';
      this.referenceEmetteur = this.correspLoaded.senderReference || '';
      this.priorite = this.correspLoaded.priority || false;
      this.dispatchType = (this.correspLoaded.dispatchType as DispatchType) || '';
      this.correspType = 'Sortant';

      this.correspService.loadDraftBody(this.correspLoaded.id).subscribe({
        next: (body: string) => {
          this.htmlContent = body;
        },
        error: () => {
          this.correspService.loadBodyFromFile({ correspId: this.correspLoaded.id }).subscribe({
            next: res => {
              this.htmlContent = res;
            },
            error: () => {
              this.htmlContent = '';
            },
          });
        },
      });

      const codeUniqueSociete = this.correspLoaded.codeUniqueSociete ?? null;
      this.typeDocumentService.findByCorrespType('Sortant', codeUniqueSociete).subscribe(res => {
        this.typedocuments = res.body || [];
        const autre: ITypedocument = {
          id: 0,
          nom: 'Autre',
          defautdest: null,
          defaultobject: null,
          defaultencopie: null,
          labelDD: null,
          labelDCC: null,
          correspType: null,
          usualstatus: null,
        };
        this.typedocuments.push(autre);
        const found = this.correspLoaded.typeDocumentId
          ? this.typedocuments.find(td => td.id === Number(this.correspLoaded.typeDocumentId))
          : null;
        this.selectedTypeDocument = found ?? null;
        this.onTypeDocumentChange();
        this.objet = this.correspLoaded.subject || '';
      });
    });

    this.taskService.getAllTasksByCorrespId({ correspId: Number(id) }).subscribe(res => {
      const list = res.body || [];
      this.taskService.enrichTasksWithCanModify(list).subscribe(enriched => {
        this.tachesAssociees = enriched || [];
        this.resolveResponsableNames();
        this.refreshUserAclEnablement();
        this.recomputeCorrespPermsFromUserAclTasks();
        setTimeout(() => this.scrollToTaskIfRequested(), 0);
      });
    });

    this.pjService.getAllPjByCorrespId({ correspId: Number(id) }).subscribe(res => {
      this.pjsLoaded = res.body || [];
    });

    this.correspService.getMessagesByCorrespId(Number(id)).subscribe({
      next: (res: HttpResponse<any[]>) => {
        const messages = res.body;
        if (messages?.length) {
          const msg = messages[0];
          this.messageReceiverEmails = this.extractEmails(msg.receiver);
          this.messageCopyToEmails = this.extractEmails(msg.copyTo);
          this.draftEmailReceiver = this.messageReceiverEmails.join(', ');
          this.draftEmailCopyTo = this.messageCopyToEmails.join(', ');
        }
      },
      error: () => {
        this.messageReceiverEmails = [];
        this.messageCopyToEmails = [];
      },
    });

    this.loadActiveCompanies();
  }

  extractEmails(data: any): string[] {
    if (!data) {
      return [];
    }
    // Cas 1 : déjà un tableau (JSON désérialisé par Angular/HttpClient)
    if (Array.isArray(data)) {
      return this.extractEmailsFromArray(data);
    }
    if (typeof data === 'string') {
      const trimmed = data.trim();
      // Cas 2 : chaîne JSON stringifiée — ex: '[{"email":"a@b.com"}]'
      if (trimmed.startsWith('[')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            return this.extractEmailsFromArray(parsed);
          }
        } catch {
          // Pas du JSON valide — essayer le format Java toString
          // Format Java: [{email=a@b.com}, {email=b@c.com}]
          const javaPattern = /\{[^}]*email\s*=\s*([^,}]+)/g;
          let match: RegExpExecArray | null;
          const results: string[] = [];
          while ((match = javaPattern.exec(trimmed)) !== null) {
            const email = match[1].trim();
            if (email) {
              results.push(email);
            }
          }
          if (results.length > 0) {
            return results;
          }
        }
      }
      // Cas 3 : chaîne brute séparée par virgules/points-virgules — ex: "a@b.com, c@d.com"
      return trimmed
        .split(/[,;]+/)
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0);
    }
    return [String(data)];
  }

  private extractEmailsFromArray(arr: any[]): string[] {
    return arr
      .map((entry: any) => {
        if (typeof entry === 'object' && entry !== null && entry.email) {
          return entry.email;
        }
        if (typeof entry === 'string') {
          return entry.trim();
        }
        return String(entry);
      })
      .filter((e: string) => !!e);
  }

  @HostListener('window:resize', [])
  onWindowResize(): void {
    const isMobile = window.innerWidth < 768;
    this.accordionStates['infoGen'] = !isMobile;
  }

  // ── Permissions ────────────────────────────────────────────────────────────

  loadPermissionsForCorresp(correspId: number): void {
    if (!correspId) return;
    this.correspService.getPermissions(correspId).subscribe({
      next: (res: CorrespPermissionsDTO) => {
        const p = res?.corresp || { canRead: false, canWrite: false, canDelete: false, canAdmin: false };
        this.canReadCorresp = p.canRead;
        this.canWriteCorresp = p.canWrite;
        this.canDeleteCorresp = p.canDelete;
        this.canAdminCorresp = p.canAdmin;
        if (this.isGlobalAdmin) {
          this.canReadCorresp = this.canWriteCorresp = this.canDeleteCorresp = this.canAdminCorresp = true;
        }
        if (this.isAdminOrBoc && this.correspLoaded?.status === CorrespStatus.DISPATCH) {
          this.canReadCorresp = this.canWriteCorresp = this.canDeleteCorresp = this.canAdminCorresp = true;
        }
        this.taskPermissions = {};
        const rawTasks = (res && (res as any).tasksPermissions) || {};
        Object.keys(rawTasks).forEach(k => {
          const id = Number(k);
          if (!isNaN(id)) this.taskPermissions[id] = rawTasks[k] as PermissionDTO;
        });
        if (this.canReadCorresp || this.isGlobalAdmin) {
          if (!(this.canAdminCorresp || this.isGlobalAdmin)) {
            this.loadCurrentUserAndAclTasks(() => {
              if (!this.canWriteCorresp) this.recomputeCorrespPermsFromUserAclTasks();
            });
          }
          return;
        }
        this.loadCurrentUserAndAclTasks(() => this.recomputeCorrespPermsFromUserAclTasks());
      },
      error: () => {
        this.canReadCorresp = this.canWriteCorresp = this.canDeleteCorresp = this.canAdminCorresp = false;
        this.applyDispatchPermissionsForAdminOrBoc();
        this.loadCurrentUserAndAclTasks(() => this.recomputeCorrespPermsFromUserAclTasks());
      },
    });
  }

  private applyDispatchPermissionsForAdminOrBoc(): void {
    if (this.isAdminOrBoc && this.correspLoaded?.status === CorrespStatus.DISPATCH) {
      this.canReadCorresp = this.canWriteCorresp = this.canDeleteCorresp = this.canAdminCorresp = true;
    }
  }

  private loadCurrentUserAndAclTasks(callback?: () => void): void {
    this.accountService.identity().subscribe((acc: Account | null) => {
      const uid: string | null = acc != null ? (acc as any).id ?? null : null;
      this.currentAccountLogin = acc?.login ?? null;
      if (uid != null) {
        this.currentUserId = uid;
        this.taskService.getAllTasksByUserAclAllStatuses(uid).subscribe({
          next: resp => {
            const list = resp.body || [];
            const ids = new Set<number>();
            this.userAclTasksMap.clear();
            list.forEach(t => {
              const tid: any = (t as any)?.id;
              const numId = typeof tid === 'string' ? Number(tid) : tid;
              if (typeof numId === 'number' && !isNaN(numId)) {
                ids.add(numId);
                this.userAclTasksMap.set(numId, t);
              }
            });
            this.userAclTaskIds = ids;
            this.enrichTachesAssocieesFromAclTasks();
            this.refreshUserAclEnablement();
            if (callback) callback();
          },
          error: () => {
            this.userAclTaskIds.clear();
            this.userAclTasksMap.clear();
            if (callback) callback();
          },
        });
      } else {
        this.userAclTaskIds.clear();
        this.userAclTasksMap.clear();
        if (callback) callback();
      }
    });
  }

  private refreshUserAclEnablement(): void {}

  private enrichTachesAssocieesFromAclTasks(): void {
    if (!this.tachesAssociees?.length || !this.userAclTasksMap.size) return;
    let enriched = false;
    this.tachesAssociees.forEach(task => {
      const aclTask = this.userAclTasksMap.get(task.id);
      if (aclTask) {
        const aclResponsables = (aclTask as any).responsables;
        if (Array.isArray(aclResponsables) && aclResponsables.length > 0) {
          (task as any).responsables = aclResponsables;
          enriched = true;
        }
      }
    });
    if (enriched) this.resolveResponsableNames();
  }

  private recomputeCorrespPermsFromUserAclTasks(): void {
    if (this.isGlobalAdmin) return;
    if (this.isAdminOrBoc && this.correspLoaded?.status === CorrespStatus.DISPATCH) {
      this.canReadCorresp = this.canWriteCorresp = this.canDeleteCorresp = this.canAdminCorresp = true;
      return;
    }
    if (this.canReadCorresp && this.canWriteCorresp) return;
    if (!this.tachesAssociees?.length || !this.userAclTaskIds.size) return;

    const correspTaskIds = this.tachesAssociees.map(t => t.id);
    const accessibleTaskIds = correspTaskIds.filter(id => this.userAclTaskIds.has(id));

    if (accessibleTaskIds.length === 0 && this.selectedTaskId != null && this.userAclTaskIds.has(this.selectedTaskId)) {
      accessibleTaskIds.push(this.selectedTaskId);
    }
    if (accessibleTaskIds.length === 0) return;

    if (!this.canReadCorresp) this.canReadCorresp = true;

    if (!this.canWriteCorresp) {
      const accessibleTasks = this.tachesAssociees.filter(t => accessibleTaskIds.includes(t.id));
      const hasWritableTask = accessibleTasks.some(t => {
        const tt = (t.taskType || '').toLowerCase();
        return (tt === 'traitement' || tt === 'signature' || tt === 'validation') && t.status === CorrespStatus.IN_PROGRESS;
      });
      if (hasWritableTask) this.canWriteCorresp = true;
    }
  }

  // ── Résolution noms responsables ───────────────────────────────────────────

  private resolveResponsableNames(): void {
    const tasks = this.tachesAssociees || [];
    if (!tasks.length) return;
    const codesToResolve = new Set<string>();
    tasks.forEach(t => {
      const responsables = (t as any).responsables;
      if (Array.isArray(responsables) && responsables.length > 0) {
        responsables.forEach((r: any) => {
          if (!r) return;
          if (!r.personneName && !r.deptName && r.codeDept) {
            const code = r.codeDept.toString().trim();
            if (code && !this.deptNameByCode.has(code)) codesToResolve.add(code);
          }
        });
      } else if ((t as any).responsible) {
        const code = ((t as any).responsible || '').toString().trim();
        if (code && !this.deptNameByCode.has(code)) codesToResolve.add(code);
      } else {
        const extracted = this.extractResponsableFromObject(t.object);
        if (extracted) {
          const code = extracted.trim();
          if (code && !this.deptNameByCode.has(code)) codesToResolve.add(code);
        }
      }
    });

    const missing = Array.from(codesToResolve);
    if (!missing.length) {
      this.buildResponsableNamesForTasks();
      return;
    }

    const calls = missing.map(code =>
      this.correspService.queryOrgaDepsByCode({ code }).pipe(catchError(() => of(new HttpResponse({ body: null }))))
    );
    forkJoin(calls).subscribe({
      next: responses => {
        responses.forEach((res, idx) => {
          const dep = res.body as any;
          const code = missing[idx];
          const name = dep ? dep.nom || dep.name || dep.libelle || dep.description || dep.code || code : code;
          this.deptNameByCode.set(code, name || code);
        });
      },
      complete: () => this.buildResponsableNamesForTasks(),
    });
  }

  private buildResponsableNamesForTasks(): void {
    (this.tachesAssociees || []).forEach(task => {
      const displays: string[] = [];
      const responsables = (task as any).responsables;
      if (Array.isArray(responsables) && responsables.length > 0) {
        responsables.forEach((r: any) => {
          if (!r) return;
          const pName = r.personneName;
          const dName = r.deptName;
          const codeDept = r.codeDept;
          const matricule = r.matriculePers;
          if (pName?.toString().trim()) displays.push(pName.toString().trim());
          else if (dName?.toString().trim()) displays.push(dName.toString().trim());
          else if (codeDept?.toString().trim()) {
            const code = codeDept.toString().trim();
            displays.push(this.deptNameByCode.get(code) || code);
          } else if (matricule?.toString().trim()) displays.push(matricule.toString().trim());
        });
      } else if ((task as any).responsible) {
        const code = ((task as any).responsible || '').toString().trim();
        if (code) displays.push(this.deptNameByCode.get(code) || code);
      } else {
        const extracted = this.extractResponsableFromObject(task.object);
        if (extracted) {
          const code = extracted.trim();
          displays.push(this.deptNameByCode.get(code) || code);
        }
      }
      const uniq = Array.from(new Set(displays.map(d => (d || '').trim()).filter(s => !!s)));
      if (uniq.length > 0) task.responsableName = uniq.join(', ');
      else if (!task.responsableName?.trim()) task.responsableName = null;
    });
  }

  private extractResponsableFromObject(object?: string | null): string | null {
    if (!object) return null;
    const obj = object.trim();
    const idx = obj.indexOf(' effectuera la tâche de ');
    if (idx > 0) return obj.substring(0, idx).trim() || null;
    return null;
  }

  private scrollToTaskIfRequested(): void {
    if (this.selectedTaskId != null) {
      this.accordionStates['taches'] = true;
      const el = document.getElementById(`task-${this.selectedTaskId}`);
      if (el) (el as any).scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  // ── Type document ──────────────────────────────────────────────────────────

  onTypeDocumentChange(newSelected?: ITypedocument | null): void {
    this.selectedTypeDocument = newSelected ?? this.selectedTypeDocument ?? null;

    if (!this.selectedTypeDocument) {
      if (newSelected !== undefined) this.objet = '';
      this.objet = '';
      this.destinataire = '';
      this.destinataireLabel = '';
      this.recipientSelectedDept = null;
      this.contactEmailCC = '';
      this.contactEmailCCLabel = '';
      this.selectedCcDepts = [];
      this.pendingTasks = [];
      return;
    }

    if (newSelected !== undefined && !this.objet?.trim()) {
      this.objet = this.selectedTypeDocument.defaultobject || '';
    }

    if (newSelected === undefined) {
      this.pendingTasks = [];
      return;
    }

    this.destinataire = '';
    this.destinataireLabel = '';
    this.recipientSelectedDept = null;
    this.contactEmailCC = '';
    this.contactEmailCCLabel = '';
    this.selectedCcDepts = [];
    this.pendingTasks = [];

    const typeName = (this.selectedTypeDocument?.nom || '').trim().toLowerCase();
    const is = (s: string) => typeName === s.toLowerCase();

    if (is('autre')) {
      this.destinataire = '';
      this.destinataireLabel = '';
      return;
    }

    if (this.selectedTypeDocument.defautdest) {
      this.correspService.queryOrgaDepsByCode({ code: this.selectedTypeDocument.defautdest }).subscribe({
        next: (res: HttpResponse<IDepartement>) => {
          if (res.body) {
            this.destinataire = res.body.email || '';
            this.destinataireLabel = res.body.nom || '';
            this.pendingTasks = this.pendingTasks.filter(t => t.typeTask !== 'traitement');
            this.pendingTasks.push({
              typeTask: 'traitement',
              responsable: res.body.code ?? '',
              dateLimite: '',
              responsableName: res.body.nom ?? '',
              commentaire: '',
            });
          } else {
            this.destinataire = '';
            this.destinataireLabel = this.selectedTypeDocument!.labelDD || '';
            this.pendingTasks = this.pendingTasks.filter(t => t.typeTask !== 'traitement');
          }
        },
        error: () => {
          this.destinataire = '';
          this.destinataireLabel = this.selectedTypeDocument!.labelDD || '';
          this.pendingTasks = this.pendingTasks.filter(t => t.typeTask !== 'traitement');
        },
      });
    } else {
      this.destinataire = '';
      this.destinataireLabel = this.selectedTypeDocument.labelDD || '';
      this.pendingTasks = this.pendingTasks.filter(t => t.typeTask !== 'traitement');
    }

    if (this.selectedTypeDocument.defaultencopie) {
      this.correspService.queryOrgaDepsByCode({ code: this.selectedTypeDocument.defaultencopie }).subscribe({
        next: (res: HttpResponse<IDepartement>) => {
          if (res.body) {
            this.selectedCcDepts = [
              {
                idDept: res.body.id ?? null,
                codeDept: res.body.code ?? '',
                nomDept: res.body.nom ?? '',
                emailDept: res.body.email ?? '',
              },
            ];
            this.updateCcLabelsFromSelection();
            this.pendingTasks = this.pendingTasks.filter(t => t.typeTask !== 'lecture');
            this.pendingTasks.push({
              typeTask: 'lecture',
              responsable: res.body.code ?? '',
              dateLimite: '',
              responsableName: res.body.nom ?? '',
              commentaire: '',
            });
          } else {
            this.selectedCcDepts = [];
            this.contactEmailCC = '';
            this.contactEmailCCLabel = this.selectedTypeDocument!.labelDCC || '';
            this.pendingTasks = this.pendingTasks.filter(t => t.typeTask !== 'lecture');
          }
        },
        error: () => {
          this.selectedCcDepts = [];
          this.contactEmailCC = '';
          this.contactEmailCCLabel = this.selectedTypeDocument!.labelDCC || '';
          this.pendingTasks = this.pendingTasks.filter(t => t.typeTask !== 'lecture');
        },
      });
    } else {
      this.selectedCcDepts = [];
      this.contactEmailCC = '';
      this.contactEmailCCLabel = this.selectedTypeDocument.labelDCC || '';
      this.pendingTasks = this.pendingTasks.filter(t => t.typeTask !== 'lecture');
    }
  }

  // ── Sociétés / contacts ────────────────────────────────────────────────────

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
    const id = companyId != null && companyId !== '' ? Number(companyId) : null;
    this.selectedCompanyId = id;
    this.personsForSelectedCompany = [];
    this.selectedPersonId = null;
    this.contactEmail = '';
    if (id) {
      const company = this.companies.find(c => c.id === id);
      this.expediteur = company ? company.nom || '' : '';
    } else if (!this.showManualExpediteur) {
      this.expediteur = '';
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
    this.contactEmail = p ? p.email || p.whatsapp || p.tel || p.nom || '' : '';
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
      if (!this.companies?.length) this.loadActiveCompanies();
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

  // ── Sauvegarde brouillon ───────────────────────────────────────────────────

  saveDraft(): void {
    if (!this.correspLoaded) {
      this.showNotification('Aucune correspondance chargée !', 'error');
      return;
    }
    if (!(this.canWriteCorresp || this.canAdminCorresp)) {
      this.showNotification("Vous n'avez pas le droit d'enregistrer ce brouillon", 'error');
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
      corresptype: 'OUTGOING',
      dispatchType: this.correspLoaded.dispatchType || 'NORMAL',
      labelDestinataire: this.destinataireLabel || '',
      labelContactCC: this.contactEmailCCLabel || '',
      msgSender: this.currentUserEmailDetail || '',
      msgReceiver: this.messageReceiverEmails.join(', ') || this.draftEmailReceiver || '',
      msgCopyTo: this.messageCopyToEmails.join(', ') || this.draftEmailCopyTo || '',
    };

    this.isSaving = true;

    this.correspService.updateCorrespDraft(this.correspLoaded.id, correspDTO, this.selectedTypeDocument!).subscribe({
      next: res => {
        this.isSaving = false;
        this.correspLoaded = res.body!;
        this.correspService.loadBodyFromFile({ correspId: this.correspLoaded.id }).subscribe(body => {
          this.htmlContent = body;
        });

        if (this.pendingTasks.length > 0) {
          const tasksToSend = [...this.pendingTasks];
          this.pendingTasks = [];
          const sendNext = (index: number): void => {
            if (index >= tasksToSend.length) {
              this.taskService.getAllTasksByCorrespId({ correspId: this.correspLoaded.id }).subscribe(r => {
                const list = r.body || [];
                this.taskService.enrichTasksWithCanModify(list).subscribe(enriched => {
                  this.tachesAssociees = enriched || [];
                  this.pendingTasks = [];
                  this.resolveResponsableNames();
                });
              });
              this.showNotification('Brouillon et tâches enregistrés avec succès !', 'success');
              return;
            }
            const t = tasksToSend[index];
            const taskModel: any = {
              object: `${t.responsableName} effectuera la tâche de ${t.typeTask.toUpperCase()}`,
              taskType: t.typeTask,
              commentaire: t.commentaire || null,
              responsible: t.responsable,
              dueDate: t.dateLimite ? dayjs(t.dateLimite).toISOString() : null,
              responsables: t.responsable ? [{ codeDept: t.responsable }] : [],
            };
            this.correspService.addTaskToCorresp(taskModel, this.correspLoaded.id).subscribe({
              next: () => sendNext(index + 1),
              error: () => sendNext(index + 1),
            });
          };
          sendNext(0);
        } else {
          this.showNotification('Brouillon enregistré avec succès !', 'success');
        }
      },
      error: err => {
        this.isSaving = false;
        console.error('Erreur mise à jour brouillon', err);
        this.showNotification("Erreur lors de l'enregistrement du brouillon", 'error');
      },
    });
  }

  // ── Génération référence ───────────────────────────────────────────────────

  generateReference(): void {
    if (!this.correspLoaded?.id) return;
    if (!(this.canWriteCorresp || this.canAdminCorresp)) {
      this.showNotification("Vous n'avez pas le droit de générer une référence", 'error');
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
      corresptype: 'OUTGOING',
      dispatchType: this.correspLoaded.dispatchType || 'NORMAL',
      labelDestinataire: this.destinataireLabel || '',
      labelContactCC: this.contactEmailCCLabel || '',
    };

    this.isSaving = true;

    this.correspService.updateCorrespDraft(this.correspLoaded.id, correspDTO, this.selectedTypeDocument).subscribe({
      next: res => {
        this.correspLoaded = res.body!;
        if (this.pendingTasks.length > 0) {
          const tasksToSend = [...this.pendingTasks];
          this.pendingTasks = [];
          const sendNext = (index: number): void => {
            if (index >= tasksToSend.length) {
              this.doGenerateReference();
              return;
            }
            const t = tasksToSend[index];
            const taskModel: any = {
              object: `${t.responsableName} effectuera la tâche de ${t.typeTask.toUpperCase()}`,
              taskType: t.typeTask,
              commentaire: t.commentaire || null,
              responsible: t.responsable,
              dueDate: t.dateLimite ? dayjs(t.dateLimite).toISOString() : null,
              responsables: t.responsable ? [{ codeDept: t.responsable }] : [],
            };
            this.correspService.addTaskToCorresp(taskModel, this.correspLoaded.id).subscribe({
              next: () => sendNext(index + 1),
              error: () => sendNext(index + 1),
            });
          };
          sendNext(0);
        } else {
          this.doGenerateReference();
        }
      },
      error: err => {
        this.isSaving = false;
        console.error('Erreur sauvegarde avant génération référence', err);
        this.showNotification("Erreur lors de l'enregistrement du brouillon", 'error');
      },
    });
  }

  private doGenerateReference(): void {
    this.correspService.generateReferenceForCorresp(this.correspLoaded.id).subscribe({
      next: (refRes: ICorresp) => {
        this.isSaving = false;
        this.correspLoaded.reference = refRes.reference;
        this.taskService.getAllTasksByCorrespId({ correspId: this.correspLoaded.id }).subscribe(r => {
          const list = r.body || [];
          this.taskService.enrichTasksWithCanModify(list).subscribe(enriched => {
            this.tachesAssociees = enriched || [];
            this.resolveResponsableNames();
          });
        });
        this.showNotification(`Brouillon enregistré et référence générée${refRes.reference ? ' : ' + refRes.reference : ''}`, 'success');
      },
      error: err => {
        this.isSaving = false;
        console.error('Erreur génération référence :', err);
        this.showNotification('Brouillon enregistré mais impossible de générer la référence', 'error');
      },
    });
  }

  // ── Soumission (OUTGOING : ouvre modal email si dispatch EMAIL) ────────────

  soumettreCorresp(correspId: number): void {
    if (!this.canSoumettreCorresp) {
      this.showNotification("Vous n'avez pas le droit de soumettre ce courrier", 'error');
      return;
    }
    if (this.correspLoaded?.dispatchType === 'EMAIL') {
      this.openEmailSubmitModal(correspId);
      return;
    }
    this.doSoumettreCorresp(correspId);
  }

  doSoumettreCorresp(correspId: number): void {
    this.correspService.soumettreCorresp({ correspId }).subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: err => {
        console.error(err);
        this.showNotification('Erreur', 'error');
      },
    });
  }

  cloturerCorresp(correspId: number): void {
    if (!this.canCloturerCorresp) {
      this.showNotification("Vous n'avez pas le droit de clôturer ce courrier", 'error');
      return;
    }

    this.correspService.cloturerCorresp({ correspId }).subscribe({
      next: () => {
        window.location.reload();
      },
      error: err => {
        console.error(err);
        this.showNotification('Erreur', 'error');
      },
    });
  }

  deleteCorresp(): void {
    if (!(this.canDeleteCorresp || this.canAdminCorresp)) {
      this.showNotification("Vous n'avez pas le droit de supprimer cette correspondance", 'error');
      return;
    }
    if (!confirm('Confirmez-vous la suppression de cette correspondance ?')) return;
    if (!this.correspLoaded?.id) {
      this.showNotification('Aucune correspondance chargée', 'error');
      return;
    }
    this.correspService.delete(this.correspLoaded.id).subscribe({
      next: () => {
        this.showNotification('Correspondance supprimée', 'success');
        this.router.navigate(['/corresp']);
      },
      error: err => {
        console.error('Erreur suppression correspondance', err);
        this.showNotification('Erreur lors de la suppression', 'error');
      },
    });
  }

  // ── Modal email avant soumission (OUTGOING spécifique) ─────────────────────

  openEmailSubmitModal(correspId: number): void {
    this.showEmailSubmitModal = true;
    this.isLoadingEmailPreview = true;
    this.emailPreviewHtml = '';
    this.emailPreviewError = '';
    this.sendEmailOnSubmitError = '';
    this.sendEmailOnSubmitSuccess = false;
    this.savedEmailMessageId = null;

    const modelToUse = this.selectedModelNotifForSubmit || this.models[0] || null;
    if (!modelToUse) {
      this.emailPreviewError = 'Aucun modèle email disponible. Vous pouvez soumettre sans envoyer.';
      this.isLoadingEmailPreview = false;
      return;
    }
    this.selectedModelNotifForSubmit = modelToUse;

    const dateFormatted = this.correspLoaded?.courrierDate
      ? new Date(this.correspLoaded.courrierDate.toString()).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : '';

    const receiverEmail = this.messageReceiverEmails.join(', ') || this.correspLoaded?.contactEmail || '';
    const ccEmail = this.messageCopyToEmails.join(', ') || '';

    const request = {
      modelNotifId: modelToUse.id,
      receiver: receiverEmail,
      copyTo: ccEmail,
      correspBody: this.htmlContent || '',
      senderFullName: [this.currentUserFirstNameDetail, this.currentUserLastNameDetail].filter(Boolean).join(' '),
      senderDepartement: this.correspLoaded?.sender || '',
      senderEmail: this.currentUserEmailDetail || '',
      correspObjet: this.correspLoaded?.subject || '',
      correspDate: dateFormatted,
      correspReference: this.correspLoaded?.reference || null,
      destinataireLabel: this.correspLoaded?.labelDestinataire || '',
    };

    this.correspService.previewCorrespEmail(request).subscribe({
      next: res => {
        this.emailPreviewHtml = res.html;
        this.emailPreviewSubject = res.subject;
        this.emailPreviewFrom = res.from;
        this.emailPreviewTo = res.to;
        this.emailPreviewCc = res.cc;
        this.emailPreviewModelName = res.modelName;
        this.isLoadingEmailPreview = false;
      },
      error: () => {
        this.emailPreviewError = "Impossible de charger l'aperçu. Vous pouvez soumettre sans envoyer.";
        this.isLoadingEmailPreview = false;
      },
    });
  }

  closeEmailSubmitModal(): void {
    this.showEmailSubmitModal = false;
  }

  submitWithoutEmail(): void {
    this.closeEmailSubmitModal();
    this.doSoumettreCorresp(this.correspLoaded.id);
  }

  submitAndSendEmail(): void {
    if (this.isSendingEmailOnSubmit) return;
    this.isSendingEmailOnSubmit = true;
    this.sendEmailOnSubmitError = '';

    const modelToUse = this.selectedModelNotifForSubmit;
    if (!modelToUse) {
      this.isSendingEmailOnSubmit = false;
      this.doSoumettreCorresp(this.correspLoaded.id);
      return;
    }

    const dateFormatted = this.correspLoaded?.courrierDate
      ? new Date(this.correspLoaded.courrierDate.toString()).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : '';
    const receiverEmail = this.messageReceiverEmails.join(', ') || this.correspLoaded?.contactEmail || '';
    const ccEmail = this.messageCopyToEmails.join(', ') || '';

    const request = {
      correspId: this.correspLoaded.id,
      modelNotifId: modelToUse.id,
      receiver: receiverEmail,
      copyTo: ccEmail,
      correspBody: this.htmlContent || '',
      senderFullName: [this.currentUserFirstNameDetail, this.currentUserLastNameDetail].filter(Boolean).join(' '),
      senderDepartement: this.correspLoaded?.sender || '',
      senderEmail: this.currentUserEmailDetail || '',
      correspObjet: this.correspLoaded?.subject || '',
      correspDate: dateFormatted,
      correspReference: this.correspLoaded?.reference || null,
      destinataireLabel: this.correspLoaded?.labelDestinataire || '',
    };

    this.correspService.sendEmailDirect(request).subscribe({
      next: () => {
        this.isSendingEmailOnSubmit = false;
        this.sendEmailOnSubmitSuccess = true;
        setTimeout(() => {
          this.closeEmailSubmitModal();
          this.doSoumettreCorresp(this.correspLoaded.id);
        }, 1500);
      },
      error: err => {
        this.isSendingEmailOnSubmit = false;
        this.sendEmailOnSubmitError = err?.error?.error || "Échec de l'envoi email. Vous pouvez soumettre sans envoyer.";
      },
    });
  }

  // ── Tâches ─────────────────────────────────────────────────────────────────

  openTasksModal(content: any): void {
    if (!this.canWriteCorresp && !this.canAdminCorresp && !this.isGlobalAdmin && !this.isReadOnlyAclUser) {
      this.showNotification("Vous n'avez pas le droit d'ajouter une tâche sur ce courrier", 'error');
      return;
    }
    this.editingPendingTaskIndex = -1;
    this.selectedDepartement = '';
    this.resetForm();
    if (this.isReadOnlyAclUser) this.selectedType = 'lecture';
    this.prepareAndLoadOrgaThenTree();
    this.modalService.open(content, { size: 'xl' });
  }

  saveTask(): void {
    if (this.btnSaveTaskDisabled) return;
    this.validationErrors = {};
    if (!this.validateForm()) return;

    if (this.editingPendingTaskIndex >= 0) {
      const updated = {
        typeTask: this.selectedType,
        responsable: this.selectedResponsables[0]?.codeDept ?? this.selectedDepartement ?? '',
        dateLimite: this.dateLimite,
        responsableName: this.selectedResponsables[0]?.displayName ?? this.selectedDepartementName ?? '',
        commentaire: this.commentaire,
      };
      const oldTask = this.pendingTasks[this.editingPendingTaskIndex];
      if (updated.typeTask === 'traitement' && updated.responsable !== oldTask.responsable) {
        this.destinataireLabel = updated.responsableName;
        this.destinataire = '';
      }
      if (updated.typeTask === 'lecture' && updated.responsable !== oldTask.responsable) {
        const ccIdx = this.selectedCcDepts.findIndex(cc => cc.codeDept === oldTask.responsable || cc.nomDept === oldTask.responsableName);
        if (ccIdx >= 0) {
          this.selectedCcDepts[ccIdx] = { ...this.selectedCcDepts[ccIdx], codeDept: updated.responsable, nomDept: updated.responsableName };
          this.updateCcLabelsFromSelection();
        }
      }
      this.pendingTasks[this.editingPendingTaskIndex] = updated;
      this.editingPendingTaskIndex = -1;
      this.resetForm();
      this.modalService.dismissAll();
      return;
    }

    const canAddTask =
      this.canWriteCorresp || this.canAdminCorresp || this.isGlobalAdmin || (this.isReadOnlyAclUser && this.selectedType === 'lecture');
    if (!canAddTask) {
      this.showNotification("Vous n'avez pas le droit d'ajouter une tâche sur ce courrier", 'error');
      return;
    }

    this.btnSaveTaskDisabled = true;
    const responsibleText = this.getResponsablesSummary() || this.selectedDepartement || '';
    const taskTypeText = this.selectedType ? this.selectedType.toUpperCase() : 'N/A';
    let objectBuilder = `${responsibleText} effectuera la tâche de ${taskTypeText}`;
    if (this.dateLimite) objectBuilder += ` en ne dépassant pas la date limite du ${dayjs(this.dateLimite).format('DD/MM/YYYY')}`;

    const taskModel: any = {
      object: objectBuilder,
      taskType: this.selectedType || null,
      commentaire: this.commentaire || null,
      responsible: responsibleText || this.selectedDepartement || null,
      dueDate: this.dateLimite ? this.toIso(dayjs(this.dateLimite)) : null,
      responsables: (this.selectedResponsables || [])
        .map(r => {
          const out: any = {};
          if (r.codeDept) out.codeDept = r.codeDept;
          if (r.matriculePers) out.matriculePers = r.matriculePers;
          return out;
        })
        .filter(x => Object.keys(x).length > 0),
    };

    this.correspService.addTaskToCorresp(taskModel, this.correspLoaded.id).subscribe({
      next: () => {
        this.btnSaveTaskDisabled = false;
        this.resetForm();
        this.modalService.dismissAll();
        this.taskService.getAllTasksByCorrespId({ correspId: this.correspLoaded.id }).subscribe(r => {
          const list = r.body || [];
          this.taskService.enrichTasksWithCanModify(list).subscribe(enriched => {
            this.tachesAssociees = enriched || [];
          });
        });
        this.showNotification('Tâche ajoutée avec succès', 'success');
      },
      error: err => {
        this.btnSaveTaskDisabled = false;
        console.error('Erreur ajout tâche', err);
        if (err?.error?.fieldErrors?.length) {
          err.error.fieldErrors.forEach((fe: any) => {
            this.validationErrors[fe.field] = fe.message || 'Valeur invalide';
          });
          this.showNotification('Erreur de validation : corrigez les champs indiqués', 'error');
        } else {
          this.showNotification("Erreur lors de l'ajout de la tâche (serveur)", 'error');
        }
      },
    });
  }

  deleteTask(correspId: number, tasksId: number): void {
    const isAdminEffective = this.isGlobalAdmin || this.canAdminCorresp;
    const canModifyLocal = !!(this.tachesAssociees.find(t => (t as any)?.id === tasksId) as any)?.canModify;
    if (!isAdminEffective && !canModifyLocal && !this.userAclTaskIds.has(tasksId)) {
      this.showNotification('Action non autorisée', 'error');
      return;
    }
    this.taskService.deleteTaskFromCorrespAndDB(correspId, tasksId).subscribe({
      next: () => {
        this.tachesAssociees = this.tachesAssociees.filter(t => t.id !== tasksId);
        this.showNotification('Tâche supprimée', 'success');
      },
      error: err => {
        console.error('Erreur suppression tâche', err);
        this.showNotification('Erreur lors de la suppression', 'error');
      },
    });
  }

  changeTasksStatus(correspId: number, taskId: number, status: string): void {
    const perm = this.taskPermissions[taskId];
    const isAdminEffective = this.isGlobalAdmin || this.canAdminCorresp;
    const canModifyLocal = !!(this.tachesAssociees.find(t => (t as any)?.id === taskId) as any)?.canModify;
    if (!isAdminEffective && !(this.userAclTaskIds.has(taskId) || perm?.canWrite === true || canModifyLocal)) {
      this.showNotification("Vous n'avez pas le droit de modifier le statut de la tâche", 'error');
      return;
    }
    this.correspService.changeTaskStatus(correspId, taskId, status).subscribe({
      next: () => {
        this.taskService.getAllTasksByCorrespId({ correspId: this.correspLoaded.id }).subscribe(r => {
          const list = r.body || [];
          this.taskService.enrichTasksWithCanModify(list).subscribe(enriched => {
            this.tachesAssociees = enriched || [];
            this.resolveResponsableNames();
            this.refreshCorrespWritePermission();
          });
        });
        this.showNotification('Statut modifié', 'success');
      },
      error: err => {
        console.error('Erreur changement statut', err);
        this.showNotification('Erreur lors du changement', 'error');
      },
    });
  }

  private refreshCorrespWritePermission(): void {
    if (this.isGlobalAdmin || this.canAdminCorresp) return;
    if (this.isAdminOrBoc && this.correspLoaded?.status === CorrespStatus.DISPATCH) return;
    const accessibleTasks = (this.tachesAssociees || []).filter(t => this.userAclTaskIds.has(t.id));
    const hasActiveWritableTask = accessibleTasks.some(t => {
      const tt = (t.taskType || '').toLowerCase();
      return (tt === 'traitement' || tt === 'signature' || tt === 'validation') && t.status === CorrespStatus.IN_PROGRESS;
    });
    if (!hasActiveWritableTask && !this.canAdminCorresp) this.canWriteCorresp = false;
  }

  openEditPendingTaskModal(index: number, modal: any): void {
    const task = this.pendingTasks[index];
    this.editingPendingTaskIndex = index;
    this.selectedType = task.typeTask;
    this.dateLimite = task.dateLimite || '';
    this.commentaire = task.commentaire || '';
    this.selectedDepartement = task.responsable;
    this.selectedDepartementName = task.responsableName;
    this.selectedResponsables = task.responsable ? [{ codeDept: task.responsable, displayName: task.responsableName }] : [];
    this.prepareAndLoadOrgaThenTree();
    this.modalService.open(modal, { size: 'xl' }).result.then(
      () => {
        const updated = {
          typeTask: this.selectedType,
          responsable: this.selectedResponsables[0]?.codeDept || this.selectedDepartement || '',
          dateLimite: this.dateLimite,
          responsableName: this.selectedResponsables[0]?.displayName || this.selectedDepartementName || '',
          commentaire: this.commentaire,
        };
        this.pendingTasks[index] = updated;
        this.resetForm();
      },
      () => {
        this.resetForm();
      }
    );
  }

  removePendingTask(index: number): void {
    const task = this.pendingTasks[index];
    this.pendingTasks.splice(index, 1);
    if (task.typeTask === 'traitement') {
      if (!this.pendingTasks.some(t => t.typeTask === 'traitement')) {
        this.destinataire = '';
        this.destinataireLabel = '';
        this.recipientSelectedDept = null;
      }
    } else if (task.typeTask === 'lecture') {
      this.selectedCcDepts = this.selectedCcDepts.filter(cc => cc.codeDept !== task.responsable && cc.nomDept !== task.responsableName);
      this.updateCcLabelsFromSelection();
    }
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
    if (!this.selectedType?.trim()) {
      this.validationErrors['typeTask'] = 'Le type de la tâche est obligatoire';
      isValid = false;
    }
    if (!this.selectedResponsables?.length) {
      this.validationErrors['responsables'] = 'Sélectionnez au moins un responsable (dépt ou personne)';
      isValid = false;
    }
    return isValid;
  }

  // ── Task comment helpers ───────────────────────────────────────────────────

  initiateTaskCompletion(taskId: number): void {
    this.taskCompletionState.set(taskId, { showComment: true, comment: '' });
  }
  resetTaskCompletion(taskId: number): void {
    this.taskCompletionState.delete(taskId);
  }
  isTaskInCompletionMode(taskId: number): boolean {
    return this.taskCompletionState.get(taskId)?.showComment === true;
  }
  getTaskCompletionComment(taskId: number): string {
    return this.taskCompletionState.get(taskId)?.comment ?? '';
  }
  setTaskCompletionComment(taskId: number, value: string): void {
    const existing = this.taskCompletionState.get(taskId);
    if (existing) existing.comment = value;
  }

  confirmTaskCompletion(correspId: number, taskId: number): void {
    const comment = this.getTaskCompletionComment(taskId).trim();
    if (comment.length > 0) {
      this.taskService.partialUpdate({ id: taskId, commentaireTraitement: comment } as any).subscribe({
        next: () => {
          this.resetTaskCompletion(taskId);
          this.changeTasksStatus(correspId, taskId, 'CLOSED');
        },
        error: () => {
          this.resetTaskCompletion(taskId);
          this.changeTasksStatus(correspId, taskId, 'CLOSED');
        },
      });
    } else {
      this.resetTaskCompletion(taskId);
      this.changeTasksStatus(correspId, taskId, 'CLOSED');
    }
  }

  initiateTaskCancellation(taskId: number): void {
    this.taskCancellationState.set(taskId, { showComment: true, comment: '' });
  }
  resetTaskCancellation(taskId: number): void {
    this.taskCancellationState.delete(taskId);
  }
  isTaskInCancellationMode(taskId: number): boolean {
    return this.taskCancellationState.get(taskId)?.showComment === true;
  }
  getTaskCancellationComment(taskId: number): string {
    return this.taskCancellationState.get(taskId)?.comment ?? '';
  }
  setTaskCancellationComment(taskId: number, value: string): void {
    const existing = this.taskCancellationState.get(taskId);
    if (existing) existing.comment = value;
  }

  confirmTaskCancellation(correspId: number, taskId: number): void {
    const comment = this.getTaskCancellationComment(taskId).trim();
    if (comment.length > 0) {
      this.taskService.partialUpdate({ id: taskId, commentaireTraitement: comment } as any).subscribe({
        next: () => {
          this.resetTaskCancellation(taskId);
          this.changeTasksStatus(correspId, taskId, 'CANCELLED');
        },
        error: () => {
          this.resetTaskCancellation(taskId);
          this.changeTasksStatus(correspId, taskId, 'CANCELLED');
        },
      });
    } else {
      this.resetTaskCancellation(taskId);
      this.changeTasksStatus(correspId, taskId, 'CANCELLED');
    }
  }

  // ── PJ ─────────────────────────────────────────────────────────────────────

  onFileSelected(event: any): void {
    const files: FileList = event.target.files;
    if (files?.length) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uniquePjName = this.generateRandomId(10);
        const pjModel: IPj = {} as IPj;
        const parts = file.name.split('.');
        pjModel.name = parts.slice(0, -1).join('.');
        pjModel.fileType = parts[parts.length - 1];
        pjModel.uniqueName = uniquePjName;
        this.uploadProgress.set(uniquePjName, 0);
        this.uploadFileWithProgress(file, uniquePjName, pjModel);
      }
    }
    event.target.value = '';
  }

  getProgressValue(): number {
    const firstKey = Array.from(this.uploadProgress.keys())[0];
    return firstKey ? this.uploadProgress.get(firstKey)! : 0;
  }

  uploadFileWithProgress(file: File, uniqueName: string, pjModel: IPj): void {
    if (!(this.canWriteCorresp || this.canAdminCorresp)) {
      this.showNotification("Vous n'avez pas le droit d'ajouter une pièce jointe", 'error');
      return;
    }
    this.isUploading = true;
    const req = { uniqueName };
    this.pjService.uploadPj(file, req).subscribe({
      next: progressOrResponse => {
        if (typeof progressOrResponse === 'number') {
          this.uploadProgress.set(uniqueName, progressOrResponse);
        } else {
          this.uploadProgress.set(uniqueName, 100);
          pjModel.path = progressOrResponse;
          if (!this.accordionStates['pieces']) this.accordionStates['pieces'] = true;
          this.addPjToCorresp(pjModel);
          setTimeout(() => {
            this.uploadProgress.delete(uniqueName);
            this.isUploading = false;
          }, 500);
        }
      },
      error: () => {
        this.uploadProgress.delete(uniqueName);
        this.isUploading = false;
        this.showNotification('Échec du téléchargement du fichier', 'error');
      },
    });
  }

  private addPjToCorresp(pjModel: IPj): void {
    if (!this.correspLoaded?.id) return;
    if (!(this.canWriteCorresp || this.canAdminCorresp)) {
      this.showNotification("Vous n'avez pas le droit d'ajouter une pièce jointe", 'error');
      return;
    }
    this.correspService.addPjToCorresp(pjModel, this.correspLoaded.id).subscribe({
      next: () => {
        this.pjService.getAllPjByCorrespId({ correspId: this.correspLoaded.id }).subscribe({
          next: res => {
            this.pjsLoaded = res.body || [];
            this.showNotification('Pièce jointe ajoutée', 'success');
          },
          error: () => {
            this.showNotification('Pièce jointe ajoutée (mais impossible de rafraîchir la liste)', 'success');
          },
        });
      },
      error: () => {
        this.showNotification("Impossible d'associer la pièce jointe", 'error');
      },
    });
  }

  downloadSelectedPj(pj: IPj): void {
    this.pjService.getFile(pj.id).subscribe({
      next: (blob: Blob) => {
        saveAs(blob, pj.name + '.' + pj.fileType);
      },
      error: err => {
        console.error('Download failed', err);
      },
    });
  }

  openDeletePjModal(content: any, pj: IPj): void {
    this.selectedPjToDelete = pj;
    this.modalService.open(content, { centered: true, size: 'lg' });
  }

  deletePjWithCorresp(): void {
    if (!this.selectedPjToDelete) {
      this.showNotification('Aucune pièce sélectionnée pour suppression', 'error');
      return;
    }
    if (!(this.canWriteCorresp || this.canDeleteCorresp || this.canAdminCorresp)) {
      this.showNotification("Vous n'avez pas le droit de supprimer cette pièce jointe", 'error');
      return;
    }
    const req = { uniqueName: this.selectedPjToDelete.uniqueName, fileType: this.selectedPjToDelete.fileType };
    this.pjService.deletePjWithCorresp(req).subscribe({
      next: () => {
        this.pjsLoaded = this.pjsLoaded.filter(p => p.uniqueName !== this.selectedPjToDelete.uniqueName);
        this.selectedPjToDelete = undefined as any;
        this.showNotification('Pièce jointe supprimée', 'success');
      },
      error: () => {
        this.showNotification('Échec de la suppression du fichier', 'error');
      },
    });
  }

  togglePreview(pj: IPj): void {
    this.selectedPj = this.selectedPj?.id === pj.id ? null : pj;
  }

  closePreview(): void {
    this.selectedPj = null;
  }

  // ── Scan PjCare ────────────────────────────────────────────────────────────

  openScanModal(content: any): void {
    this.scanPreview = null;
    this.scanError = null;
    this.isMerging = false;
    this.currentDocumentPages = [];
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
        if (res?.status === 200) {
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
        if (this.scanners.length) this.selectedScanner = this.scanners[0];
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

  removePage(index: number): void {
    this.currentDocumentPages.splice(index, 1);
    this.currentDocumentPages.forEach((p, i) => (p.pageNumber = i + 1));
    if (!this.currentDocumentPages.length) this.scanPreview = null;
  }

  attachScanResult(modal: any): void {
    if (!this.currentDocumentPages.length) return;
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
    const uniquePjName = this.generateRandomId(10);
    const pjModel: IPj = {} as IPj;
    const parts = filename.split('.');
    pjModel.name = parts.slice(0, -1).join('.');
    pjModel.fileType = parts[parts.length - 1];
    pjModel.uniqueName = uniquePjName;
    this.accordionStates['pieces'] = true;
    this.uploadProgress.set(uniquePjName, 0);
    this.uploadFileWithProgress(file, uniquePjName, pjModel);
    modal.close();
  }

  // ── Organigramme tree (tâches) ──────────────────────────────────────────────

  private prepareAndLoadOrgaThenTree(): void {
    if (this.selectedOrgaCode) {
      this.loadTreeForModal(this.selectedOrgaCode);
      return;
    }
    this.correspService.getMySocietes().subscribe({
      next: societes => {
        const societe = societes.find(s => s.id === this.correspLoaded?.idSociete);
        const orgaCode = societe?.codeOrganigramme ?? null;
        if (!orgaCode) {
          this.taskTree = [];
          this.taskTreeFiltered = [];
          return;
        }
        this.correspService.getOrgacareByOrgaCode(orgaCode).subscribe({
          next: (res: HttpResponse<any>) => {
            const orgacare = res.body;
            this.selectedOrgaCode = orgacare?.orgaCode ?? orgacare?.code ?? orgaCode;
            this.loadTreeForModal(this.selectedOrgaCode!);
          },
          error: () => {
            this.taskTree = [];
            this.taskTreeFiltered = [];
          },
        });
      },
      error: () => {
        this.taskTree = [];
        this.taskTreeFiltered = [];
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

  private normalizeTree(nodes?: DepartementTreeFeignDTO[] | null): DepartementTreeFeignDTO[] {
    if (!nodes) return [];
    return nodes.map(n => this.normalizeNode(n));
  }

  private normalizeNode(node: DepartementTreeFeignDTO): DepartementTreeFeignDTO {
    const children = node.children?.length ? node.children.map(c => this.normalizeNode(c)) : [];
    const rawAff = (node as any).affectationsByType || {};
    const affs: Partial<Record<TypeAffectation, PersonneFeignDTO[]>> = {};
    Object.keys(rawAff).forEach(k => {
      if ((Object.values(TypeAffectation) as string[]).includes(k)) affs[k as TypeAffectation] = (rawAff as any)[k] ?? [];
      else affs.MEMBRE = ((affs.MEMBRE || []) as PersonneFeignDTO[]).concat((rawAff as any)[k] || []);
    });
    (Object.values(TypeAffectation) as TypeAffectation[]).forEach(t => {
      affs[t] = affs[t] || [];
    });
    return { ...node, children, affectationsByType: affs };
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

  onSelectDept(node: DepartementTreeFeignDTO): void {
    this.selectedDept = node;
    this.selectedDepartement = node.code ?? '';
    this.selectedDepartementName = node.nom ?? '';
  }

  toggleDeptSelection(node: DepartementTreeFeignDTO): void {
    const code = node.code ?? '';
    if (!code) return;
    const idx = this.selectedResponsables.findIndex(r => r.codeDept === code && !r.matriculePers);
    if (idx >= 0) this.selectedResponsables.splice(idx, 1);
    else if (this.editingPendingTaskIndex >= 0) this.selectedResponsables = [{ codeDept: code, displayName: node.nom ?? code }];
    else this.selectedResponsables.push({ codeDept: code, displayName: node.nom ?? code });
  }

  isDeptSelected(node: DepartementTreeFeignDTO): boolean {
    return !!this.selectedResponsables.find(r => r.codeDept === (node.code ?? '') && !r.matriculePers);
  }

  togglePersonSelection(node: DepartementTreeFeignDTO, person: PersonneFeignDTO): void {
    const code = node.code ?? '';
    const matricule = person.matricule ?? '';
    if (!matricule) return;
    const idx = this.selectedResponsables.findIndex(r => r.matriculePers === matricule && r.codeDept === code);
    if (idx >= 0) this.selectedResponsables.splice(idx, 1);
    else if (this.editingPendingTaskIndex >= 0)
      this.selectedResponsables = [{ codeDept: code || null, matriculePers: matricule, displayName: person.nomPrenom ?? matricule }];
    else this.selectedResponsables.push({ codeDept: code || null, matriculePers: matricule, displayName: person.nomPrenom ?? matricule });
  }

  isPersonSelected(node: DepartementTreeFeignDTO, person: PersonneFeignDTO): boolean {
    return !!this.selectedResponsables.find(r => r.matriculePers === (person.matricule ?? '') && r.codeDept === (node.code ?? ''));
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
    if (sel.matriculePers)
      idx = this.selectedResponsables.findIndex(r => r.matriculePers === sel.matriculePers && r.codeDept === (sel.codeDept ?? r.codeDept));
    else if (sel.codeDept) idx = this.selectedResponsables.findIndex(r => r.codeDept === sel.codeDept && !r.matriculePers);
    if (idx >= 0) this.selectedResponsables.splice(idx, 1);
  }

  clearSelections(): void {
    this.selectedResponsables = [];
  }
  getLevelColor(level: number): string {
    return this.levelPalette[level % this.levelPalette.length];
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
    const deptMatches = (node.nom || '').toLowerCase().includes(q);
    const filteredChildren = (node.children || []).map(c => this.filterNode(c, q)).filter((c): c is DepartementTreeFeignDTO => c !== null);
    const aff = node.affectationsByType || {};
    const filteredAff: Partial<Record<TypeAffectation, PersonneFeignDTO[]>> = {};
    let personMatches = false;
    Object.keys(aff as any).forEach(k => {
      const flist = ((aff as any)[k] as PersonneFeignDTO[]).filter(p => (p.nomPrenom || '').toLowerCase().includes(q));
      if (flist.length) personMatches = true;
      filteredAff[k as TypeAffectation] = flist;
    });
    if (!deptMatches && !personMatches && !filteredChildren.length) return null;
    return { ...node, children: filteredChildren, affectationsByType: filteredAff };
  }

  private applyAutoExpand(nodes: DepartementTreeFeignDTO[]): void {
    const visit = (n: DepartementTreeFeignDTO): void => {
      if (n.children?.length) this.expandedNodes.add(n.id);
      Object.keys(n.affectationsByType || {}).forEach(t => {
        if (((n.affectationsByType as any)[t] as PersonneFeignDTO[]).length > 0) this.expandedAffectations.add(`${n.id}-${t}`);
      });
      (n.children || []).forEach(c => visit(c));
    };
    nodes.forEach(n => visit(n));
  }

  // ── Destinataire tree ──────────────────────────────────────────────────────

  openRecipientModal(content: any): void {
    this.prepareAndLoadOrgaThenRecipientTree();
    this.modalService.open(content, { size: 'xl' });
  }

  private prepareAndLoadOrgaThenRecipientTree(): void {
    if (this.selectedOrgaCode) {
      this.loadRecipientTree(this.selectedOrgaCode);
      return;
    }
    this.correspService.getMySocietes().subscribe({
      next: societes => {
        const societe = societes.find(s => s.id === this.correspLoaded?.idSociete);
        const orgaCode = societe?.codeOrganigramme ?? null;
        if (!orgaCode) {
          this.recipientTree = [];
          this.recipientTreeFiltered = [];
          return;
        }
        this.correspService.getOrgacareByOrgaCode(orgaCode).subscribe({
          next: (res: HttpResponse<any>) => {
            const orgacare = res.body;
            this.selectedOrgaCode = orgacare?.orgaCode ?? orgacare?.code ?? orgaCode;
            this.loadRecipientTree(this.selectedOrgaCode!);
          },
          error: () => {
            this.recipientTree = [];
            this.recipientTreeFiltered = [];
          },
        });
      },
      error: () => {
        this.recipientTree = [];
        this.recipientTreeFiltered = [];
      },
    });
  }

  private loadRecipientTree(orgaCode: string): void {
    this.recipientLoadingTree = true;
    this.correspService.getDepartementHierarchyByOrganigramme(orgaCode).subscribe({
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

  filterRecipientTree(): void {
    const q = (this.recipientTreeSearchQuery || '').trim().toLowerCase();
    if (!q) {
      this.recipientTreeFiltered = this.recipientTree;
      return;
    }
    this.recipientTreeFiltered = this.filterTree(this.recipientTree, q);
    this.expandAllFilteredNodes(this.recipientTreeFiltered, this.recipientExpandedNodes);
  }

  toggleRecipientNodeExpand(nodeId: number): void {
    if (this.recipientExpandedNodes.has(nodeId)) this.recipientExpandedNodes.delete(nodeId);
    else this.recipientExpandedNodes.add(nodeId);
  }

  isRecipientNodeExpanded(nodeId: number): boolean {
    return this.recipientExpandedNodes.has(nodeId);
  }

  selectRecipientDept(node: DepartementTreeFeignDTO, modalRef: any): void {
    this.recipientSelectedDept = node;
    this.destinataireLabel = node.nom || '';
    this.destinataire = node.email || '';
    const existingIdx = this.pendingTasks.findIndex(t => t.typeTask === 'traitement');
    const newTask = {
      typeTask: 'traitement',
      responsable: node.code ?? '',
      dateLimite: existingIdx >= 0 ? this.pendingTasks[existingIdx].dateLimite : '',
      responsableName: node.nom ?? '',
      commentaire: existingIdx >= 0 ? this.pendingTasks[existingIdx].commentaire : '',
    };
    if (existingIdx >= 0) this.pendingTasks[existingIdx] = newTask;
    else this.pendingTasks.push(newTask);
    modalRef.close();
  }

  clearRecipientDept(): void {
    this.recipientSelectedDept = null;
    this.destinataire = '';
    this.destinataireLabel = '';
    this.pendingTasks = this.pendingTasks.filter(t => t.typeTask !== 'traitement');
  }

  // ── CC tree ────────────────────────────────────────────────────────────────

  openCcModal(content: any): void {
    this.prepareAndLoadOrgaThenCcTree();
    this.modalService.open(content, { size: 'xl' });
  }

  private prepareAndLoadOrgaThenCcTree(): void {
    if (this.selectedOrgaCode) {
      this.loadCcTree(this.selectedOrgaCode);
      return;
    }
    this.correspService.getMySocietes().subscribe({
      next: societes => {
        const societe = societes.find(s => s.id === this.correspLoaded?.idSociete);
        const orgaCode = societe?.codeOrganigramme ?? null;
        if (!orgaCode) {
          this.ccTree = [];
          this.ccTreeFiltered = [];
          return;
        }
        this.correspService.getOrgacareByOrgaCode(orgaCode).subscribe({
          next: (res: HttpResponse<any>) => {
            const orgacare = res.body;
            this.selectedOrgaCode = orgacare?.orgaCode ?? orgacare?.code ?? orgaCode;
            this.loadCcTree(this.selectedOrgaCode!);
          },
          error: () => {
            this.ccTree = [];
            this.ccTreeFiltered = [];
          },
        });
      },
      error: () => {
        this.ccTree = [];
        this.ccTreeFiltered = [];
      },
    });
  }

  private loadCcTree(orgaCode: string): void {
    this.ccLoadingTree = true;
    this.correspService.getDepartementHierarchyByOrganigramme(orgaCode).subscribe({
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

  filterCcTree(): void {
    const q = (this.ccTreeSearchQuery || '').trim().toLowerCase();
    if (!q) {
      this.ccTreeFiltered = this.ccTree;
      return;
    }
    this.ccTreeFiltered = this.filterTree(this.ccTree, q);
    this.expandAllFilteredNodes(this.ccTreeFiltered, this.ccExpandedNodes);
  }

  toggleCcNodeExpand(nodeId: number): void {
    if (this.ccExpandedNodes.has(nodeId)) this.ccExpandedNodes.delete(nodeId);
    else this.ccExpandedNodes.add(nodeId);
  }

  isCcNodeExpanded(nodeId: number): boolean {
    return this.ccExpandedNodes.has(nodeId);
  }

  toggleCcDept(node: DepartementTreeFeignDTO): void {
    const code = node.code ?? '';
    const idx = this.selectedCcDepts.findIndex(d => d.codeDept === code);
    if (idx >= 0) this.selectedCcDepts.splice(idx, 1);
    else this.selectedCcDepts.push({ idDept: node.id ?? null, codeDept: code, nomDept: node.nom ?? '', emailDept: node.email ?? '' });
  }

  isCcDeptSelected(node: DepartementTreeFeignDTO): boolean {
    return !!this.selectedCcDepts.find(d => d.codeDept === (node.code ?? ''));
  }

  removeCcDept(cc: IContactCopieCorresp): void {
    const idx = this.selectedCcDepts.findIndex(d => d.codeDept === cc.codeDept);
    if (idx >= 0) this.selectedCcDepts.splice(idx, 1);
    this.updateCcLabelsFromSelection();
    this.pendingTasks = this.pendingTasks.filter(
      t => !(t.typeTask === 'lecture' && (t.responsable === cc.codeDept || t.responsableName === cc.nomDept))
    );
  }

  confirmCcSelection(modalRef: any): void {
    this.updateCcLabelsFromSelection();
    this.pendingTasks = this.pendingTasks.filter(t => t.typeTask !== 'lecture');
    for (const cc of this.selectedCcDepts) {
      this.pendingTasks.push({
        typeTask: 'lecture',
        responsable: cc.codeDept ?? '',
        dateLimite: '',
        responsableName: cc.nomDept ?? cc.codeDept ?? '',
        commentaire: '',
      });
    }
    const ccEmails = this.selectedCcDepts
      .map(d => d.emailDept || '')
      .filter(Boolean)
      .join(', ');
    if (ccEmails) {
      this.draftEmailCopyTo = ccEmails;
      this.messageCopyToEmails = ccEmails
        .split(',')
        .map(e => e.trim())
        .filter(Boolean);
    }
    modalRef.close();
  }

  private updateCcLabelsFromSelection(): void {
    if (!this.selectedCcDepts.length) {
      this.contactEmailCCLabel = '';
      this.contactEmailCC = '';
      return;
    }
    this.contactEmailCCLabel = this.selectedCcDepts.map(d => d.nomDept || d.codeDept || '').join(', ');
    this.contactEmailCC = this.selectedCcDepts
      .map(d => d.emailDept || '')
      .filter(Boolean)
      .join(', ');
  }

  // ── Références modal ───────────────────────────────────────────────────────

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
  }

  clearReponseSur(): void {
    this.refsSelectedItem = null;
    this.reponseSur = '';
  }

  formatRefDate(date?: string | null): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  // ── Helpers affichage ──────────────────────────────────────────────────────

  openDeleteModal(content: any): void {
    this.modalService.open(content, { centered: true, size: 'xl' });
  }

  showNotification(message: string, type: 'success' | 'error'): void {
    this.notificationMessage = message;
    this.notificationType = type;
    setTimeout(() => {
      this.notificationMessage = null;
      this.notificationType = null;
    }, 5000);
  }

  formatDate(date: dayjs.Dayjs | null | undefined): string {
    return date ? date.format('DD/MM/YYYY') : 'pas de date limite';
  }

  formatLongDate(date: dayjs.Dayjs | string | null | undefined): string {
    if (!date) return '';
    return dayjs(date).format('dddd DD MMMM YYYY').toUpperCase();
  }

  formatLongDateWithTime(date: dayjs.Dayjs | string | null | undefined): string {
    if (!date) return '';
    return dayjs(date).format('dddd DD MMMM YYYY - HH:mm').toUpperCase();
  }

  getTaskColor(status?: CorrespStatus | null): string {
    switch (status) {
      case CorrespStatus.DRAFT:
        return 'deeppink';
      case CorrespStatus.IN_PROGRESS:
        return '#0d6efd';
      case CorrespStatus.DISPATCH:
        return '#6c757d';
      case CorrespStatus.CLOSED:
        return '#198754';
      case CorrespStatus.CANCELLED:
        return '#dc3545';
      default:
        return '#6c757d';
    }
  }

  getTaskLabel(status?: CorrespStatus | null): string {
    switch (status) {
      case CorrespStatus.DRAFT:
        return 'brouillon';
      case CorrespStatus.IN_PROGRESS:
        return 'En cours';
      case CorrespStatus.DISPATCH:
        return 'Dispatch';
      case CorrespStatus.CLOSED:
        return 'achevée';
      case CorrespStatus.CANCELLED:
        return 'annulée';
      default:
        return status ? String(status) : '';
    }
  }

  getTaskTypeBg(type?: string | null): string {
    const k = (type || '').toString().toLowerCase();
    if (k === 'lecture') return '#e8f2ff';
    if (k === 'signature') return '#efe8ff';
    if (k === 'traitement') return '#fff0e6';
    if (k === 'validation') return '#e9f7ee';
    return '#ffffff';
  }

  getStatusLabelAndColor(status: CorrespStatus): { label: string; color: string } {
    switch (status) {
      case CorrespStatus.DRAFT:
        return { label: 'Brouillon', color: 'deeppink' };
      case CorrespStatus.IN_PROGRESS:
        return { label: 'En cours', color: '#0d6efd' };
      case CorrespStatus.CLOSED:
        return { label: 'Clôturé', color: '#6a2020' };
      default:
        return { label: status, color: 'gray' };
    }
  }

  getDispatchIcon(type?: string | null): string {
    switch (type) {
      case DispatchType.LETTER:
        return '📄';
      case DispatchType.EMAIL:
        return '📧';
      case DispatchType.FAX:
        return '📠';
      case DispatchType.REGISTERED_LETTER:
        return '📬';
      default:
        return '📄';
    }
  }

  getDispatchLabel(type?: string | null): string {
    switch (type) {
      case DispatchType.LETTER:
        return 'Lettre';
      case DispatchType.EMAIL:
        return 'E-mail';
      case DispatchType.FAX:
        return 'Fax';
      case DispatchType.REGISTERED_LETTER:
        return 'Recommandée';
      default:
        return type ?? '';
    }
  }

  getDispatchBadgeStyle(type?: string | null): { [key: string]: string } {
    switch (type) {
      case DispatchType.LETTER:
        return { background: '#e8f0fe', color: '#2248a1', border: '1px solid #b3c5f7' };
      case DispatchType.EMAIL:
        return { background: '#e6f7ff', color: '#0c5a8a', border: '1px solid #91d5ff' };
      case DispatchType.FAX:
        return { background: '#fff3e0', color: '#7c4200', border: '1px solid #ffb74d' };
      case DispatchType.REGISTERED_LETTER:
        return { background: '#f3e8ff', color: '#5b2086', border: '1px solid #c084fc' };
      default:
        return { background: '#f1f3f5', color: '#495057', border: '1px solid #dee2e6' };
    }
  }

  toggleAccordion(section: string): void {
    this.accordionStates[section] = !this.accordionStates[section];
  }
  toggleEditBody(): void {
    this.isEditingBody = !this.isEditingBody;
  }
  previousState(): void {
    window.history.back();
  }

  generateRandomId(length = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    return result;
  }

  private toIso(value: any): string | null {
    if (!value) return null;
    if (typeof value === 'object' && typeof (value as any).toJSON === 'function') {
      try {
        return (value as any).toJSON();
      } catch {
        return String(value);
      }
    }
    return String(value);
  }

  private getResponsablesSummary(): string {
    if (!this.selectedResponsables?.length) return '';
    return this.selectedResponsables
      .map(r => r.matriculePers || r.codeDept || '')
      .filter(Boolean)
      .join(', ');
  }

  getResponsablesForNode(node: DepartementTreeFeignDTO): string {
    if (!node || !node.affectationsByType) return '';
    const chefs = (node.affectationsByType['CHEF'] || []).map((p: any) => p.nomPrenom).filter(Boolean);
    const membres = (node.affectationsByType['MEMBRE'] || []).map((p: any) => p.nomPrenom).filter(Boolean);
    if (chefs.length) return chefs.join(', ');
    if (membres.length) return membres.join(', ');
    return '';
  }

  private sanitize(obj: any): any {
    Object.keys(obj).forEach(key => {
      if (obj[key] === undefined) obj[key] = null;
    });
    return obj;
  }

  private expandAllFilteredNodes(nodes: DepartementTreeFeignDTO[], expandedSet: Set<number>): void {
    for (const node of nodes) {
      if (node.id != null) expandedSet.add(node.id);
      if (node.children?.length) this.expandAllFilteredNodes(node.children, expandedSet);
    }
  }

  // ── Windows-1256 / Arabic fixes ────────────────────────────────────────────

  private fixWindows1256(str: string): string {
    if (!str) return '';
    if (!/[\x80-\xFF]/.test(str)) return str;
    let result = '';
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      result += code >= 128 && code <= 255 ? String.fromCharCode(this.WIN1256[code - 128]) : str[i];
    }
    return result;
  }

  private fixArabicDirection(html: string): string {
    html = html.replace(/<(p|div|td|li)([^>]*)>([\s\S]*?)<\/\1>/gi, (match, tag, attrs, content) => {
      const textOnly = content.replace(/<[^>]+>/g, '').trim();
      if (!textOnly) return match;
      const arabicChars = (textOnly.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g) || []).length;
      const latinChars = (textOnly.match(/[a-zA-ZÀ-ÿ]/g) || []).length;
      if (arabicChars > latinChars && arabicChars > 0) {
        if (/dir\s*=/i.test(attrs)) return match;
        const attrsClean = attrs.replace(/style\s*=\s*["'][^"']*["']/gi, '');
        return `<${tag}${attrsClean} dir="rtl" style="text-align: right; unicode-bidi: embed; direction: rtl;">${content}</${tag}>`;
      }
      return match;
    });
    html = html.replace(/(?<=>|^)([^<]+)(?=<|$)/g, match => {
      const trimmed = match.trim();
      if (!trimmed) return match;
      const arabicChars = (trimmed.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g) || []).length;
      const latinChars = (trimmed.match(/[a-zA-ZÀ-ÿ]/g) || []).length;
      if (arabicChars > latinChars && arabicChars > 0) {
        return `<span dir="rtl" style="display: block; text-align: right; unicode-bidi: embed; direction: rtl;">${match}</span>`;
      }
      return match;
    });
    return html;
  }

  protected readonly CorrespStatus = CorrespStatus;
}
