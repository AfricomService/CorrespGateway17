import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { HttpResponse } from '@angular/common/http';
import { EMPTY, Subject, of } from 'rxjs';
import { catchError, debounceTime, skip, switchMap, takeUntil } from 'rxjs/operators';

import { AccountService } from 'app/core/auth/account.service';
import { Account } from 'app/core/auth/account.model';
import { ITasks } from 'app/entities/correspManage/tasks/tasks.model';
import { CorrespStatus } from 'app/entities/enumerations/corresp-status.model';
import { ISocieteLight, PagedTasksResponse, TasksService } from 'app/entities/correspManage/tasks/service/tasks.service';
import { CorrespService, CorrespSummaryDTO } from 'app/entities/correspManage/corresp/service/corresp.service';
import { DepartementTreeFeignDTO } from 'app/entities/correspManage/corresp/update/DepartementTreeFeignDTO';

export interface TasksFilter {
  status: string; // DRAFT | IN_PROGRESS | DISPATCH | CLOSED | CANCELLED | ALL
  startDateFrom: string; // yyyy-MM-dd ou ''
  startDateTo: string; // yyyy-MM-dd ou ''
}

export interface FilterChip {
  key: 'status' | 'startDateFrom' | 'startDateTo';
  label: string;
}

@Component({
  selector: 'jhi-tasks-hierarchy',
  templateUrl: './tasks-hierarchy.component.html',
  styleUrls: ['./tasks-hierarchy.component.scss'],
})
export class TasksHierarchyComponent implements OnInit, OnDestroy {
  account: Account | null = null;
  tasks: ITasks[] = [];
  loading = false;
  isRefreshing = false;

  // sociétés de l'utilisateur connecté (chargées à l'ouverture de la page)
  mesSocietes: ISocieteLight[] = [];

  // ---- Modal "Département" ----
  societeModalOpen = false;
  selectedSociete: ISocieteLight | null = null;

  // ---- Organigramme de la société sélectionnée ----
  orgaTree: DepartementTreeFeignDTO[] = [];
  orgaTreeFiltered: DepartementTreeFeignDTO[] = [];
  loadingOrgaTree = false;
  orgaSearchQuery = '';
  orgaTreeOpen = false;
  selectedDept: DepartementTreeFeignDTO | null = null;
  expandedNodes: Set<number> = new Set();
  private levelPalette: string[] = ['#1e90ff', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6'];

  private destroy$ = new Subject<void>();
  private correspInfoByTaskId: Record<number, CorrespSummaryDTO> = {};

  // périmètre : true = mon département + sous-départements, false = mon département seulement
  includeChildren = true;

  // onglet courant
  tasksView: 'inProgress' | 'closed' | 'custom' = 'inProgress';

  // ---- Filtre avancé (panneau) ----
  filterPanelOpen = false;
  filterDateError = '';
  readonly statusOptions: { value: string; label: string }[] = [
    { value: 'ALL', label: 'Tous les statuts' },
    { value: 'DRAFT', label: 'Brouillon' },
    { value: 'IN_PROGRESS', label: 'En cours' },
    { value: 'DISPATCH', label: 'Dispatch' },
    { value: 'CLOSED', label: 'Terminée' },
    { value: 'CANCELLED', label: 'Annulée' },
  ];
  appliedFilter: TasksFilter = { status: 'IN_PROGRESS', startDateFrom: '', startDateTo: '' };
  filterForm: TasksFilter = { status: 'IN_PROGRESS', startDateFrom: '', startDateTo: '' };
  filterChips: FilterChip[] = [];

  // ---- Recherche ----
  searchTerm = '';
  isSearching = false;
  private searchMode = false;
  private searchResults: ITasks[] = [];
  private search$ = new Subject<string>();

  // pagination (serveur, ou locale en mode recherche)
  pageSize = 10;
  currentPage = 1;
  totalItems = 0;
  totalPages = 0;
  hasNext = false;
  hasPrevious = false;

  constructor(
    private accountService: AccountService,
    private router: Router,
    private route: ActivatedRoute,
    private tasksService: TasksService,
    private correspService: CorrespService
  ) {}

  ngOnInit(): void {
    // sociétés de l'utilisateur connecté
    this.loadMesSocietes();

    // 1er chargement : une fois le compte connu
    this.accountService
      .getAuthenticationState()
      .pipe(takeUntil(this.destroy$))
      .subscribe(account => {
        this.account = account;
        if (account) {
          this.applyFilterFromUrl(this.route.snapshot.queryParamMap);
        }
      });

    // changements d'URL suivants
    this.route.queryParamMap.pipe(skip(1), takeUntil(this.destroy$)).subscribe(params => {
      if (this.account) {
        this.applyFilterFromUrl(params);
      }
    });

    // pipeline de recherche (debounce + annulation de la requête précédente)
    this.search$
      .pipe(
        debounceTime(250),
        switchMap(query => {
          const userId = this.account && (this.account as any).id != null ? (this.account as any).id : null;
          const trimmed = (query || '').trim();
          if (userId == null) {
            return EMPTY;
          }
          if (!trimmed) {
            this.exitSearchMode();
            return EMPTY;
          }
          this.isSearching = true;
          this.loading = true;
          return this.tasksService
            .searchTasksByUserAcl(userId, trimmed, this.includeChildren)
            .pipe(catchError(() => of(new HttpResponse<ITasks[]>({ body: [] }))));
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((res: HttpResponse<ITasks[]>) => this.onSearchResults(res));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Nombre de filtres actifs (badge du bouton filtre) */
  get activeFilterCount(): number {
    const f = this.appliedFilter;
    return (this.tasksView === 'custom' ? 1 : 0) + (f.startDateFrom ? 1 : 0) + (f.startDateTo ? 1 : 0);
  }

  // ---------------------------------------------------------------- Data
  private loadTasksPage(onDone?: () => void): void {
    const userId = this.account && (this.account as any).id != null ? (this.account as any).id : null;
    if (userId == null) {
      this.tasks = [];
      onDone?.();
      return;
    }

    const f = this.appliedFilter;
    const statusStr = f.status === 'ALL' ? undefined : f.status;
    this.loading = true;

    this.tasksService
      .getTasksByUserAclPaged(
        userId,
        statusStr,
        this.currentPage,
        this.pageSize,
        f.startDateFrom || undefined,
        f.startDateTo || undefined,
        this.includeChildren
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (res: PagedTasksResponse) => {
          this.tasks = res.content ?? [];
          this.totalItems = res.totalItems ?? 0;
          this.totalPages = res.totalPages ?? 0;
          this.hasNext = !!res.hasNext;
          this.hasPrevious = !!res.hasPrevious;
          this.loading = false;
          this.loadCorrespInfoForTasks();
          onDone?.();
        },
        () => {
          this.tasks = [];
          this.totalItems = 0;
          this.totalPages = 0;
          this.loading = false;
          onDone?.();
        }
      );
  }

  refresh(): void {
    if (this.isRefreshing) return;
    if (this.searchTerm.trim()) {
      this.search$.next(this.searchTerm);
      return;
    }
    this.isRefreshing = true;
    this.loadTasksPage(() => (this.isRefreshing = false));
  }

  private loadMesSocietes(): void {
    this.tasksService
      .getMesSocietes()
      .pipe(takeUntil(this.destroy$))
      .subscribe((societes: ISocieteLight[]) => {
        this.mesSocietes = societes ?? [];
        // une seule société : elle est sélectionnée d'office (champ en lecture seule)
        this.selectedSociete = this.mesSocietes.length === 1 ? this.mesSocietes[0] : null;
      });
  }

  // ---------------------------------------------------------------- Modal Département
  openSocieteModal(): void {
    this.societeModalOpen = true;
    // une seule société (sélectionnée d'office) : on charge son organigramme si besoin
    if (this.selectedSociete && this.orgaTree.length === 0 && !this.loadingOrgaTree) {
      this.loadOrgaTree();
    }
  }

  @HostListener('document:keydown.escape')
  closeSocieteModal(): void {
    this.societeModalOpen = false;
  }

  selectSociete(s: ISocieteLight): void {
    if (this.selectedSociete?.id === s.id) return;
    this.selectedSociete = s;
    this.resetOrga();
    this.loadOrgaTree();
  }

  // ---------------------------------------------------------------- Organigramme
  private resetOrga(): void {
    this.orgaTree = [];
    this.orgaTreeFiltered = [];
    this.orgaSearchQuery = '';
    this.selectedDept = null;
    this.orgaTreeOpen = false;
    this.expandedNodes.clear();
  }

  private loadOrgaTree(): void {
    const orgaCode = this.selectedSociete?.codeOrganigramme;
    const userId = this.account && (this.account as any).id != null ? (this.account as any).id : null;
    if (!orgaCode || userId == null) {
      this.orgaTree = [];
      this.orgaTreeFiltered = [];
      return;
    }
    this.loadingOrgaTree = true;
    // seulement mon département + mes sous-départements
    this.tasksService
      .getMesDepartementsTree(userId, orgaCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe(tree => {
        this.orgaTree = tree ?? [];
        this.orgaTreeFiltered = this.orgaTree;
        // les racines (mes départements) sont dépliées d'office
        this.orgaTree.forEach(n => this.expandedNodes.add(n.id));
        this.loadingOrgaTree = false;
      });
  }

  toggleOrgaTree(): void {
    this.orgaTreeOpen = !this.orgaTreeOpen;
    if (this.orgaTreeOpen && this.orgaTree.length === 0 && !this.loadingOrgaTree) {
      this.loadOrgaTree();
    }
  }

  onOrgaSearchChange(): void {
    const q = (this.orgaSearchQuery || '').trim().toLowerCase();
    this.orgaTreeFiltered = q ? this.filterTree(this.orgaTree, q) : this.orgaTree;
  }

  private filterTree(nodes: DepartementTreeFeignDTO[], q: string): DepartementTreeFeignDTO[] {
    const result: DepartementTreeFeignDTO[] = [];
    for (const n of nodes) {
      const match = (n.nom || '').toLowerCase().includes(q);
      const children = this.filterTree(n.children || [], q);
      if (match || children.length > 0) {
        result.push({ ...n, children });
      }
    }
    return result;
  }

  toggleNodeExpand(nodeId: number): void {
    this.expandedNodes.has(nodeId) ? this.expandedNodes.delete(nodeId) : this.expandedNodes.add(nodeId);
  }

  isNodeExpanded(nodeId: number): boolean {
    return this.expandedNodes.has(nodeId);
  }

  getLevelColor(level: number): string {
    return this.levelPalette[level % this.levelPalette.length];
  }

  selectDept(node: DepartementTreeFeignDTO): void {
    this.selectedDept = node;
    this.orgaTreeOpen = false;
  }

  private loadCorrespInfoForTasks(): void {
    const ids = this.tasks.map(t => (t as any)?.id).filter((id): id is number => id != null);
    if (!ids.length) return;

    this.correspService
      .getCorrespSummariesByTasks(ids)
      .pipe(takeUntil(this.destroy$))
      .subscribe((summaries: Record<number, CorrespSummaryDTO>) => {
        Object.entries(summaries).forEach(([taskId, summary]) => {
          this.correspInfoByTaskId[+taskId] = summary;
        });
      });
  }

  // ---------------------------------------------------------------- Recherche
  onSearchInput(value: string): void {
    this.searchTerm = value || '';
    this.search$.next(this.searchTerm);
  }

  onSearchClick(value: string): void {
    this.searchTerm = value || '';
    this.search$.next(this.searchTerm);
  }

  clearSearch(input: HTMLInputElement): void {
    if (input) input.value = '';
    this.searchTerm = '';
    this.search$.next('');
  }

  private exitSearchMode(): void {
    this.searchMode = false;
    this.searchResults = [];
    this.isSearching = false;
    this.currentPage = 1;
    this.loadTasksPage();
  }

  /** Le endpoint de recherche renvoie toute la liste : on applique statut/dates ici, puis on pagine localement. */
  private onSearchResults(res: HttpResponse<ITasks[]>): void {
    const f = this.appliedFilter;
    const filtered = (res.body ?? []).filter(t => {
      const s = String((t as any)?.status || '').toUpperCase();
      if (f.status !== 'ALL' && s !== f.status) return false;
      if (f.startDateFrom || f.startDateTo) {
        const d = this.formatToDate((t as any).startDate);
        if (!d) return false;
        const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (f.startDateFrom && ymd < f.startDateFrom) return false;
        if (f.startDateTo && ymd > f.startDateTo) return false;
      }
      return true;
    });

    filtered.sort(
      (a, b) => (this.formatToDate((b as any).creationDate)?.getTime() ?? 0) - (this.formatToDate((a as any).creationDate)?.getTime() ?? 0)
    );

    this.searchResults = filtered;
    this.searchMode = true;
    this.currentPage = 1;
    this.applySearchPage();
    this.isSearching = false;
  }

  private applySearchPage(): void {
    this.totalItems = this.searchResults.length;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    this.hasPrevious = this.currentPage > 1;
    this.hasNext = this.currentPage < this.totalPages;
    const start = (this.currentPage - 1) * this.pageSize;
    this.tasks = this.searchResults.slice(start, start + this.pageSize);
    this.loading = false;
    this.loadCorrespInfoForTasks();
  }

  trackById(_index: number, t: ITasks): number {
    return (t as any).id;
  }

  // ---------------------------------------------------------------- Pagination
  get paginationTotalPages(): number {
    return this.totalPages || 1;
  }

  get pages(): (number | string)[] {
    const total = this.paginationTotalPages;
    const current = this.currentPage;
    const delta = 2;
    const range: (number | string)[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) range.push(i);
      return range;
    }
    range.push(1);
    if (current - delta > 2) range.push('...');
    const start = Math.max(2, current - delta);
    const end = Math.min(total - 1, current + delta);
    for (let i = start; i <= end; i++) range.push(i);
    if (current + delta < total - 1) range.push('...');
    range.push(total);
    return range;
  }

  get startItem(): number {
    return this.totalItems === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  get endItem(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }

  setPage(page: number): void {
    if (!page || page < 1) page = 1;
    if (page > this.paginationTotalPages) page = this.paginationTotalPages;
    if (page === this.currentPage) return;
    this.currentPage = page;
    if (this.searchMode) {
      this.applySearchPage();
    } else {
      this.loadTasksPage();
    }
  }

  nextPage(): void {
    if (this.hasNext) this.setPage(this.currentPage + 1);
  }

  prevPage(): void {
    if (this.hasPrevious) this.setPage(this.currentPage - 1);
  }

  // ---------------------------------------------------------------- Onglets / périmètre
  showInProgress(): void {
    if (this.appliedFilter.status !== 'IN_PROGRESS') {
      this.navigateWithFilter({ ...this.appliedFilter, status: 'IN_PROGRESS' });
    }
  }

  showClosed(): void {
    if (this.appliedFilter.status !== 'CLOSED') {
      this.navigateWithFilter({ ...this.appliedFilter, status: 'CLOSED' });
    }
  }

  setScope(withChildren: boolean): void {
    if (this.includeChildren === withChildren) return;
    this.navigateWithFilter({ ...this.appliedFilter }, withChildren);
  }

  // ---------------------------------------------------------------- Filtre avancé + URL
  toggleFilterPanel(): void {
    if (!this.filterPanelOpen) {
      this.filterForm = { ...this.appliedFilter };
      this.filterDateError = '';
    }
    this.filterPanelOpen = !this.filterPanelOpen;
  }

  closeFilterPanel(): void {
    this.filterPanelOpen = false;
  }

  resetFilterForm(): void {
    const tabStatus = this.tasksView === 'closed' ? 'CLOSED' : 'IN_PROGRESS';
    this.filterForm = { status: tabStatus, startDateFrom: '', startDateTo: '' };
    this.filterDateError = '';
    this.navigateWithFilter({ ...this.filterForm });
  }

  applyFilter(): void {
    const from = this.filterForm.startDateFrom || '';
    const to = this.filterForm.startDateTo || '';
    if (from && to && from > to) {
      this.filterDateError = 'La date de début doit être antérieure ou égale à la date de fin.';
      return;
    }
    this.closeFilterPanel();
    this.navigateWithFilter({ status: this.filterForm.status, startDateFrom: from, startDateTo: to });
  }

  removeFilterChip(key: FilterChip['key']): void {
    const f: TasksFilter = { ...this.appliedFilter };
    if (key === 'status') {
      f.status = 'IN_PROGRESS';
    } else if (key === 'startDateFrom') {
      f.startDateFrom = '';
    } else {
      f.startDateTo = '';
    }
    this.navigateWithFilter(f);
  }

  /** Écrit l'état dans l'URL ; la liste se recharge via queryParamMap. */
  private navigateWithFilter(f: TasksFilter, withChildren: boolean = this.includeChildren): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        status: f.status || 'IN_PROGRESS',
        startDateFrom: f.startDateFrom || null,
        startDateTo: f.startDateTo || null,
        children: withChildren ? null : 'false', // absent = avec sous-départements (défaut)
      },
      queryParamsHandling: 'merge',
    });
  }

  /** Lit l'URL, met à jour l'état puis recharge la liste. */
  private applyFilterFromUrl(params: ParamMap): void {
    const rawStatus = (params.get('status') || '').toUpperCase();
    const status = this.statusOptions.some(o => o.value === rawStatus) ? rawStatus : 'IN_PROGRESS';
    const isoDate = /^\d{4}-\d{2}-\d{2}$/;
    const from = params.get('startDateFrom') || '';
    const to = params.get('startDateTo') || '';

    this.appliedFilter = {
      status,
      startDateFrom: isoDate.test(from) ? from : '',
      startDateTo: isoDate.test(to) ? to : '',
    };
    this.filterForm = { ...this.appliedFilter };
    this.includeChildren = params.get('children') !== 'false';
    this.tasksView = status === 'IN_PROGRESS' ? 'inProgress' : status === 'CLOSED' ? 'closed' : 'custom';
    this.filterChips = this.buildFilterChips();
    this.currentPage = 1;
    if (this.searchTerm.trim()) {
      // le périmètre ou le filtre a changé : on relance la recherche
      this.search$.next(this.searchTerm);
    } else {
      this.loadTasksPage();
    }
  }

  private buildFilterChips(): FilterChip[] {
    const f = this.appliedFilter;
    const chips: FilterChip[] = [];
    if (this.tasksView === 'custom') {
      const label = this.statusOptions.find(o => o.value === f.status)?.label ?? f.status;
      chips.push({ key: 'status', label: `Statut : ${label}` });
    }
    if (f.startDateFrom) {
      chips.push({ key: 'startDateFrom', label: `Date début : ${this.formatIsoDate(f.startDateFrom)}` });
    }
    if (f.startDateTo) {
      chips.push({ key: 'startDateTo', label: `Date fin : ${this.formatIsoDate(f.startDateTo)}` });
    }
    return chips;
  }

  private formatIsoDate(iso: string): string {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }

  // ---------------------------------------------------------------- Navigation
  openTask(task: ITasks): void {
    if (!task || (task as any).id == null) return;
    const taskId = (task as any).id;
    this.correspService
      .getCorrespsByTask(taskId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: HttpResponse<any[]>) => {
        const items = res.body || [];
        const first = items.length ? items[0] : null;
        const correspId = first && (first as any).id;
        if (correspId != null) {
          this.router.navigate([`/corresp/${correspId}/view`], { queryParams: { taskId }, fragment: 'tasks' });
        } else {
          this.router.navigate([`/tasks/${taskId}/view`]);
        }
      });
  }

  // ---------------------------------------------------------------- Affichage
  getTaskSubject(t: ITasks): string {
    return this.correspInfoByTaskId[(t as any)?.id]?.subject || '';
  }

  getTaskReference(t: ITasks): string {
    return this.correspInfoByTaskId[(t as any)?.id]?.reference || '';
  }

  getTaskNomSociete(t: ITasks): string {
    return this.correspInfoByTaskId[(t as any)?.id]?.nomSociete || '';
  }

  /** Le backend renvoie déjà responsableName / responsables[] avec les noms résolus. */
  getResponsibleDisplay(t: ITasks): string {
    const anyT = t as any;
    if (anyT.responsableName) return anyT.responsableName;
    const rs: any[] = Array.isArray(anyT.responsables) ? anyT.responsables : [];
    const names = rs.map(r => r?.personneName || r?.deptName || r?.codeDept || r?.matriculePers || '').filter((s: string) => !!s);
    return Array.from(new Set(names)).join(', ');
  }

  formatToDate(value: any): Date | null {
    if (value == null) return null;
    if (typeof value.toDate === 'function') {
      try {
        return value.toDate();
      } catch {
        return null;
      }
    }
    if (value instanceof Date) return value;
    if (typeof value === 'string' || typeof value === 'number') {
      const d = new Date(value);
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  }

  getTaskTypeBg(type?: string | null): string {
    const k = (type || '').toString().toLowerCase();
    if (k === 'lecture') return '#e8f2ff';
    if (k === 'signature') return '#efe8ff';
    if (k === 'traitement') return '#fff0e6';
    if (k === 'validation') return '#e9f7ee';
    return '#ffffff';
  }

  getTaskStatusColor(status?: CorrespStatus | null): string {
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

  /** Urgente : échéance dans moins d'un jour (ou dépassée) et tâche non clôturée. */
  isTaskUrgent(t: ITasks): boolean {
    if (this.formatToDate((t as any).closeDate)) return false;
    const due = this.formatToDate((t as any).dueDate);
    if (!due) return false;
    return due.getTime() - Date.now() <= 24 * 60 * 60 * 1000;
  }

  getTaskBorderColor(t: ITasks): string {
    return this.isTaskUrgent(t) ? '#ef4444' : this.getTaskStatusColor(t.status);
  }

  getDeadlineMessage(t: ITasks): string | null {
    const due = this.formatToDate((t as any).dueDate);
    if (!due) return null;
    const diffMs = due.getTime() - Date.now();
    const duration = this.formatDuration(Math.abs(diffMs));
    return diffMs > 0 ? `Il reste ${duration} avant l'échéance` : `Échéance dépassée depuis ${duration}`;
  }

  private formatDuration(ms: number): string {
    const totalMinutes = Math.floor(ms / 60000);
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;
    if (days > 0) return hours > 0 ? `${days} j ${hours} h` : `${days} j`;
    if (hours > 0) return minutes > 0 ? `${hours} h ${minutes} min` : `${hours} h`;
    if (minutes > 0) return `${minutes} min`;
    return 'quelques instants';
  }
}
