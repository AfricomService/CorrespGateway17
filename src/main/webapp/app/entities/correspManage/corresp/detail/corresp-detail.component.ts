import { Component, OnInit, OnDestroy, ViewChild, HostListener } from '@angular/core';
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
// import { IOrga } from '../orga';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ITypedocument } from '../../../configManage/typedocument/typedocument.model';
import { IDepartement } from '../../../orgacare/departement/departement.model';
import { TypedocumentService } from '../../../configManage/typedocument/service/typedocument.service';
import { IDetailInfo } from '../../../configManage/detailinfo/detail-info.model';
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
import {
  PjCareService,
  PjCareScanResult,
  PjCareDriverInfo,
  ScanDriver,
  ScannedPage,
  MergePagesRequest,
} from 'app/entities/correspManage/pj/service/pjcare.service';
import { ScanSettingsService } from 'app/entities/correspManage/pj/service/scan-settings.service';
import { ModelNotifService } from 'app/entities/configManage/model-notif/service/model-notif.service';
import { IModelNotif } from 'app/entities/configManage/model-notif/model-notif.model';

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
export class CorrespDetailComponent implements OnInit, OnDestroy {
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
  isSubmitting: boolean = false;
  notificationMessage: string | null = null;
  notificationType: 'success' | 'error' | null = null;
  referenceEmetteur: string = '';
  priorite: boolean = false;
  typedocuments: ITypedocument[] = [];
  validationInfoGenErrors: { [key: string]: string } = {};

  // === Détails supplémentaires (additionalInfo) — uniquement Arrivée (INCOMING) ===
  additionalInfoFields: IDetailInfo[] = [];
  additionalInfoValues: { [code: string]: any } = {};
  loadingAdditionalInfo = false;
  validationAdditionalInfoErrors: { [code: string]: string } = {};
  // --- Body Content ---
  htmlContent = '<h3>Rapport Annuel</h3><p>Veuillez trouver ci-joint le rapport détaillé concernant...</p>';
  isEditingBody = false;

  // --- Mock Data Containers ---
  tasks: ITasks[] = [];
  attachments: IPj[] = [];

  // --- Accordion States (Closed by default as requested) ---
  accordionStates: { [key: string]: boolean } = {
    infoGen: true,
    infoSupp: true,
    taches: true,
    corps: true,
    pieces: true,
  };

  correspType = '';
  destinataire = '';

  correspLoaded!: ICorresp;
  formattedDate = '';
  selectedTypeDocument: ITypedocument | null = null;
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
  private _pendingDriverFromCookie: string = '';

  // ── Email preview modal (pour Soumettre + Envoyer) ───────────────────────
  showEmailSubmitModal = false;
  isLoadingEmailPreview = false;
  emailPreviewHtml: string = '';
  emailPreviewSubject: string = '';
  emailPreviewFrom: string = '';
  emailPreviewTo: string = '';
  emailPreviewCc: string = '';
  emailPreviewModelName: string = '';
  emailPreviewError: string = '';
  isSendingEmailOnSubmit = false;
  sendEmailOnSubmitError: string = '';
  sendEmailOnSubmitSuccess = false;
  savedEmailMessageId: number | null = null;

  /** Buffer multi-pages du document en cours — toutes les pages formeront UN seul fichier */
  currentDocumentPages: ScannedPage[] = [];

  uploadProgress: Map<string, number> = new Map(); // Per-file progress tracking

  bodyHtmlContent = '';

  selectedPjToDelete!: IPj;

  editingPendingTaskIndex: number = -1;

  @ViewChild('filePreview') filePreview!: FilePreviewComponent;

  treeSearchQuery = '';
  selectedTaskId: number | null = null;
  private lectureAutoCloseTimer: any = null;
  taskTreeFiltered: DepartementTreeFeignDTO[] = [];

  // === Recipient (Destinataire) Tree state ===
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

  pendingTasks: Array<{
    typeTask: string;
    responsable: string;
    dateLimite: string;
    responsableName: string;
    commentaire: string;
  }> = [];

  dispatchType: DispatchType | '' = '';
  dispatchTypeOptions: Array<{ value: DispatchType; label: string }> = [
    { value: DispatchType.LETTER, label: 'Lettre' },
    { value: DispatchType.REGISTERED_LETTER, label: 'Lettre recommandée' },
    { value: DispatchType.EMAIL, label: 'E-mail' },
    { value: DispatchType.FAX, label: 'Fax' },
  ];
  // permission state
  canReadCorresp = false;
  canWriteCorresp = false;
  canDeleteCorresp = false;
  canAdminCorresp = false;

  // task permissions: taskId -> PermissionDTO
  taskPermissions: { [key: number]: PermissionDTO } = {};
  // tâches appartenant réellement à l'utilisateur (ACL)
  userAclTaskIds: Set<number> = new Set<number>();
  // Cache complet des tâches ACL avec responsables résolus (venant de getAllTasksByUserAclAllStatuses)
  private userAclTasksMap: Map<number, ITasks> = new Map();
  protected currentAccountLogin: string | null = null;
  private currentUserId: string | null = null;
  isGlobalAdmin = false;

  /** true si l'utilisateur courant a le rôle ADMIN et/ou BOC */
  isAdminOrBoc = false;

  // Cache pour la résolution des noms de départements
  private deptNameByCode: Map<string, string> = new Map();

  // === Message receiver / copyTo (provenant de N8N / email) ===
  messageReceiverEmails: string[] = [];
  messageCopyToEmails: string[] = [];

  // Modèle email pour le modal soumettre+envoyer
  models: IModelNotif[] = [];
  selectedModelNotifForSubmit: IModelNotif | null = null;
  currentUserFirstNameDetail: string = '';
  currentUserLastNameDetail: string = '';
  currentUserDepartementNameDetail: string = '';
  currentUserEmailDetail: string = '';
  /** Champs éditables À et CC si aucun email en base (mode DRAFT OUTGOING) */
  draftEmailReceiver: string = '';
  draftEmailCopyTo: string = '';
  loadingModels = false;

  // === Modal Expéditeur (detail) ===
  expediteurModalOpen = false;
  expediteurModalSearch = '';
  expediteurModalFilteredCompanies: IContactCompany[] = [];
  expediteurModalPage = 0;
  expediteurModalPageSize = 20;
  expediteurModalTotalItems = 0;
  expediteurModalTotalPages = 0;
  expediteurModalLoading = false;
  expediteurModalSearchDebounce: any = null;
  hoveredCompanyId: number | null = null;

  // === Rename PJ modal ===
  showRenamePjModal = false;
  pjToRename: IPj | null = null;
  renamePjNewName = '';
  renamePjError = '';
  isRenamingPj = false;

  /**
   * Vrai si la correspondance est dans un état qui rend la partie gauche
   * (infos générales, tâches, PJ, boutons) éditable : DRAFT ou DISPATCH.
   * La partie droite (corps) reste non-éditable pour DISPATCH.
   */
  get isEditableLeft(): boolean {
    const st = this.correspLoaded?.status;
    return st === CorrespStatus.DRAFT || st === CorrespStatus.DISPATCH;
  }

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

  get safeHtmlContent(): SafeHtml {
    let raw = this.htmlContent || this.correspLoaded?.body || '';

    raw = this.fixWindows1256(raw);
    raw = raw.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    raw = raw.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '');
    raw = raw.replace(/<!--\[if[\s\S]*?<!\[endif\]-->/gi, '');

    const bodyMatch = raw.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      raw = bodyMatch[1];
    }

    // ✅ Fixer la direction RTL pour les paragraphes/spans contenant de l'arabe
    raw = this.fixArabicDirection(raw);

    return this.sanitizer.bypassSecurityTrustHtml(raw);
  }

  private fixArabicDirection(html: string): string {
    const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;

    html = html.replace(/<(p|div|td|li)([^>]*)>([\s\S]*?)<\/\1>/gi, (match, tag, attrs, content) => {
      const textOnly = content.replace(/<[^>]+>/g, '').trim();
      if (!textOnly) return match;

      const arabicChars = (textOnly.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g) || []).length;
      const latinChars = (textOnly.match(/[a-zA-ZÀ-ÿ]/g) || []).length;
      const isArabicDominant = arabicChars > latinChars && arabicChars > 0;

      if (isArabicDominant) {
        if (/dir\s*=/i.test(attrs)) return match;
        // Remplacer ou ajouter le style text-align
        const attrsClean = attrs.replace(/style\s*=\s*["'][^"']*["']/gi, '');
        return `<${tag}${attrsClean} dir="rtl" style="text-align: right; unicode-bidi: embed; direction: rtl;">${content}</${tag}>`;
      }
      return match;
    });

    // Wrapper les lignes de texte brut arabes (hors balises)
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

  ngOnInit(): void {
    this.accountService.identity().subscribe(acc => {
      const roles = acc?.authorities ?? [];
      this.isGlobalAdmin = Array.isArray(roles) && roles.includes('ROLE_ADMIN');
      this.isAdminOrBoc = Array.isArray(roles) && (roles.includes(Authority.ADMIN) || roles.includes(Authority.BOC));
      this.applyDispatchPermissionsForAdminOrBoc();
      // Charger infos utilisateur pour l'email
      this.currentUserFirstNameDetail = (acc as any)?.firstName || '';
      this.currentUserLastNameDetail = (acc as any)?.lastName || '';
      this.currentUserEmailDetail = (acc as any)?.email || (acc as any)?.login || '';
    });
    // Charger les modèles email
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
    this.loadMockData();
    this.onWindowResize();
    const id = this.activatedRoute.snapshot.paramMap.get('id');

    this.correspService.find(Number(id)).subscribe(res => {
      this.correspLoaded = res.body!;
      this.selectedOrgaCode = null; // ← forcer le rechargement de l'arbre
      this.loadPermissionsForCorresp(Number(this.correspLoaded.id));
      this.objet = this.correspLoaded.subject || '';
      this.expediteur = this.correspLoaded.sender || '';
      this.destinataireLabel = this.correspLoaded.labelDestinataire || '';
      this.contactEmail = this.correspLoaded.contactEmail || '';
      this.contactEmailCCLabel = this.correspLoaded.labelContactCC || '';

      if (this.correspLoaded.contactCopies && this.correspLoaded.contactCopies.length > 0) {
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
          .map(name => ({
            nomDept: name,
            codeDept: name,
          }));
      }

      this.date = this.correspLoaded.courrierDate ? dayjs(this.correspLoaded.courrierDate).format('YYYY-MM-DD') : '';
      this.reponseSur = this.correspLoaded.responseTo || '';
      this.referenceEmetteur = this.correspLoaded.senderReference || '';
      this.priorite = this.correspLoaded.priority || false;
      this.dispatchType = (this.correspLoaded.dispatchType as DispatchType) || '';
      // Utiliser le nouvel endpoint /body qui cible spécifiquement le message DRAFT
      this.correspService.loadDraftBody(this.correspLoaded.id).subscribe({
        next: (body: string) => {
          this.htmlContent = body;
        },
        error: () => {
          // Fallback sur l'ancien endpoint pour compatibilité
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

      // Mapper corresptype backend → valeur attendue par le filtre
      let correspTypeForBackend = '';
      const ct = this.correspLoaded.corresptype;
      if (ct === 'INCOMING') {
        correspTypeForBackend = 'Entrant';
        this.correspType = 'Arrivée';
      } else if (ct === 'OUTGOING') {
        correspTypeForBackend = 'Sortant';
        this.correspType = 'Sortant';
      } else if (ct === 'INTERNAL') {
        correspTypeForBackend = 'Interne';
        this.correspType = 'Interne';
      }

      // Récupérer le codeSociete depuis la corresp chargée
      const codeUniqueSociete = this.correspLoaded.codeUniqueSociete ?? null;

      const loadTypedocs$ = correspTypeForBackend
        ? this.typeDocumentService.findByCorrespType(correspTypeForBackend, codeUniqueSociete)
        : this.typeDocumentService.query({ page: 0, size: 1000 });

      loadTypedocs$.subscribe(res => {
        this.typedocuments = res.body || [];

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
        if (messages && messages.length > 0) {
          const msg = messages[0];
          console.log('[CorrespDetail] Message reçu:', JSON.stringify(msg));
          console.log(
            '[CorrespDetail] receiver:',
            JSON.stringify(msg.receiver),
            '| type:',
            typeof msg.receiver,
            '| isArray:',
            Array.isArray(msg.receiver)
          );
          console.log(
            '[CorrespDetail] copyTo:',
            JSON.stringify(msg.copyTo),
            '| type:',
            typeof msg.copyTo,
            '| isArray:',
            Array.isArray(msg.copyTo)
          );
          this.messageReceiverEmails = this.extractEmails(msg.receiver);
          this.messageCopyToEmails = this.extractEmails(msg.copyTo);
          // Pré-remplir les champs éditables depuis la base
          this.draftEmailReceiver = this.messageReceiverEmails.join(', ');
          this.draftEmailCopyTo = this.messageCopyToEmails.join(', ');
          console.log('[CorrespDetail] Emails extraits — receiver:', this.messageReceiverEmails, '| copyTo:', this.messageCopyToEmails);
        } else {
          console.warn('[CorrespDetail] Aucun message trouvé pour correspId:', id);
        }
      },
      error: () => {
        this.messageReceiverEmails = [];
        this.messageCopyToEmails = [];
      },
    });

    this.loadActiveCompanies();
  }

  ngOnDestroy(): void {
    if (this.lectureAutoCloseTimer) {
      clearTimeout(this.lectureAutoCloseTimer);
      this.lectureAutoCloseTimer = null;
    }
  }

  @HostListener('window:resize', [])
  onWindowResize(): void {
    const isMobile = window.innerWidth < 768;
    this.accordionStates['infoGen'] = !isMobile;
  }
  // loadCorresp(id: number): void {
  //   this.correspService.find(id).subscribe((res: HttpResponse<ICorresp>) => {
  //     this.correspLoaded = res.body!;
  //   });
  // }
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

  /**onSelectReponseSur(reference: string | null): void {
   this.reponseSur = reference ?? '';
   }*/

  /**
   * Extrait les adresses email depuis les données receiver/copyTo du message.
   * Le backend peut renvoyer :
   * - une liste d'objets [{email: "a@b.com"}, ...]
   * - une chaîne JSON stringifiée '[{"email":"a@b.com"}]'
   * - le format Java toString '[{email=a@b.com}]'
   * - une chaîne brute "a@b.com, c@d.com"
   * - null/undefined
   */
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

  /**
   * Extrait les emails depuis un tableau d'objets ou de chaînes.
   */
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

  formatLongDate(date: dayjs.Dayjs | string | null | undefined): string {
    if (!date) return '';
    return dayjs(date).format('dddd DD MMMM YYYY').toUpperCase();
  }

  formatLongDateWithTime(date: dayjs.Dayjs | string | null | undefined): string {
    if (!date) return '';
    return dayjs(date).format('dddd DD MMMM YYYY - HH:mm').toUpperCase();
  }
  onTypeDocumentChange(newSelected?: ITypedocument | null): void {
    this.selectedTypeDocument = newSelected ?? this.selectedTypeDocument ?? null;

    if (!this.selectedTypeDocument) {
      if (newSelected !== undefined) {
        this.objet = '';
      }
      this.objet = '';
      this.destinataire = '';
      this.destinataireLabel = '';
      this.recipientSelectedDept = null;
      this.contactEmailCC = '';
      this.contactEmailCCLabel = '';
      this.selectedCcDepts = [];
      this.pendingTasks = [];
      this.additionalInfoFields = [];
      this.additionalInfoValues = {};
      return;
    }

    // Ne pas écraser this.objet lors du chargement initial (appel sans argument)
    if (newSelected !== undefined && !this.objet?.trim()) {
      this.objet = this.selectedTypeDocument.defaultobject || '';
    }

    // En mode chargement initial (newSelected === undefined),
    // NE PAS réinitialiser les champs déjà chargés depuis la base
    if (newSelected === undefined) {
      this.pendingTasks = [];
      this.loadAdditionalInfoFields(true);
      return;
    }

    // Ces réinitialisations ne s'exécutent QUE lors d'un vrai changement utilisateur
    this.destinataire = '';
    this.destinataireLabel = '';
    this.recipientSelectedDept = null;
    this.contactEmailCC = '';
    this.contactEmailCCLabel = '';
    this.selectedCcDepts = [];
    this.pendingTasks = [];

    // ✅ Tout vient de la DB via defautdest
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

    // ✅ Tout vient de la DB via defaultencopie
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

    this.loadAdditionalInfoFields(false);
  }

  // --------------------------------------------------------------------------
  // Détails supplémentaires (additionalInfo) — dépend du Type de document
  // Uniquement affiché/rempli pour les courriers Arrivée (INCOMING)
  // --------------------------------------------------------------------------
  private loadAdditionalInfoFields(preserveExisting: boolean): void {
    this.additionalInfoFields = [];
    this.validationAdditionalInfoErrors = {};
    if (!preserveExisting) {
      this.additionalInfoValues = {};
    }

    if (this.correspType !== 'Arrivée' || !this.selectedTypeDocument?.id) {
      return;
    }

    this.loadingAdditionalInfo = true;
    this.typeDocumentService.getDetailInfosForTypeDoc(this.selectedTypeDocument.id).subscribe({
      next: (res: HttpResponse<IDetailInfo[]>) => {
        this.additionalInfoFields = (res.body || [])
          .filter(f => f.status !== false)
          .map(f => ({ ...f, inputType: this.normalizeInputType(f.inputType) }));

        // Récupérer additionalInfo depuis correspLoaded, en tolérant le cas
        // où le back renverrait une chaîne JSON stringifiée au lieu d'un tableau.
        let rawAdditionalInfo: any[] = [];
        const src: any = (this.correspLoaded as any)?.additionalInfo;
        if (preserveExisting && src) {
          if (Array.isArray(src)) {
            rawAdditionalInfo = src;
          } else if (typeof src === 'string') {
            try {
              const parsed = JSON.parse(src);
              if (Array.isArray(parsed)) rawAdditionalInfo = parsed;
            } catch {
              console.warn('[additionalInfo] impossible de parser la chaîne JSON reçue :', src);
            }
          }
        }

        // Normaliser les clés (string + trim) pour éviter tout mismatch de type/espace
        const existingValues = new Map<string, any>();
        rawAdditionalInfo.forEach(item => {
          const code = item?.code != null ? String(item.code).trim() : null;
          if (code) {
            existingValues.set(code, item.value);
          }
        });

        console.debug(
          '[additionalInfo] fields codes:',
          this.additionalInfoFields.map(f => f.code)
        );
        console.debug('[additionalInfo] existingValues keys:', Array.from(existingValues.keys()));

        this.additionalInfoFields.forEach(f => {
          const code = f.code != null ? String(f.code).trim() : null;
          if (!code) return;
          if (existingValues.has(code)) {
            const raw = existingValues.get(code);
            this.additionalInfoValues[code] = f.inputType === 'checkbox' ? raw === 'true' || raw === true : raw ?? '';
          } else if (this.additionalInfoValues[code] === undefined) {
            this.additionalInfoValues[code] = f.inputType === 'checkbox' ? false : '';
          }
        });
        this.loadingAdditionalInfo = false;
      },
      error: () => {
        this.additionalInfoFields = [];
        this.loadingAdditionalInfo = false;
      },
    });
  }

  private normalizeInputType(rawType: string | null | undefined): string {
    const t = (rawType || '').toLowerCase();
    switch (t) {
      case 'number':
      case 'numeric':
        return 'number';
      case 'date':
        return 'date';
      case 'checkbox':
      case 'boolean':
        return 'checkbox';
      case 'select':
      case 'list':
      case 'dropdown':
        return 'select';
      case 'text':
      case 'input':
      case '':
        return 'text';
      default:
        return 'text';
    }
  }

  getMultipleChoiceOptions(field: IDetailInfo): string[] {
    if (!field.multipleChoiceOption) return [];
    return field.multipleChoiceOption.map((opt: any) => opt.value ?? opt.label ?? Object.values(opt)[0]);
  }

  validateAdditionalInfoForm(): boolean {
    this.validationAdditionalInfoErrors = {};
    let isValid = true;

    if (this.correspType !== 'Arrivée') {
      return true;
    }

    for (const field of this.additionalInfoFields) {
      if (!field.code || !field.required) continue;
      const val = this.additionalInfoValues[field.code];
      const isEmpty = val === null || val === undefined || val === '' || (Array.isArray(val) && val.length === 0);
      if (isEmpty) {
        this.validationAdditionalInfoErrors[field.code] = `${field.label || field.code} est obligatoire`;
        isValid = false;
      }
    }

    return isValid;
  }

  private buildAdditionalInfoPayload(): Array<Record<string, string>> | null {
    if (this.correspType !== 'Arrivée' || this.additionalInfoFields.length === 0) {
      return null;
    }

    return this.additionalInfoFields
      .filter(f => !!f.code)
      .map(f => ({
        code: f.code as string,
        label: f.label ?? '',
        inputType: f.inputType ?? 'text',
        value: this.formatAdditionalInfoValue(this.additionalInfoValues[f.code as string]),
      }));
  }

  private formatAdditionalInfoValue(value: any): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (Array.isArray(value)) return value.join(', ');
    return String(value);
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

  selectCompanyFromModal(company: IContactCompany): void {
    this.expediteurModalOpen = false;
    this.selectedCompanyId = company.id;
    this.expediteur = company.nom || '';
    this.personsForSelectedCompany = [];
    this.selectedPersonId = null;
    this.contactEmail = '';
    this.loadingPersons = true;
    this.contactCompanyService.getActivePersonsByCompany(company.id).subscribe({
      next: res => {
        this.personsForSelectedCompany = res.body || [];
        this.loadingPersons = false;
      },
      error: () => {
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
    this.expediteur = '';
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

  loadPermissionsForCorresp(correspId: number): void {
    if (!correspId) return;
    this.correspService.getPermissions(correspId).subscribe({
      next: (res: CorrespPermissionsDTO) => {
        console.log('[PERMISSIONS] Raw response for correspId=' + correspId, JSON.stringify(res));
        const p = res?.corresp || { canRead: false, canWrite: false, canDelete: false, canAdmin: false };

        this.canReadCorresp = p.canRead;
        this.canWriteCorresp = p.canWrite;
        this.canDeleteCorresp = p.canDelete;
        this.canAdminCorresp = p.canAdmin;

        if (this.isGlobalAdmin) {
          this.canReadCorresp = true;
          this.canWriteCorresp = true;
          this.canDeleteCorresp = true;
          this.canAdminCorresp = true;
        }

        // DISPATCH + ADMIN/BOC => accorder toutes les permissions
        if (this.isAdminOrBoc && this.correspLoaded?.status === CorrespStatus.DISPATCH) {
          this.canReadCorresp = true;
          this.canWriteCorresp = true;
          this.canDeleteCorresp = true;
          this.canAdminCorresp = true;
          console.log('[PERMISSIONS] DISPATCH + ADMIN/BOC => all permissions granted');
        }

        // normaliser keys tasksPermissions (backend peut renvoyer des clefs string)
        this.taskPermissions = {};
        const rawTasks = (res && (res as any).tasksPermissions) || {};
        Object.keys(rawTasks).forEach(k => {
          const id = Number(k);
          if (!isNaN(id)) {
            this.taskPermissions[id] = rawTasks[k] as PermissionDTO;
          }
        });

        console.log('[PERMISSIONS] After backend: canRead=' + this.canReadCorresp + ' canWrite=' + this.canWriteCorresp);

        // Si le backend a déjà résolu les permissions => tout est OK
        if (this.canReadCorresp || this.isGlobalAdmin) {
          console.log('[PERMISSIONS] Permissions resolved from backend directly');
          if (!(this.canAdminCorresp || this.isGlobalAdmin)) {
            // Charger les tâches ACL de l'utilisateur pour :
            // 1) activer/désactiver les boutons sur les tâches individuelles
            // 2) recalculer canWriteCorresp si pas encore résolu
            this.loadCurrentUserAndAclTasks(() => {
              if (!this.canWriteCorresp) {
                this.recomputeCorrespPermsFromUserAclTasks();
              }
            });
          }
          return;
        }

        // ---------------------------------------------------------------
        // Le backend retourne canRead=false pour la corresp ET les tâches.
        // Cela peut arriver car le backend vérifie les ACL avec PrincipalSid(login)
        // mais les ACL ont été créées avec GrantedAuthoritySid(deptCode) et
        // le service OrgaCare n'a pas pu résoudre les départements.
        //
        // SOLUTION : Utiliser l'endpoint getAllTasksByUserAclAllStatuses
        // qui utilise une requête SQL directe sur les tables ACL.
        // Si le user a accès à une tâche de cette corresp, il a le droit.
        // ---------------------------------------------------------------
        console.log('[PERMISSIONS] Backend returned all false - checking via user ACL tasks endpoint...');
        this.loadCurrentUserAndAclTasks(() => {
          this.recomputeCorrespPermsFromUserAclTasks();
        });
      },
      error: err => {
        console.warn('Erreur chargement permissions, tentative fallback via ACL tasks', err);
        this.canReadCorresp = false;
        this.canWriteCorresp = false;
        this.canDeleteCorresp = false;
        this.canAdminCorresp = false;

        // DISPATCH + ADMIN/BOC => accorder les permissions même en cas d'erreur
        this.applyDispatchPermissionsForAdminOrBoc();

        // Fallback : tenter de résoudre les permissions via les tâches ACL de l'utilisateur
        this.loadCurrentUserAndAclTasks(() => {
          this.recomputeCorrespPermsFromUserAclTasks();
        });
      },
    });
  }

  /**
   * Accorde toutes les permissions si l'utilisateur est ADMIN ou BOC
   * et que la correspondance est en statut DISPATCH.
   * Appelée quand l'identité ou la corresp est chargée (gestion du timing asynchrone).
   */
  private applyDispatchPermissionsForAdminOrBoc(): void {
    if (this.isAdminOrBoc && this.correspLoaded?.status === CorrespStatus.DISPATCH) {
      this.canReadCorresp = true;
      this.canWriteCorresp = true;
      this.canDeleteCorresp = true;
      this.canAdminCorresp = true;
      console.log('[PERMISSIONS] applyDispatchPermissionsForAdminOrBoc => all permissions granted');
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
            console.log('[PERMISSIONS] userAclTaskIds loaded:', Array.from(ids));
            this.enrichTachesAssocieesFromAclTasks();
            this.refreshUserAclEnablement();
            // ← NOUVEAU : planifier l'auto-close MAINTENANT que userAclTaskIds est chargé
            this.scheduleLectureTasksAutoClose();
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

  private refreshUserAclEnablement(): void {
    // Hook pour déclencher la détection si nécessaire
  }

  /**
   * Enrichit les tâches de tachesAssociees avec les responsables résolus
   * provenant de l'endpoint getAllTasksByUserAclAllStatuses (qui contient
   * les responsables[] avec deptName et personneName déjà résolus).
   */
  private enrichTachesAssocieesFromAclTasks(): void {
    if (!this.tachesAssociees || this.tachesAssociees.length === 0 || this.userAclTasksMap.size === 0) return;
    let enriched = false;
    this.tachesAssociees.forEach(task => {
      const aclTask = this.userAclTasksMap.get(task.id);
      if (aclTask) {
        const aclResponsables = (aclTask as any).responsables;
        if (Array.isArray(aclResponsables) && aclResponsables.length > 0) {
          // Copier les responsables résolus vers la tâche associée
          (task as any).responsables = aclResponsables;
          enriched = true;
        }
      }
    });
    if (enriched) {
      // Re-construire les noms de responsables avec les données enrichies
      this.resolveResponsableNames();
    }
  }
  /**
   * Utilise userAclTaskIds (de l'endpoint SQL direct tasksByUserAclAllStatuses)
   * pour résoudre les permissions de la corresp quand le backend permissions
   * retourne tout false. Si le user a accès ACL à une tâche de cette corresp,
   * il a le droit de lire/écrire la corresp selon le taskType.
   */
  private recomputeCorrespPermsFromUserAclTasks(): void {
    // Si admin global => déjà tout autorisé
    if (this.isGlobalAdmin) {
      return;
    }

    // DISPATCH + ADMIN/BOC => accorder toutes les permissions
    if (this.isAdminOrBoc && this.correspLoaded?.status === CorrespStatus.DISPATCH) {
      this.canReadCorresp = true;
      this.canWriteCorresp = true;
      this.canDeleteCorresp = true;
      this.canAdminCorresp = true;
      console.log('[PERMISSIONS] recompute: DISPATCH + ADMIN/BOC => all permissions granted');
      return;
    }

    // Si déjà résolu (canRead ET canWrite) => pas besoin de recalculer
    if (this.canReadCorresp && this.canWriteCorresp) {
      return;
    }

    // Si les données ne sont pas encore chargées, on ne fait rien (sera rappelé plus tard)
    if (!this.tachesAssociees || this.tachesAssociees.length === 0 || this.userAclTaskIds.size === 0) {
      return;
    }

    // Trouver les tâches de cette corresp auxquelles le user a accès via ACL
    const correspTaskIds = (this.tachesAssociees || []).map(t => t.id);
    const accessibleTaskIds = correspTaskIds.filter(id => this.userAclTaskIds.has(id));

    console.log(
      '[PERMISSIONS] recompute: correspTaskIds=',
      correspTaskIds,
      ' userAclTaskIds=',
      Array.from(this.userAclTaskIds),
      ' intersection=',
      accessibleTaskIds
    );

    if (accessibleTaskIds.length === 0) {
      // Vérifier aussi via selectedTaskId (le taskId passé en query param depuis la page home)
      if (this.selectedTaskId != null && this.userAclTaskIds.has(this.selectedTaskId)) {
        accessibleTaskIds.push(this.selectedTaskId);
        console.log('[PERMISSIONS] recompute: found selectedTaskId', this.selectedTaskId, 'in userAclTaskIds');
      }
    }

    if (accessibleTaskIds.length === 0) {
      console.warn('[PERMISSIONS] User has NO ACL access to any task of this corresp');
      return;
    }

    // Le user a accès à au moins une tâche => il peut lire la corresp
    if (!this.canReadCorresp) {
      this.canReadCorresp = true;
      console.log('[PERMISSIONS] recompute: granted canRead from ACL task access');
    }

    // Vérifier si une tâche accessible a un taskType qui donne WRITE sur la corresp
    if (!this.canWriteCorresp) {
      const accessibleTasks = (this.tachesAssociees || []).filter(t => accessibleTaskIds.includes(t.id));
      console.log(
        '[PERMISSIONS] recompute: accessible tasks taskTypes=',
        accessibleTasks.map(t => ({ id: t.id, taskType: t.taskType, status: t.status }))
      );
      // IMPORTANT: canWrite seulement si la tâche est encore IN_PROGRESS
      // Une tâche CLOSED ne donne plus le droit d'écriture
      const hasWritableTask = accessibleTasks.some(t => {
        const tt = (t.taskType || '').toLowerCase();
        const isWritableType = tt === 'traitement' || tt === 'signature' || tt === 'validation';
        const isActiveTask = t.status === CorrespStatus.IN_PROGRESS;
        return isWritableType && isActiveTask;
      });

      if (hasWritableTask) {
        this.canWriteCorresp = true;
        console.log('[PERMISSIONS] recompute: granted canWrite from IN_PROGRESS task with writable taskType');
      }
    }

    console.log('[PERMISSIONS] recompute final: canRead=' + this.canReadCorresp + ' canWrite=' + this.canWriteCorresp);
  }

  /**
   * Résout le nom du responsable pour chaque tâche et le met dans task.responsableName.
   * Utilise les champs responsables[].personneName, responsables[].deptName, ou résout
   * responsables[].codeDept via OrgaCare si nécessaire.
   */
  private resolveResponsableNames(): void {
    const tasks = this.tachesAssociees || [];
    if (tasks.length === 0) return;

    // 1) Collecter les codes de départements à résoudre
    const codesToResolve = new Set<string>();
    tasks.forEach(t => {
      const responsables = (t as any).responsables;
      if (Array.isArray(responsables) && responsables.length > 0) {
        responsables.forEach((r: any) => {
          if (!r) return;
          // Si pas de personneName ni deptName, on doit résoudre le codeDept
          if (!r.personneName && !r.deptName && r.codeDept) {
            const code = r.codeDept.toString().trim();
            if (code && !this.deptNameByCode.has(code)) {
              codesToResolve.add(code);
            }
          }
        });
      } else if ((t as any).responsible) {
        const code = ((t as any).responsible || '').toString().trim();
        if (code && !this.deptNameByCode.has(code)) {
          codesToResolve.add(code);
        }
      } else {
        // Pas de responsables ni responsible => extraire depuis object
        const extracted = this.extractResponsableFromObject(t.object);
        if (extracted) {
          // Le code extrait peut être un codeDept (ex: "Dept-00002") ou un matricule
          // On essaie de le résoudre via OrgaCare
          const code = extracted.trim();
          if (code && !this.deptNameByCode.has(code)) {
            codesToResolve.add(code);
          }
        }
      }
    });

    // 2) Résoudre les codes manquants via OrgaCare puis construire les noms
    const missing = Array.from(codesToResolve);
    if (missing.length === 0) {
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
      complete: () => {
        this.buildResponsableNamesForTasks();
      },
    });
  }

  /**
   * Construit task.responsableName pour chaque tâche à partir des responsables résolus.
   * Priorité :
   *  1) responsables[] (personneName / deptName / codeDept résolu / matriculePers)
   *  2) responsible (ancien champ string)
   *  3) responsableName déjà rempli par le backend
   *  4) Extraction depuis le champ 'object' ("NomResp effectuera la tâche de ...")
   */
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

          if (pName && pName.toString().trim()) {
            displays.push(pName.toString().trim());
          } else if (dName && dName.toString().trim()) {
            displays.push(dName.toString().trim());
          } else if (codeDept && codeDept.toString().trim()) {
            const code = codeDept.toString().trim();
            const resolved = this.deptNameByCode.get(code);
            displays.push(resolved || code);
          } else if (matricule && matricule.toString().trim()) {
            displays.push(matricule.toString().trim());
          }
        });
      } else if ((task as any).responsible) {
        const code = ((task as any).responsible || '').toString().trim();
        if (code) {
          const name = this.deptNameByCode.get(code);
          displays.push(name || code);
        }
      } else {
        // Pas de responsables ni responsible => extraire depuis object et résoudre
        const extracted = this.extractResponsableFromObject(task.object);
        if (extracted) {
          const code = extracted.trim();
          const resolved = this.deptNameByCode.get(code);
          displays.push(resolved || code);
        }
      }

      // Dédoublonner et joindre
      const uniq = Array.from(new Set(displays.map(d => (d || '').trim()).filter(s => !!s)));

      if (uniq.length > 0) {
        task.responsableName = uniq.join(', ');
      } else if (task.responsableName && task.responsableName.trim()) {
        // Le backend a déjà rempli responsableName (via getDepartementNomByCode) — on le garde
      } else {
        // Pas de données pour résoudre le nom
        task.responsableName = null;
      }
    });
  }

  /**
   * Extrait le nom du responsable depuis le champ 'object' de la tâche.
   * Formats connus :
   *   - "NomResponsable effectuera la tâche de TYPE ..."
   *   - "Tâche de TYPE ..."  (pas de responsable)
   */
  private extractResponsableFromObject(object?: string | null): string | null {
    if (!object) return null;
    const obj = object.trim();

    // Pattern: "XXX effectuera la tâche de ..."
    const idx = obj.indexOf(' effectuera la tâche de ');
    if (idx > 0) {
      return obj.substring(0, idx).trim() || null;
    }

    // Pattern: "Tâche de ..." => pas de responsable nommé
    return null;
  }

  private scrollToTaskIfRequested(): void {
    if (this.selectedTaskId != null) {
      if (this.accordionStates && typeof this.accordionStates === 'object') {
        (this.accordionStates as any)['taches'] = true;
      }
      const el = document.getElementById(`task-${this.selectedTaskId}`);
      if (el && typeof (el as any).scrollIntoView === 'function') {
        (el as any).scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        const container = document.getElementById('tasksSection');
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      }
    }
  }

  /**
   * Planifie la clôture automatique des tâches LECTURE IN_PROGRESS
   * auxquelles l'utilisateur a accès via ACL, après 5 secondes.
   */
  // NOUVEAU scheduleLectureTasksAutoClose
  private scheduleLectureTasksAutoClose(): void {
    if (this.lectureAutoCloseTimer) {
      clearTimeout(this.lectureAutoCloseTimer);
      this.lectureAutoCloseTimer = null;
    }

    const lectureTaskIds = (this.tachesAssociees || [])
      .filter(
        t => (t.taskType || '').toLowerCase() === 'lecture' && t.status === CorrespStatus.IN_PROGRESS && this.userAclTaskIds.has(t.id)
      )
      .map(t => t.id);

    console.log('[AutoClose] lecture tasks eligibles:', lectureTaskIds);

    if (lectureTaskIds.length === 0) return;

    this.lectureAutoCloseTimer = setTimeout(() => {
      console.log('[AutoClose] 5s écoulées, clôture des tâches lecture:', lectureTaskIds);
      // Appeler changeTasksStatus pour chaque tâche lecture (gère ACL + statut)
      lectureTaskIds.forEach(taskId => {
        this.changeTasksStatus(this.correspLoaded.id, taskId, 'CLOSED');
      });
    }, 5000);
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

    // contrôle permission : authorisé si canWrite ou canAdmin
    if (!(this.canWriteCorresp || this.canAdminCorresp)) {
      this.showNotification('Vous n’avez pas le droit d’enregistrer ce brouillon', 'error');
      return;
    }

    if (!this.selectedTypeDocument) {
      this.showNotification('Veuillez sélectionner un type de document !', 'error');
      return;
    }

    if (!this.validateAdditionalInfoForm()) {
      this.showNotification('Veuillez remplir tous les champs obligatoires des détails supplémentaires', 'error');
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
      msgSender: this.currentUserEmailDetail || '',
      msgReceiver: this.messageReceiverEmails.join(', ') || this.draftEmailReceiver || '',
      msgCopyTo: this.messageCopyToEmails.join(', ') || this.draftEmailCopyTo || '',
      idSociete: this.correspLoaded.idSociete ?? null,
      nomSociete: this.correspLoaded.nomSociete ?? null,
      codeUniqueSociete: this.correspLoaded.codeUniqueSociete ?? null,
      additionalInfo: this.buildAdditionalInfoPayload(),
    };

    const typeDocumentDTO = this.selectedTypeDocument!;

    this.isSaving = true;

    this.correspService.updateCorrespDraft(this.correspLoaded.id, correspDTO, typeDocumentDTO).subscribe({
      next: res => {
        this.isSaving = false;
        this.correspLoaded = res.body!;

        this.correspService.loadBodyFromFile({ correspId: this.correspLoaded.id }).subscribe(body => {
          this.htmlContent = body;
        });

        // Envoyer les tâches pendingTasks en lot séquentiellement
        if (this.pendingTasks.length > 0) {
          const tasksToSend = [...this.pendingTasks];
          this.pendingTasks = []; // vider immédiatement pour éviter double envoi

          const sendNext = (index: number): void => {
            if (index >= tasksToSend.length) {
              // Toutes les tâches envoyées → rafraîchir la liste affichée et vider l'aperçu
              this.taskService.getAllTasksByCorrespId({ correspId: this.correspLoaded.id }).subscribe(r => {
                const list = r.body || [];
                this.taskService.enrichTasksWithCanModify(list).subscribe(enriched => {
                  this.tachesAssociees = enriched || [];
                  this.pendingTasks = []; // vider ici après rafraîchissement confirmé
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
              error: err => {
                console.warn(`Erreur envoi tâche auto (${t.typeTask})`, err);
                sendNext(index + 1); // continuer même en cas d'erreur
              },
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

  get canSoumettreCorresp(): boolean {
    if (!this.correspLoaded) return false;
    const status = this.correspLoaded.status;
    const isEditableLeft = status === CorrespStatus.DRAFT || status === CorrespStatus.DISPATCH;

    if (!isEditableLeft) return false;

    // INCOMING : logique actuelle (admin/boc uniquement)
    if (this.correspLoaded.corresptype === 'INCOMING') {
      return this.isAdminOrBoc;
    }

    // OUTGOING / INTERNAL : admin/boc OU ACL write
    return this.isAdminOrBoc || this.canWriteCorresp || this.canAdminCorresp;
  }

  get canCloturerCorresp(): boolean {
    if (!this.correspLoaded) return false;
    const status = this.correspLoaded.status;

    if (status !== CorrespStatus.IN_PROGRESS) return false;

    // OUTGOING : rien ne change (admin/boc OU ACL write)
    if (this.correspLoaded.corresptype === 'OUTGOING') {
      return this.isAdminOrBoc || this.canWriteCorresp || this.canAdminCorresp;
    }

    // INCOMING et INTERNAL : uniquement le user ayant une tâche TRAITEMENT IN_PROGRESS avec ACL
    const hasActiveTraitementTask = (this.tachesAssociees || []).some(t => {
      const tt = (t.taskType || '').toLowerCase();
      return tt === 'traitement' && t.status === CorrespStatus.IN_PROGRESS && this.userAclTaskIds.has(t.id);
    });

    return this.canAdminCorresp || hasActiveTraitementTask;
  }

  get taskCompletionPercentage(): number {
    if (!this.tachesAssociees || this.tachesAssociees.length === 0) {
      return 0;
    }

    // Pour les utilisateurs non-admin/BOC, exclure les tâches DRAFT du calcul
    const baseTasks =
      this.isAdminOrBoc || this.isGlobalAdmin || this.correspLoaded?.corresptype === 'OUTGOING'
        ? this.tachesAssociees
        : this.tachesAssociees.filter(t => t.status !== CorrespStatus.DRAFT);

    const activeTasks = baseTasks.filter(t => t.status !== CorrespStatus.CANCELLED);
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
      case CorrespStatus.DISPATCH:
        return '#6c757d'; // Grey (dispatch)
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
      case CorrespStatus.DISPATCH:
        return 'Dispatch';
      case CorrespStatus.CLOSED:
        return 'achevée'; // Green
      case CorrespStatus.CANCELLED:
        return 'annulée'; // Red
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

  removePendingTask(index: number): void {
    const task = this.pendingTasks[index];

    // Supprimer la tâche
    this.pendingTasks.splice(index, 1);

    // Synchroniser les champs selon le type de tâche
    if (task.typeTask === 'traitement') {
      // Vider le destinataire si aucune autre tâche traitement ne reste
      const hasOtherTraitement = this.pendingTasks.some(t => t.typeTask === 'traitement');
      if (!hasOtherTraitement) {
        this.destinataire = '';
        this.destinataireLabel = '';
        this.recipientSelectedDept = null;
      }
    } else if (task.typeTask === 'lecture') {
      // Retirer le département CC correspondant
      this.selectedCcDepts = this.selectedCcDepts.filter(cc => cc.codeDept !== task.responsable && cc.nomDept !== task.responsableName);
      this.updateCcLabelsFromSelection();
    }
  }

  openEditPendingTaskModal(index: number, modal: any): void {
    const task = this.pendingTasks[index];

    this.editingPendingTaskIndex = index;

    // Pré-remplir les champs du modal avec les données de la tâche
    this.selectedType = task.typeTask;
    this.dateLimite = task.dateLimite || '';
    this.commentaire = task.commentaire || '';
    this.selectedDepartement = task.responsable;
    this.selectedDepartementName = task.responsableName;

    // Restaurer la sélection dans l'arbre
    this.selectedResponsables = task.responsable ? [{ codeDept: task.responsable, displayName: task.responsableName }] : [];

    // Charger l'arbre si pas encore chargé
    this.prepareAndLoadOrgaThenTree();

    // Ouvrir le modal en mode édition
    this.modalService.open(modal, { size: 'xl' }).result.then(
      () => {
        // Confirmer : mettre à jour la pendingTask
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
        // Annulé — reset sans modifier
        this.resetForm();
      }
    );
  }

  // --- replace existing saveTask() with this ---
  saveTask(): void {
    if (this.btnSaveTaskDisabled) return;

    this.validationErrors = {};
    if (!this.validateForm()) return;

    // ✅ MODE ÉDITION PENDING : mise à jour locale uniquement, pas de backend
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
          this.selectedCcDepts[ccIdx] = {
            ...this.selectedCcDepts[ccIdx],
            codeDept: updated.responsable,
            nomDept: updated.responsableName,
          };
          this.updateCcLabelsFromSelection();
        }
      }

      this.pendingTasks[this.editingPendingTaskIndex] = updated;
      this.editingPendingTaskIndex = -1;
      this.resetForm();
      this.modalService.dismissAll();
      return;
    }

    // ✅ MODE NOUVELLE TÂCHE : sauvegarde backend normale
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
    if (this.dateLimite) {
      objectBuilder += ` en ne dépassant pas la date limite du ${dayjs(this.dateLimite).format('DD/MM/YYYY')}`;
    }

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
            this.resolveResponsableNames();
            this.refreshUserAclEnablement();
            this.recomputeCorrespPermsFromUserAclTasks();
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
  // State pour le mode "commentaire avant terminer" par tâche
  taskCompletionState: Map<number, { showComment: boolean; comment: string }> = new Map();
  taskCancellationState: Map<number, { showComment: boolean; comment: string }> = new Map();

  openTasksModal(content: any): void {
    // Bloquer uniquement si aucun droit du tout
    if (!this.canWriteCorresp && !this.canAdminCorresp && !this.isGlobalAdmin && !this.isReadOnlyAclUser) {
      this.showNotification("Vous n'avez pas le droit d'ajouter une tâche sur ce courrier", 'error');
      return;
    }
    this.editingPendingTaskIndex = -1;
    this.selectedDepartement = '';
    this.resetForm();
    // Pré-sélectionner 'lecture' si l'utilisateur est lecture seule
    if (this.isReadOnlyAclUser) {
      this.selectedType = 'lecture';
    }
    this.prepareAndLoadOrgaThenTree();
    this.modalService.open(content, { size: 'xl' });
  }

  openDeleteModal(content: any): void {
    this.modalService.open(content, { centered: true, size: 'xl' });
  }

  private prepareAndLoadOrgaThenTree(): void {
    if (this.selectedOrgaCode) {
      this.loadTreeForModal(this.selectedOrgaCode);
      return;
    }

    // Chercher le codeOrganigramme via la société de la corresp
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
      // En mode édition pending : remplacer la sélection existante
      if (this.editingPendingTaskIndex >= 0) {
        this.selectedResponsables = [{ codeDept: code, displayName: node.nom ?? code }];
      } else {
        this.selectedResponsables.push({ codeDept: code, displayName: node.nom ?? code });
      }
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
      // En mode édition pending : remplacer la sélection existante
      if (this.editingPendingTaskIndex >= 0) {
        this.selectedResponsables = [{ codeDept: code || null, matriculePers: matricule, displayName: person.nomPrenom ?? matricule }];
      } else {
        this.selectedResponsables.push({ codeDept: code || null, matriculePers: matricule, displayName: person.nomPrenom ?? matricule });
      }
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
    const perm = this.taskPermissions[tasksId];
    const isAdminEffective = this.isGlobalAdmin || this.canAdminCorresp;
    const canModifyLocal = !!(this.tachesAssociees.find(t => (t as any)?.id === tasksId) as any)?.canModify;
    if (!isAdminEffective && !canModifyLocal && !this.userAclTaskIds.has(tasksId)) {
      this.showNotification('Action non autorisée', 'error');
      return;
    }
    this.taskService.deleteTaskFromCorrespAndDB(correspId, tasksId).subscribe({
      next: () => {
        // update UI without full reload
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
      this.showNotification('Vous n’avez pas le droit de modifier le statut de la tâche', 'error');
      return;
    }
    this.correspService.changeTaskStatus(correspId, taskId, status).subscribe({
      next: () => {
        // refresh tasks list
        this.taskService.getAllTasksByCorrespId({ correspId: this.correspLoaded.id }).subscribe(r => {
          const list = r.body || [];
          this.taskService.enrichTasksWithCanModify(list).subscribe(enriched => {
            this.tachesAssociees = enriched || [];
            this.resolveResponsableNames();
            // Recompute permissions based on updated task statuses
            // canManageAttachments and isReadOnlyAclUser are getters that depend on tachesAssociees,
            // so they auto-recompute. But canWriteCorresp needs explicit refresh:
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

  /**
   * Recalcule canWriteCorresp en fonction de l'état actuel des tâches.
   * À appeler après tout changement de statut de tâche.
   */
  private refreshCorrespWritePermission(): void {
    if (this.isGlobalAdmin || this.canAdminCorresp) return; // admin garde toujours ses droits

    // DISPATCH + ADMIN/BOC
    if (this.isAdminOrBoc && this.correspLoaded?.status === CorrespStatus.DISPATCH) return;

    // Recalculer canWriteCorresp selon les tâches IN_PROGRESS accessibles à cet utilisateur
    const accessibleTasks = (this.tachesAssociees || []).filter(t => this.userAclTaskIds.has(t.id));

    const hasActiveWritableTask = accessibleTasks.some(t => {
      const tt = (t.taskType || '').toLowerCase();
      const isWritableType = tt === 'traitement' || tt === 'signature' || tt === 'validation';
      return isWritableType && t.status === CorrespStatus.IN_PROGRESS;
    });

    if (!hasActiveWritableTask && !this.canAdminCorresp) {
      this.canWriteCorresp = false;
      console.log('[PERMISSIONS] refreshCorrespWritePermission: canWrite revoked — no active writable tasks remaining');
    }
  }

  soumettreCorresp(correspId: number): void {
    if (!this.canSoumettreCorresp) {
      this.showNotification("Vous n'avez pas le droit de soumettre ce courrier", 'error');
      return;
    }

    // Si OUTGOING + EMAIL => ouvrir le modal preview email avant soumission
    if (this.correspLoaded?.corresptype === 'OUTGOING' && this.correspLoaded?.dispatchType === 'EMAIL') {
      this.openEmailSubmitModal(correspId);
      return;
    }

    // Sinon soumettre directement
    this.doSoumettreCorresp(correspId);
  }

/** Soumettre sans envoyer email (logique originale) */
  doSoumettreCorresp(correspId: number): void {
    if (this.isSubmitting) {
      return;
    }
    this.isSubmitting = true;
    this.correspService.soumettreCorresp({ correspId }).subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: err => {
        this.isSubmitting = false;
        console.error(err);
        this.showNotification('Erreur', 'error');
      },
    });
  }

  /** Ouvre le modal de prévisualisation email avant soumission */
  openEmailSubmitModal(correspId: number): void {
    this.showEmailSubmitModal = true;
    this.isLoadingEmailPreview = true;
    this.emailPreviewHtml = '';
    this.emailPreviewError = '';
    this.sendEmailOnSubmitError = '';
    this.sendEmailOnSubmitSuccess = false;
    this.savedEmailMessageId = null;

    // Trouver le modèle approprié (premier modèle disponible ou celui sélectionné)
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
      error: err => {
        console.error('Erreur preview email', err);
        this.emailPreviewError = "Impossible de charger l'aperçu. Vous pouvez soumettre sans envoyer.";
        this.isLoadingEmailPreview = false;
      },
    });
  }

  closeEmailSubmitModal(): void {
    this.showEmailSubmitModal = false;
  }

  /** Soumettre sans envoyer l'email */
  submitWithoutEmail(): void {
    this.closeEmailSubmitModal();
    this.doSoumettreCorresp(this.correspLoaded.id);
  }

  /** Soumettre ET envoyer l'email */
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

    // Envoyer l'email directement (saveCopy=false => envoi direct)
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

  cloturerCorresp(correspId: number): void {
    if (!this.canCloturerCorresp) {
      this.showNotification('Vous n’avez pas le droit de clôturer ce courrier', 'error');
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
  generateReference(): void {
    if (!this.correspLoaded || !this.correspLoaded.id) return;

    if (!(this.canWriteCorresp || this.canAdminCorresp)) {
      this.showNotification("Vous n'avez pas le droit de générer une référence", 'error');
      return;
    }

    if (!this.selectedTypeDocument) {
      this.showNotification('Veuillez sélectionner un type de document !', 'error');
      return;
    }

    if (!this.validateAdditionalInfoForm()) {
      this.showNotification('Veuillez remplir tous les champs obligatoires des détails supplémentaires', 'error');
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
      // ✅ AJOUT : préserver les infos société pour que generateReference() ait le bon codeUniqueSociete
      idSociete: this.correspLoaded.idSociete ?? null,
      nomSociete: this.correspLoaded.nomSociete ?? null,
      codeUniqueSociete: this.correspLoaded.codeUniqueSociete ?? null,
      additionalInfo: this.buildAdditionalInfoPayload(),
    };

    this.isSaving = true;

    // 1) Sauvegarder d'abord le brouillon
    this.correspService.updateCorrespDraft(this.correspLoaded.id, correspDTO, this.selectedTypeDocument).subscribe({
      next: res => {
        this.correspLoaded = res.body!;

        // 2) Envoyer les pendingTasks séquentiellement avant de générer la référence
        if (this.pendingTasks.length > 0) {
          const tasksToSend = [...this.pendingTasks];
          this.pendingTasks = []; // vider immédiatement pour éviter double envoi

          const sendNext = (index: number): void => {
            if (index >= tasksToSend.length) {
              // Toutes les tâches envoyées → générer la référence
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
              error: err => {
                console.warn(`Erreur envoi tâche auto (${t.typeTask})`, err);
                sendNext(index + 1); // continuer même en cas d'erreur
              },
            });
          };

          sendNext(0);
        } else {
          // Pas de pendingTasks → générer directement la référence
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
        // Rafraîchir la liste des tâches affichées
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
          // upload complete, backend returns path/string
          this.uploadProgress.set(uniqueName, 100);
          pjModel.path = progressOrResponse;
          if (!this.accordionStates['pieces']) {
            this.accordionStates['pieces'] = true;
          }

          // assign PJ to corresp (component wrapper handles permission & UI update)
          this.addPjToCorresp(pjModel);

          // small delay to show 100% then remove progress
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
        this.showNotification('Échec du téléchargement du fichier', 'error');
      },
    });
  }
  private addPjToCorresp(pjModel: IPj): void {
    if (!this.correspLoaded || !this.correspLoaded.id) {
      console.warn('Aucune correspondance chargée pour attacher la PJ');
      return;
    }

    if (!(this.canWriteCorresp || this.canAdminCorresp)) {
      this.showNotification("Vous n'avez pas le droit d'ajouter une pièce jointe", 'error');
      return;
    }

    this.correspService.addPjToCorresp(pjModel, this.correspLoaded.id).subscribe({
      next: () => {
        // Refresh pj list localement (préférable à un reload complet)
        this.pjService.getAllPjByCorrespId({ correspId: this.correspLoaded.id }).subscribe({
          next: res => {
            this.pjsLoaded = res.body || [];
            this.showNotification('Pièce jointe ajoutée', 'success');
          },
          error: err => {
            console.error('Erreur rafraîchissement PJ:', err);
            this.showNotification('Pièce jointe ajoutée (mais impossible de rafraîchir la liste)', 'success');
          },
        });
      },
      error: err => {
        console.error('Failed to assign PJ:', err);
        this.showNotification("Impossible d'associer la pièce jointe", 'error');
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

  // === Rename PJ ===
  openRenamePjModal(pj: IPj): void {
    if (!(this.canManageAttachments || this.canWriteCorresp || this.canAdminCorresp)) {
      this.showNotification("Vous n'avez pas le droit de renommer cette pièce jointe", 'error');
      return;
    }
    this.pjToRename = pj;
    this.renamePjNewName = pj.name || '';
    this.renamePjError = '';
    this.showRenamePjModal = true;
  }

  closeRenamePjModal(): void {
    if (this.isRenamingPj) return;
    this.showRenamePjModal = false;
    this.pjToRename = null;
    this.renamePjNewName = '';
    this.renamePjError = '';
  }

  confirmRenamePj(): void {
    if (!this.pjToRename) return;

    const trimmed = (this.renamePjNewName || '').trim();
    if (!trimmed) {
      this.renamePjError = 'Le nom ne peut pas être vide';
      return;
    }

    this.isRenamingPj = true;
    this.renamePjError = '';

    this.pjService.renamePj(this.pjToRename.id, trimmed).subscribe({
      next: () => {
        this.isRenamingPj = false;
        const idx = this.pjsLoaded.findIndex(p => p.id === this.pjToRename!.id);
        if (idx >= 0) {
          this.pjsLoaded[idx] = { ...this.pjsLoaded[idx], name: trimmed };
        }
        this.showNotification('Pièce jointe renommée', 'success');
        this.closeRenamePjModal();
      },
      error: err => {
        this.isRenamingPj = false;
        console.error('Erreur renommage PJ', err);
        this.renamePjError = 'Erreur lors du renommage';
      },
    });
  }

  openDeletePjModal(content: any, pj: IPj) {
    this.selectedPjToDelete = pj;

    this.modalService.open(content, { centered: true, size: 'lg' });
  }

  deletePjWithCorresp(): void {
    if (!this.selectedPjToDelete) {
      this.showNotification('Aucune pièce sélectionnée pour suppression', 'error');
      return;
    }

    if (!(this.canWriteCorresp || this.canDeleteCorresp || this.canAdminCorresp)) {
      this.showNotification('Vous n’avez pas le droit de supprimer cette pièce jointe', 'error');
      return;
    }

    const req = { uniqueName: this.selectedPjToDelete.uniqueName, fileType: this.selectedPjToDelete.fileType };

    this.pjService.deletePjWithCorresp(req).subscribe({
      next: () => {
        // remove from local array (no reload)
        this.pjsLoaded = this.pjsLoaded.filter(p => p.uniqueName !== this.selectedPjToDelete.uniqueName);
        this.selectedPjToDelete = undefined as any;
        this.showNotification('Pièce jointe supprimée', 'success');
      },
      error: error => {
        console.error('Delete failed:', error);
        this.showNotification('Échec de la suppression du fichier', 'error');
      },
    });
  }

  deleteCorresp(): void {
    if (!(this.canDeleteCorresp || this.canAdminCorresp)) {
      this.showNotification("Vous n'avez pas le droit de supprimer cette correspondance", 'error');
      return;
    }

    // petite confirmation UX
    if (!confirm('Confirmez-vous la suppression de cette correspondance ?')) {
      return;
    }

    if (!this.correspLoaded || !this.correspLoaded.id) {
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

  // --------------------------------------------------------------------------
  // Recipient (Destinataire) – organigramme tree (single-select)
  // --------------------------------------------------------------------------
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
    if (this.recipientExpandedNodes.has(nodeId)) {
      this.recipientExpandedNodes.delete(nodeId);
    } else {
      this.recipientExpandedNodes.add(nodeId);
    }
  }

  isRecipientNodeExpanded(nodeId: number): boolean {
    return this.recipientExpandedNodes.has(nodeId);
  }

  selectRecipientDept(node: DepartementTreeFeignDTO, modalRef: any): void {
    this.recipientSelectedDept = node;
    this.destinataireLabel = node.nom || '';
    this.destinataire = node.email || '';

    // Mettre à jour ou créer la pendingTask traitement
    const existingIdx = this.pendingTasks.findIndex(t => t.typeTask === 'traitement');
    const newTask = {
      typeTask: 'traitement',
      responsable: node.code ?? '',
      dateLimite: existingIdx >= 0 ? this.pendingTasks[existingIdx].dateLimite : '',
      responsableName: node.nom ?? '',
      commentaire: existingIdx >= 0 ? this.pendingTasks[existingIdx].commentaire : '',
    };
    if (existingIdx >= 0) {
      this.pendingTasks[existingIdx] = newTask;
    } else {
      this.pendingTasks.push(newTask);
    }

    modalRef.close();
  }

  clearRecipientDept(): void {
    this.recipientSelectedDept = null;
    this.destinataire = '';
    this.destinataireLabel = '';

    // Supprimer la pendingTask de type traitement associée
    this.pendingTasks = this.pendingTasks.filter(t => t.typeTask !== 'traitement');
  }

  // --------------------------------------------------------------------------
  // CC (Contact En Copie) – organigramme tree (multi-select)
  // --------------------------------------------------------------------------
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
    if (this.ccExpandedNodes.has(nodeId)) {
      this.ccExpandedNodes.delete(nodeId);
    } else {
      this.ccExpandedNodes.add(nodeId);
    }
  }

  isCcNodeExpanded(nodeId: number): boolean {
    return this.ccExpandedNodes.has(nodeId);
  }

  toggleCcDept(node: DepartementTreeFeignDTO): void {
    const code = node.code ?? '';
    const idx = this.selectedCcDepts.findIndex(d => d.codeDept === code);
    if (idx >= 0) {
      this.selectedCcDepts.splice(idx, 1);
    } else {
      this.selectedCcDepts.push({
        idDept: node.id ?? null,
        codeDept: code,
        nomDept: node.nom ?? '',
        emailDept: node.email ?? '',
      });
    }
  }

  isCcDeptSelected(node: DepartementTreeFeignDTO): boolean {
    return !!this.selectedCcDepts.find(d => d.codeDept === (node.code ?? ''));
  }

  removeCcDept(cc: IContactCopieCorresp): void {
    const idx = this.selectedCcDepts.findIndex(d => d.codeDept === cc.codeDept);
    if (idx >= 0) {
      this.selectedCcDepts.splice(idx, 1);
    }
    this.updateCcLabelsFromSelection();

    // Supprimer la pendingTask de type lecture associée à ce département
    this.pendingTasks = this.pendingTasks.filter(
      t => !(t.typeTask === 'lecture' && (t.responsable === cc.codeDept || t.responsableName === cc.nomDept))
    );
  }

  // NOUVEAU — ajouter à la fin, avant modalRef.close()
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

    // Mettre à jour msgCopyTo avec les emails des départements CC
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

  // Table Windows-1256 → Unicode
  private readonly WIN1256: number[] = [
    8364, 1662, 8218, 402, 8222, 8230, 8224, 8225, 710, 8240, 1657, 8249, 338, 1670, 1688, 1672, 1711, 8216, 8217, 8220, 8221, 8226, 8211,
    8212, 1705, 8482, 1681, 8250, 339, 8204, 8205, 1722, 160, 1548, 162, 163, 164, 165, 166, 167, 168, 169, 1726, 171, 172, 173, 174, 175,
    176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 1563, 187, 188, 189, 190, 1567, 1729, 1569, 1570, 1571, 1572, 1573, 1574, 1575, 1576,
    1577, 1578, 1579, 1580, 1581, 1582, 1583, 1584, 1585, 1586, 1587, 1588, 1589, 1590, 215, 1591, 1592, 1593, 1594, 1600, 1601, 1602, 1603,
    224, 1604, 226, 1605, 1606, 1607, 1608, 231, 232, 233, 234, 235, 1609, 1610, 238, 239, 1611, 1612, 1613, 1614, 244, 1615, 1616, 247,
    1617, 249, 1618, 251, 252, 8206, 8207, 1746,
  ];

  private fixWindows1256(str: string): string {
    if (!str) return '';
    // Détecter si le contenu contient des chars Latin-1 étendu (128-255)
    // qui sont en réalité des bytes Windows-1256
    const hasLatin1Arabic = /[\x80-\xFF]/.test(str);
    if (!hasLatin1Arabic) return str; // déjà correct, rien à faire

    let result = '';
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      if (code >= 128 && code <= 255) {
        result += String.fromCharCode(this.WIN1256[code - 128]);
      } else {
        result += str[i];
      }
    }
    return result;
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
  get canManageAttachments(): boolean {
    // Admin ou droit d'écriture direct sur la corresp => toujours autorisé
    if (this.canWriteCorresp || this.canAdminCorresp || this.isGlobalAdmin) return true;

    // Vérifier si l'utilisateur a une tâche IN_PROGRESS de type traitement/signature/validation via ACL
    // IMPORTANT: on filtre uniquement les tâches IN_PROGRESS — une tâche CLOSED ne donne plus le droit d'écriture
    const accessibleTasks = (this.tachesAssociees || []).filter(t => this.userAclTaskIds.has(t.id));
    return accessibleTasks.some(t => {
      const tt = (t.taskType || '').toLowerCase();
      const isWritableType = tt === 'traitement' || tt === 'signature' || tt === 'validation';
      const isActiveTask = t.status === CorrespStatus.IN_PROGRESS;
      return isWritableType && isActiveTask;
    });
  }

  get visibleTasksCount(): number {
    return (this.tachesAssociees || []).filter(
      t => t.status !== CorrespStatus.DRAFT || this.isAdminOrBoc || this.isGlobalAdmin || this.correspLoaded?.corresptype === 'OUTGOING'
    ).length;
  }

  get isReadOnlyAclUser(): boolean {
    if (this.canWriteCorresp || this.canAdminCorresp || this.isGlobalAdmin) return false;
    const accessibleTasks = (this.tachesAssociees || []).filter(t => this.userAclTaskIds.has(t.id));
    if (accessibleTasks.length === 0) return false;

    // Une tâche de type traitement/signature/validation encore IN_PROGRESS = droit d'écriture, pas lecture seule
    const hasActiveWritableTask = accessibleTasks.some(t => {
      const tt = (t.taskType || '').toLowerCase();
      const isWritableType = tt === 'traitement' || tt === 'signature' || tt === 'validation';
      return isWritableType && t.status === CorrespStatus.IN_PROGRESS;
    });

    if (hasActiveWritableTask) return false;

    // Si toutes les tâches accessibles sont lecture OU sont CLOSED => lecture seule
    return accessibleTasks.every(t => {
      const tt = (t.taskType || '').toLowerCase();
      return tt === 'lecture' || t.status === CorrespStatus.CLOSED;
    });
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

  private expandAllFilteredNodes(nodes: DepartementTreeFeignDTO[], expandedSet: Set<number>): void {
    for (const node of nodes) {
      if (node.id != null) {
        expandedSet.add(node.id);
      }
      if (node.children?.length) {
        this.expandAllFilteredNodes(node.children, expandedSet);
      }
    }
  }

  /** Active le mode saisie de commentaire pour une tâche */
  initiateTaskCompletion(taskId: number): void {
    this.taskCompletionState.set(taskId, { showComment: true, comment: '' });
  }

  /** Annule le mode commentaire et revient à l'état précédent */
  resetTaskCompletion(taskId: number): void {
    this.taskCompletionState.delete(taskId);
  }

  /** Vérifie si la tâche est en mode saisie de commentaire */
  isTaskInCompletionMode(taskId: number): boolean {
    return this.taskCompletionState.get(taskId)?.showComment === true;
  }

  /** Retourne le commentaire en cours de saisie */
  getTaskCompletionComment(taskId: number): string {
    return this.taskCompletionState.get(taskId)?.comment ?? '';
  }

  /** Met à jour le commentaire en cours de saisie */
  setTaskCompletionComment(taskId: number, value: string): void {
    const existing = this.taskCompletionState.get(taskId);
    if (existing) {
      existing.comment = value;
    }
  }

  /** Confirme la clôture de la tâche, avec ou sans commentaire */
  confirmTaskCompletion(correspId: number, taskId: number): void {
    const comment = this.getTaskCompletionComment(taskId).trim();

    if (comment.length > 0) {
      // Sauvegarder commentaireTraitement via PATCH puis changer le statut
      this.taskService.partialUpdate({ id: taskId, commentaireTraitement: comment } as any).subscribe({
        next: () => {
          this.resetTaskCompletion(taskId);
          this.changeTasksStatus(correspId, taskId, 'CLOSED');
        },
        error: () => {
          // En cas d'erreur de sauvegarde du commentaire, on clôture quand même
          this.resetTaskCompletion(taskId);
          this.changeTasksStatus(correspId, taskId, 'CLOSED');
        },
      });
    } else {
      this.resetTaskCompletion(taskId);
      this.changeTasksStatus(correspId, taskId, 'CLOSED');
    }
  }

  /** Active le mode saisie de commentaire pour ANNULER une tâche */
  initiateTaskCancellation(taskId: number): void {
    this.taskCancellationState.set(taskId, { showComment: true, comment: '' });
  }

  /** Annule le mode commentaire d'annulation */
  resetTaskCancellation(taskId: number): void {
    this.taskCancellationState.delete(taskId);
  }

  /** Vérifie si la tâche est en mode saisie commentaire d'annulation */
  isTaskInCancellationMode(taskId: number): boolean {
    return this.taskCancellationState.get(taskId)?.showComment === true;
  }

  /** Retourne le commentaire d'annulation en cours de saisie */
  getTaskCancellationComment(taskId: number): string {
    return this.taskCancellationState.get(taskId)?.comment ?? '';
  }

  /** Met à jour le commentaire d'annulation */
  setTaskCancellationComment(taskId: number, value: string): void {
    const existing = this.taskCancellationState.get(taskId);
    if (existing) {
      existing.comment = value;
    }
  }

  /** Confirme l'annulation de la tâche, avec ou sans commentaire */
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
}
