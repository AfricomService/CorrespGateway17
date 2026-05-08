// src/main/webapp/app/home/home.component.ts
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, Subscription, forkJoin, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { takeUntil } from 'rxjs/operators';

import { Title } from '@angular/platform-browser';

import { AccountService } from 'app/core/auth/account.service';
import { Account } from 'app/core/auth/account.model';
import { Authority } from 'app/config/authority.constants';
import { ITasks } from '../entities/correspManage/tasks/tasks.model';
import { CorrespStatus } from 'app/entities/enumerations/corresp-status.model';
import { HttpResponse } from '@angular/common/http';
import { TasksService } from '../entities/correspManage/tasks/service/tasks.service';
import { CorrespService } from '../entities/correspManage/corresp/service/corresp.service';
import { IDepartement } from '../entities/orgacare/departement/departement.model';

import { TranslateService } from '@ngx-translate/core';
import { PagedTasksResponse } from '../entities/correspManage/tasks/service/tasks.service';

@Component({
  selector: 'jhi-home',
  templateUrl: './home.component.html',
  styleUrls: ['home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  account: Account | null = null;
  tasks?: ITasks[];
  authSubscription?: Subscription;
  private destroy$ = new Subject<void>();
  private correspInfoByTaskId: Record<number, { subject?: string | null; reference?: string | null }> = {};
  private deptNameByCode: Map<string, string> = new Map<string, string>();

  // vue courante: 'inProgress' | 'draft'
  tasksView: 'inProgress' | 'draft' = 'inProgress';

  // map taskId -> liste de noms (deptName ou personneName ou matricule/code)
  private taskResponsablesMap: Record<number, string[]> = {};

  // recherche simple côté client
  searchTerm = '';
  private search$ = new Subject<string>();
  isSearching = false;

  // pagination
  pageSize = 10;
  currentPage = 1;
  totalItemsFromServer = 0;
  totalPagesFromServer = 0;
  hasNextFromServer = false;
  hasPreviousFromServer = false;

  // petits réglages visuels/restants
  loadPanel = { enabled: true };
  sorting = { mode: 'none' };

  // ARRIVÉE : activé uniquement pour BOC ou ADMIN
  canCreateArrivee = false;

  isRefreshing = false;

  currentYear = new Date().getFullYear();

  constructor(
    private accountService: AccountService,
    private router: Router,
    private tasksService: TasksService,
    private correspService: CorrespService,
    private translate: TranslateService,
    private titleService: Title,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // On attend l'authenticationState puis on charge les tâches avec l'id utilisateur
    this.authSubscription = this.accountService
      .getAuthenticationState()
      .pipe(takeUntil(this.destroy$))
      .subscribe(account => {
        this.account = account;

        // Vérifier si l'utilisateur a le rôle BOC ou ADMIN pour activer le bouton ARRIVÉE
        this.canCreateArrivee =
          account != null &&
          account.authorities != null &&
          (account.authorities.includes(Authority.BOC) || account.authorities.includes(Authority.ADMIN));

        const name = account && account.firstName ? account.firstName : '';
        this.translate.get('home.title', { firstName: name }).subscribe(translatedTitle => {
          if (translatedTitle) {
            this.titleService.setTitle(translatedTitle);
          }
        });

        // <-- important : on charge les tâches une fois que l'account est connu
        this.loadTasks();
      });

    // NOTE: on ne lance plus loadTasks() ici (on l'appelle après que account soit défini)

    // pipeline de recherche distante (debounce + switchMap)
    this.search$
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(250),
        distinctUntilChanged(),
        switchMap(query => {
          const userId = this.account && (this.account as any).id != null ? (this.account as any).id : null;
          const trimmed = (query || '').trim();
          if (!userId) {
            return of(new HttpResponse<ITasks[]>({ body: [] }));
          }
          if (!trimmed) {
            // pas de recherche → recharger statut courant
            if (this.tasksView === 'inProgress') {
              return this.tasksService.getTasksByUserAcl(userId, CorrespStatus.IN_PROGRESS as any);
            } else {
              return this.tasksService.getTasksByUserAcl(userId, CorrespStatus.CLOSED as any);
            }
          }
          this.isSearching = true;
          return this.tasksService.searchTasksByUserAcl(userId, trimmed).pipe(
            catchError(err => {
              // eslint-disable-next-line no-console
              console.warn('Erreur recherche des tâches (ACL)', err);
              return of(new HttpResponse<ITasks[]>({ body: [] }));
            })
          );
        })
      )
      .subscribe((res: HttpResponse<ITasks[]>) => {
        this.currentPage = 1;
        const predicate = (t: ITasks) => {
          const s = String((t as any)?.status || '').toUpperCase();
          return this.tasksView === 'inProgress' ? s === 'IN_PROGRESS' : s === 'CLOSED';
        };
        this.processTasksResponse(res, predicate);
        this.isSearching = false;
        try {
          this.cdr.markForCheck();
          this.cdr.detectChanges();
        } catch {
          // noop
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.authSubscription) {
      try {
        this.authSubscription.unsubscribe();
      } catch {
        // noop
      }
    }
  }

  // --------- Data ----------
  loadTasks(): void {
    // comportement par défaut : charger les tâches IN_PROGRESS
    this.tasksView = 'inProgress';
    this.loadTasksByStatus(CorrespStatus.IN_PROGRESS);
  }

  /**
   * Charge les tâches pour l'utilisateur courant en fonction du status demandé.
   * Si account.id est absent on appelle le fallback getAllTasksByEtat.
   */
  private loadTasksByStatus(status: CorrespStatus): void {
    const userId = this.account && (this.account as any).id != null ? (this.account as any).id : null;

    if (userId != null) {
      const statusStr = status === CorrespStatus.IN_PROGRESS ? 'IN_PROGRESS' : 'CLOSED';
      this.tasksService
        .getTasksByUserAclPaged(userId, statusStr, this.currentPage, this.pageSize)
        .pipe(takeUntil(this.destroy$))
        .subscribe(
          (res: PagedTasksResponse) => {
            this.totalItemsFromServer = res.totalItems;
            this.totalPagesFromServer = res.totalPages;
            this.hasNextFromServer = res.hasNext;
            this.hasPreviousFromServer = res.hasPrevious;
            this.processTasksResponse(new HttpResponse<ITasks[]>({ body: res.content }));
          },
          err => {
            console.warn(`Erreur chargement tâches ACL paginées (status=${status})`, err);
            this.tasks = [];
          }
        );
    } else {
      // fallback sans userId
      this.tasksService
        .getAllTasksByEtat({ etat: status })
        .pipe(takeUntil(this.destroy$))
        .subscribe(
          (res: HttpResponse<ITasks[]>) => this.processTasksResponse(res),
          err => {
            console.warn('Erreur fallback getAllTasksByEtat', err);
            this.tasks = [];
          }
        );
    }
  }

  private processTasksResponse(res: HttpResponse<ITasks[]>, predicate?: (t: ITasks) => boolean): void {
    const raw = res.body || [];
    // convertit les champs de date (Dayjs, string, Date, ...) en Date natif ou undefined
    let mapped = raw.map(t => {
      const copy: any = { ...t };
      const dateFields = ['creationDate', 'startDate', 'dueDate', 'closeDate', 'updatedDate'];
      dateFields.forEach(f => {
        const v = (copy as any)[f];
        if (v == null) {
          (copy as any)[f] = undefined;
          return;
        }
        if (typeof (v as any).toDate === 'function') {
          try {
            (copy as any)[f] = (v as any).toDate();
          } catch {
            (copy as any)[f] = undefined;
          }
        } else if (typeof v === 'string' || typeof v === 'number') {
          const d = new Date(v);
          (copy as any)[f] = isNaN(d.getTime()) ? undefined : d;
        } else if (v instanceof Date) {
          (copy as any)[f] = v;
        } else {
          (copy as any)[f] = undefined;
        }
      });
      return copy as ITasks;
    });
    if (typeof predicate === 'function') {
      mapped = mapped.filter(predicate);
    }
    this.tasks = mapped;
    // forcer l'actualisation immédiate de la vue
    try {
      this.cdr.detectChanges();
    } catch {
      // noop
    }

    // charge infos supplémentaires (corresp) et résout les noms de départements/personnes
    this.loadCorrespInfoForTasks();
    // resolveDeptNamesForTasks s'occupera aussi d'appeler buildResponsablesForTasks
    this.resolveDeptNamesForTasks();

    // ensure currentPage still valid after load
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages || 1;
    }
  }

  refresh(): void {
    if (this.isRefreshing) return;
    this.isRefreshing = true;
    const status = this.tasksView === 'inProgress' ? CorrespStatus.IN_PROGRESS : CorrespStatus.CLOSED;
    const userId = this.account && (this.account as any).id != null ? (this.account as any).id : null;

    if (userId != null) {
      const statusStr = status === CorrespStatus.IN_PROGRESS ? 'IN_PROGRESS' : 'CLOSED';
      this.tasksService
        .getTasksByUserAclPaged(userId, statusStr, this.currentPage, this.pageSize)
        .pipe(takeUntil(this.destroy$))
        .subscribe(
          (res: PagedTasksResponse) => {
            this.totalItemsFromServer = res.totalItems;
            this.totalPagesFromServer = res.totalPages;
            this.hasNextFromServer = res.hasNext;
            this.hasPreviousFromServer = res.hasPrevious;
            this.processTasksResponse(new HttpResponse<ITasks[]>({ body: res.content }));
            this.isRefreshing = false;
            try {
              this.cdr.detectChanges();
            } catch {
              /* noop */
            }
          },
          err => {
            console.warn('Erreur refresh tâches', err);
            this.isRefreshing = false;
          }
        );
    } else {
      this.tasksService
        .getAllTasksByEtat({ etat: status })
        .pipe(takeUntil(this.destroy$))
        .subscribe(
          (res: HttpResponse<ITasks[]>) => {
            this.processTasksResponse(res);
            this.isRefreshing = false;
          },
          err => {
            console.warn('Erreur refresh fallback', err);
            this.isRefreshing = false;
          }
        );
    }
  }

  get tasksCount(): number {
    return this.tasks ? this.tasks.length : 0;
  }

  // --- Filtering (ancien displayedTasks) : retourne la liste complète filtrée (non paginée)
  get displayedTasks(): ITasks[] {
    if (!this.tasks) {
      return [];
    }
    const q = (this.searchTerm || '').trim().toLowerCase();
    if (!q) {
      return this.tasks;
    }
    return this.tasks.filter(t => {
      const subj = (this.getTaskSubject(t) || '').toString().toLowerCase();
      const ref = (this.getTaskReference(t) || '').toString().toLowerCase();
      const resp = (this.getResponsibleDisplay(t) || '').toString().toLowerCase();
      const status = String((t as any).status || '').toLowerCase();
      return subj.includes(q) || ref.includes(q) || resp.includes(q) || status.includes(q);
    });
  }

  // --- Pagination helpers
  // Pagination — utilise les données serveur
  get totalTasks(): number {
    return this.totalItemsFromServer;
  }

  get totalPages(): number {
    return this.totalPagesFromServer || 1;
  }

  get paginatedTasks(): ITasks[] {
    // les données sont déjà paginées côté serveur
    return this.tasks ?? [];
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get startItem(): number {
    if (this.totalTasks === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endItem(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalTasks);
  }

  setPage(page: number): void {
    if (!page || page < 1) page = 1;
    if (page > this.totalPages) page = this.totalPages;
    if (page === this.currentPage) return;
    this.currentPage = page;
    this.loadTasksByStatus(this.tasksView === 'inProgress' ? CorrespStatus.IN_PROGRESS : CorrespStatus.CLOSED);
  }

  nextPage(): void {
    if (this.hasNextFromServer) this.setPage(this.currentPage + 1);
  }

  prevPage(): void {
    if (this.hasPreviousFromServer) this.setPage(this.currentPage - 1);
  }

  // --------- Navigation / interactions ----------
  // === Société modal state ===
  societeModalOpen = false;
  societeModalType = '';
  societeModalList: { id: number; raisonSociale: string; codeSociete?: string | null }[] = [];
  societeModalSelected: { id: number; raisonSociale: string; codeSociete?: string | null } | null = null;
  societeModalLoading = false;

  onTypeClicked(type: string): void {
    if (type === 'Sortant') {
      this.router.navigate(['/corresp/new-out']);
      return;
    }
    // Charger les sociétés de l'utilisateur
    this.societeModalLoading = true;
    this.societeModalSelected = null;
    this.societeModalType = type;
    this.correspService.getMySocietes().subscribe({
      next: societes => {
        this.societeModalLoading = false;
        if (societes.length === 0 || societes.length === 1) {
          // 0 ou 1 société → naviguer directement
          const queryParams: any = { type };
          if (societes.length === 1) {
            queryParams['societeId'] = societes[0].id;
            queryParams['societeCode'] = societes[0].codeSociete ?? '';
          }
          this.router.navigate(['/corresp/new'], { queryParams });
        } else {
          // Plusieurs sociétés → ouvrir le modal
          this.societeModalList = societes;
          this.societeModalOpen = true;
        }
      },
      error: () => {
        this.societeModalLoading = false;
        this.router.navigate(['/corresp/new'], { queryParams: { type } });
      },
    });
  }

  closeSocieteModal(): void {
    this.societeModalOpen = false;
    this.societeModalList = [];
    this.societeModalSelected = null;
  }

  confirmSocieteSelection(): void {
    if (!this.societeModalSelected) return;
    this.router.navigate(['/corresp/new'], {
      queryParams: {
        type: this.societeModalType,
        societeId: this.societeModalSelected.id,
        societeCode: this.societeModalSelected.codeSociete ?? '',
      },
    });
    this.closeSocieteModal();
  }

  // --- Tabs / boutons ---
  showInProgress(): void {
    if (this.tasksView !== 'inProgress') {
      this.tasksView = 'inProgress';
      this.currentPage = 1;
      this.loadTasksByStatus(CorrespStatus.IN_PROGRESS);
    }
  }

  showDraft(): void {
    if (this.tasksView !== 'draft') {
      this.tasksView = 'draft';
      this.currentPage = 1;
      this.loadTasksByStatus(CorrespStatus.CLOSED);
    }
  }

  openTask(task: ITasks): void {
    // autoriser l'ouverture des drafts aussi (on enlève le blocage précédent)
    if (!task || (task as any).id == null) return;
    const taskId = (task as any).id;
    this.correspService
      .getCorrespsByTask(taskId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: HttpResponse<any[]>) => {
        const items = res.body || [];
        const first = items && items.length ? items[0] : null;
        const correspId = first && (first as any).id;
        if (correspId != null) {
          this.router.navigate([`/corresp/${correspId}/view`], { queryParams: { taskId }, fragment: 'tasks' });
        } else {
          this.router.navigate([`/tasks/${taskId}/view`]);
        }
      });
  }

  // handlers recherche — utilisent l'API server-side searchTasksByUserAcl
  onTasksSearchInput(value: string): void {
    this.searchTerm = value || '';
    this.currentPage = 1;
    this.search$.next(this.searchTerm);
  }
  onTasksSearchClick(value: string): void {
    this.searchTerm = value || '';
    this.currentPage = 1;
    this.search$.next(this.searchTerm);
  }
  clearTasksSearch(input: HTMLInputElement): void {
    if (input) {
      input.value = '';
    }
    this.searchTerm = '';
    this.currentPage = 1;
    this.search$.next('');
    try {
      this.cdr.detectChanges();
    } catch {
      // noop
    }
  }

  // --------- Export helpers ----------
  exportTasksToExcel(): void {
    const userId = this.account && (this.account as any).id != null ? (this.account as any).id : null;
    if (!userId) {
      // eslint-disable-next-line no-console
      console.warn('Utilisateur non identifié, export impossible.');
      return;
    }
    const status = this.tasksView === 'inProgress' ? 'IN_PROGRESS' : 'CLOSED';
    this.tasksService.downloadTasksExcelByUserAcl(userId, status).subscribe({
      next: (resp: HttpResponse<Blob>) => {
        const blob = resp.body || new Blob([], { type: 'application/octet-stream' });
        // Essayer de récupérer le nom de fichier depuis Content-Disposition
        const cd = resp.headers?.get('Content-Disposition') || resp.headers?.get('content-disposition') || '';
        let fileName = `tasks_${status.toLowerCase()}_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.xlsx`;
        const match = /filename=\"?([^\";]+)\"?/i.exec(cd);
        if (match && match[1]) {
          fileName = match[1];
        }
        this.downloadBlobFromFile(blob, fileName);
      },
      error: err => {
        // eslint-disable-next-line no-console
        console.warn('Erreur export Excel via API', err);
        try {
          alert('Export Excel indisponible. Veuillez réessayer plus tard.');
        } catch {
          // noop
        }
      },
    });
  }

  exportTasksToCsv(): void {
    if (!this.tasks || this.tasks.length === 0) {
      // eslint-disable-next-line no-console
      console.warn('Aucune tâche à exporter.');
      return;
    }
    const rows = this.tasks;
    const headers = this.guessHeadersFromArray(rows);
    const csvContent = this.buildCsvFromRows(rows, headers);
    const fileName = `tasks_export_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`;
    this.downloadBlob(csvContent, fileName, 'text/csv;charset=utf-8;');
  }

  // ---------- helpers ----------
  private guessHeadersFromArray(arr: any[]): string[] {
    if (!arr || arr.length === 0) {
      return [];
    }
    const keys = new Set<string>();
    arr.forEach(item => {
      Object.keys(item || {}).forEach(k => keys.add(k));
    });
    return Array.from(keys);
  }

  private buildCsvFromRows(rows: any[], headers: string[]): string {
    const escapeCell = (v: any) => {
      if (v === null || v === undefined) return '';
      if (v instanceof Date) return v.toISOString();
      const s = typeof v === 'object' ? JSON.stringify(v) : `${v}`;
      if (s.includes('"')) return `"${s.replace(/"/g, '""')}"`;
      if (s.includes(',') || s.includes('\n') || s.includes('\r')) return `"${s}"`;
      return s;
    };

    const lines: string[] = [];
    lines.push(headers.join(','));
    for (const r of rows) {
      const cells = headers.map(h => escapeCell((r as any)[h]));
      lines.push(cells.join(','));
    }
    return lines.join('\r\n');
  }

  private downloadBlob(content: string | Blob, fileName = 'export.csv', mimeType = 'text/csv;charset=utf-8;'): void {
    let blob: Blob;
    if (typeof content === 'string') {
      blob = new Blob([content], { type: mimeType });
    } else {
      blob = content;
    }

    if ((navigator as any).msSaveBlob) {
      (navigator as any).msSaveBlob(blob, fileName);
    } else {
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }

  private downloadBlobFromFile(blob: Blob, fileName: string): void {
    if ((navigator as any).msSaveBlob) {
      (navigator as any).msSaveBlob(blob, fileName);
    } else {
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }

  // util pour classes status en CSS
  getStatusClass(raw: any): string {
    const s = String(raw || '')
      .toString()
      .trim()
      .toLowerCase();
    if (s === 'desactivated' || s === 'desactivé' || s === 'desactive' || s === 'disabled') {
      return 'status-desactivated';
    } else if (s === 'actif' || s === 'active') {
      return 'status-actif';
    } else if (s === 'delated' || s === 'deleted' || s === 'supprimé') {
      return 'status-delated';
    }
    return '';
  }

  getTaskTypeBg(type?: string | null): string {
    const k = (type || '').toString().toLowerCase();
    if (k === 'lecture') return '#e8f2ff';
    if (k === 'signature') return '#efe8ff';
    if (k === 'traitement') return '#fff0e6';
    if (k === 'validation') return '#e9f7ee';
    return '#ffffff';
  }

  getTaskTypeAccent(type?: string | null): string {
    const k = (type || '').toString().toLowerCase();
    if (k === 'lecture') return '#1e7bff';
    if (k === 'signature') return '#6d28d9';
    if (k === 'traitement') return '#f97316';
    if (k === 'validation') return '#16a34a';
    return '#6c757d';
  }

  getTaskStatusColor(status?: CorrespStatus | null): string {
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

  // ---------- Recherche distante ----------

  formatToDate(value: any): Date | null {
    if (value == null) {
      return null;
    }
    if (typeof (value as any).toDate === 'function') {
      try {
        return (value as any).toDate();
      } catch {
        return null;
      }
    }
    if (value instanceof Date) {
      return value;
    }
    if (typeof value === 'string' || typeof value === 'number') {
      const d = new Date(value);
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  }

  private loadCorrespInfoForTasks(): void {
    const tasks = this.tasks || [];
    const ids = tasks.map(t => (t as any)?.id).filter((id): id is number => id != null);

    if (!ids.length) return;

    this.correspService
      .getCorrespSummariesByTasks(ids)
      .pipe(takeUntil(this.destroy$))
      .subscribe((summaries: Record<number, { subject?: string | null; reference?: string | null }>) => {
        Object.entries(summaries).forEach(([taskId, summary]) => {
          this.correspInfoByTaskId[+taskId] = summary;
        });
      });
  }

  getTaskSubject(t: ITasks): string {
    const id = (t as any)?.id;
    const info = typeof id === 'number' ? this.correspInfoByTaskId[id] : undefined;
    return (info && info.subject) || '';
  }

  getTaskReference(t: ITasks): string {
    const id = (t as any)?.id;
    const info = typeof id === 'number' ? this.correspInfoByTaskId[id] : undefined;
    return (info && info.reference) || '';
  }

  getResponsibleDisplay(t: ITasks): string {
    const id = (t as any)?.id;
    if (typeof id === 'number') {
      const arr = this.taskResponsablesMap[id];
      if (arr && arr.length) {
        return arr.join(', ');
      }
    }

    // fallback (ancien comportement)
    const code = ((t as any).responsible || '').toString();
    if (!code) return '';
    return this.deptNameByCode.get(code) || code;
  }

  private resolveDeptNamesForTasks(): void {
    const tasks = this.tasks || [];

    // 1) collecter tous les codes de departements à résoudre (depuis responsible OU responsables[].codeDept)
    const codesFromResponsible = tasks.map(t => ((t as any).responsible || '').toString()).filter(c => !!c);

    const codesFromResponsables = ([] as string[]).concat(
      ...tasks.map(t => {
        const rs = (t as any).responsables;
        if (!rs || !Array.isArray(rs)) return [];
        return rs.map((r: any) => (r && r.codeDept ? (r.codeDept || '').toString() : '')).filter((c: string) => !!c);
      })
    );

    const codes = Array.from(new Set([...codesFromResponsible, ...codesFromResponsables])).filter(c => !!c);

    // 2) garder seulement les codes manquants dans le cache deptNameByCode
    const missing = codes.filter(c => !this.deptNameByCode.has(c));
    if (!missing.length) {
      // pas d'appel réseau nécessaire — on peut construire directement les listes de responsables
      this.buildResponsablesForTasks();
      return;
    }

    // créer les appels HTTP (forkJoin)
    const calls = missing.map(code => this.correspService.queryOrgaDepsByCode({ code }));
    forkJoin(calls)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (responses: HttpResponse<IDepartement>[]) => {
          responses.forEach((res, idx) => {
            const dep = res.body as unknown as IDepartement | undefined;
            const code = missing[idx];
            const name =
              (dep && ((dep as any).nom || (dep as any).name || (dep as any).libelle || (dep as any).description || (dep as any).code)) ||
              code;
            this.deptNameByCode.set(code, name || code);
          });
        },
        error: err => {
          // si erreur réseau, on log et on continue — on affichera les codes/matricules bruts
          // eslint-disable-next-line no-console
          console.warn('Erreur lors de la résolution des noms de départements', err);
        },
        complete: () => {
          // une fois les resolvings faits (ou non), construire les responsables affichables
          this.buildResponsablesForTasks();
        },
      });
  }

  private buildResponsablesForTasks(): void {
    this.taskResponsablesMap = {};
    const tasks = this.tasks || [];

    tasks.forEach(task => {
      const taskId = (task as any)?.id;
      if (typeof taskId !== 'number') return;

      const displays: string[] = [];

      const responsables = (task as any).responsables;
      if (Array.isArray(responsables) && responsables.length > 0) {
        // priorité : personneName -> deptName -> resolved codeDept name -> matricule -> raw code
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
            displays.push((resolved && resolved.toString()) || code);
          } else if (matricule && matricule.toString().trim()) {
            displays.push(matricule.toString().trim());
          }
        });
      } else {
        // fallback: utilser le champ 'responsible' (ancien comportement)
        const code = ((task as any).responsible || '').toString();
        if (code) {
          const name = this.deptNameByCode.get(code);
          displays.push((name && name.toString()) || code);
        }
      }

      // dédoublonner tout en gardant l'ordre
      const uniq = Array.from(new Set(displays.map(d => (d == null ? '' : d.toString()).trim()))).filter(s => !!s);
      this.taskResponsablesMap[taskId] = uniq;
    });
  }
}
