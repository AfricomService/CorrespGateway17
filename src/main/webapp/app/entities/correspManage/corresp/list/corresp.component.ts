import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Data, ParamMap, Router } from '@angular/router';
import { combineLatest, filter, firstValueFrom, Observable, switchMap, tap } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import moment from 'moment';

import { ICorresp } from '../corresp.model';

import { ITEMS_PER_PAGE, PAGE_HEADER, TOTAL_COUNT_RESPONSE_HEADER } from 'app/config/pagination.constants';
import { ASC, DESC, SORT, ITEM_DELETED_EVENT, DEFAULT_SORT_DATA } from 'app/config/navigation.constants';
import { EntityArrayResponseType, CorrespService } from '../service/corresp.service';
import { CorrespDeleteDialogComponent } from '../delete/corresp-delete-dialog.component';
import { DataUtils } from 'app/core/util/data-util.service';
import { DxDataGridComponent } from 'devextreme-angular';
import CustomStore from 'devextreme/data/custom_store';
import { CorrespType } from '../../../enumerations/corresp-type.model';
import { CustomSearchService } from '../../custom-search/service/custom-search.service';
import { CustomSearchView } from '../../custom-search/custom-search-view';
import { AccountService } from 'app/core/auth/account.service';
import { Authority } from 'app/config/authority.constants';
import { Account } from 'app/core/auth/account.model';

interface Filter {
  field: string;
  label: string;
  value: any;
  displayValue: string;
}

@Component({
  selector: 'jhi-corresp',
  templateUrl: './corresp.component.html',
  styleUrls: ['corresp.component.scss'],
})
export class CorrespComponent implements OnInit {
  corresps?: ICorresp[];
  isLoading = false;

  predicate = 'id';
  ascending = true;

  itemsPerPage = ITEMS_PER_PAGE;
  totalItems = 0;
  page = 1;
  selectedItemsAcc: string[] = [];

  selection = { deferred: false, mode: 'single' };
  loadPanel = { enabled: true };
  sorting = { mode: 'none' };

  datasource: any = {};

  selectedFilter: string | null = null;
  filterValue: any = null;
  dateRange: { startDate: string | null; endDate: string | null } = { startDate: null, endDate: null };

  activeFilters: Filter[] = [];

  endpoint!: string;
  presentFilter = false;
  filterApplied = false;

  isAdmin = false;
  isBoc = false;
  currentUserId: number | null = null;

  isSaving = false;
  nameFilter = '';

  loadedFiltres: CustomSearchView[] = [];
  selectedSearch: CustomSearchView | null = null;

  // ── Options ────────────────────────────────────────────────────
  statusOptions = [
    { value: 'DRAFT', label: 'Brouillon' },
    { value: 'IN_PROGRESS', label: 'En cours' },
    { value: 'DISPATCH', label: 'Dispatché' },
    { value: 'CLOSED', label: 'Clôturé' },
    { value: 'CANCELLED', label: 'Annulé' },
  ];

  dispatchOptions = [
    { value: 'LETTER', label: 'Lettre' },
    { value: 'REGISTERED_LETTER', label: 'Lettre Recommandée' },
    { value: 'EMAIL', label: 'Email' },
    { value: 'FAX', label: 'Fax' },
  ];

  allFilters = [
    { value: 'reference', label: 'Référence' },
    { value: 'status', label: 'Statut' },
    { value: 'dispatchType', label: "Type d'envoi" },
    { value: 'courrierDate', label: 'Date courrier' },
  ];

  FILTER_LABELS_FR: { [key: string]: string } = {
    reference: 'Référence',
    dispatchType: "Type d'envoi",
    status: 'Statut',
    startDate: 'Date de début',
    endDate: 'Date de fin',
  };

  quickSearch = '';
  isSearching = false;
  isOpen = true;

  // ── Dynamic filter list ────────────────────────────────────────
  get availableFilters() {
    const used = this.activeFilters.map(f => f.field);
    return this.allFilters.filter(f => !used.includes(f.value));
  }

  public resourceUrl = SERVER_API_URL + 'services/correspmanage/api/corresps';

  @ViewChild(DxDataGridComponent, { static: false }) dataGrid!: DxDataGridComponent;

  constructor(
    protected correspService: CorrespService,
    protected activatedRoute: ActivatedRoute,
    public router: Router,
    protected dataUtils: DataUtils,
    protected modalService: NgbModal,
    protected http: HttpClient,
    protected customSearchService: CustomSearchService,
    protected accountService: AccountService
  ) {}

  // ── Lifecycle ──────────────────────────────────────────────────
  ngOnInit(): void {
    this.selectedItemsAcc = ['Information Generales', 'Tasks'];
    this.customSearchService.getByUserLogin().subscribe(res => (this.loadedFiltres = res));

    this.accountService.identity().subscribe((account: Account | null) => {
      if (account) {
        this.isAdmin = this.accountService.hasAnyAuthority(Authority.ADMIN);
        this.isBoc = this.accountService.hasAnyAuthority(Authority.BOC);
        this.currentUserId = (account as any).id ?? null;
      }
      this.load();
    });
  }

  // ── Helpers ────────────────────────────────────────────────────
  trackId = (_index: number, item: ICorresp): number => this.correspService.getCorrespIdentifier(item);

  byteSize(base64String: string): string {
    return this.dataUtils.byteSize(base64String);
  }
  openFile(base64String: string, contentType: string | null | undefined): void {
    return this.dataUtils.openFile(base64String, contentType);
  }

  getCorrespTypeLabel(type: string): string {
    const map: Record<string, string> = {
      INCOMING: 'Arrivée',
      OUTGOING: 'Départ',
      INTERNAL: 'Interne',
    };
    return map[type] ?? type;
  }

  getFilterEntries(filters: { [key: string]: string }) {
    return Object.entries(filters).map(([key, value]) => ({
      key: this.FILTER_LABELS_FR[key] || key,
      value,
    }));
  }

  formatFilters(filters: { [key: string]: string }): string {
    return Object.entries(filters)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');
  }

  // ── Row preparation ────────────────────────────────────────────
  onRowPrepared(e: any): void {
    if (e.rowType !== 'data') return;
    switch (e.data.corresptype) {
      case CorrespType.INCOMING:
        e.rowElement.classList.add('row-incoming');
        break;
      case CorrespType.OUTGOING:
        e.rowElement.classList.add('row-outgoing');
        break;
      case CorrespType.INTERNAL:
        e.rowElement.classList.add('row-internal');
        break;
    }
  }

  // ── Navigation ─────────────────────────────────────────────────
  onRowDoubleClick(e: any): void {
    window.open(`/corresp/${e.data.id}/view`, '_blank');
  }

  togglePanel(): void {
    this.isOpen = !this.isOpen;
  }

  // ── Data sources ───────────────────────────────────────────────
  load(): void {
    if (this.isAdmin || this.isBoc) {
      this.datasource = this.createDataSource();
    } else if (this.currentUserId != null) {
      this.datasource = this.createDataSourceByUserAcl(this.currentUserId);
    }
  }

  createDataSource(filters?: Filter[]): CustomStore {
    return new CustomStore({
      key: 'id',
      load: async (loadOptions: any) => {
        const skip = loadOptions.skip ?? 0;
        const take = loadOptions.take ?? 15;
        const pageIndex = Math.floor(skip / take) + 1;

        const params: any = {};
        if (filters?.length) {
          filters.forEach(f => {
            switch (f.field) {
              case 'reference':
                params.reference = f.value;
                break;
              case 'status':
                params.status = f.value;
                break;
              case 'dispatchType':
                params.dispatchType = f.value;
                break;
              case 'courrierDate':
                params.startDate = f.value.startDate;
                params.endDate = f.value.endDate;
                break;
            }
          });
        }

        const response = await firstValueFrom(
          this.correspService.getCorrespList(this.currentUserId!, pageIndex, take, this.quickSearch.trim(), params)
        );
        return { data: response.content, totalCount: response.totalItems };
      },
    });
  }

  createDataSourceByUserAcl(userId: number): CustomStore {
    return new CustomStore({
      key: 'id',
      load: async (loadOptions: any) => {
        const skip = loadOptions.skip ?? 0;
        const take = loadOptions.take ?? 15;
        const pageIndex = Math.floor(skip / take) + 1;

        const response = await firstValueFrom(this.correspService.getCorrespListByAcl(userId, pageIndex, take, this.quickSearch.trim()));
        return { data: response.content, totalCount: response.totalItems };
      },
    });
  }

  // ── Filters ────────────────────────────────────────────────────
  resetFilterValue(): void {
    this.filterValue = null;
    this.dateRange = { startDate: null, endDate: null };
  }

  addFilter(): void {
    if (!this.selectedFilter) return;

    let value: any = null;
    let displayValue = '';
    let label = '';

    switch (this.selectedFilter) {
      case 'reference':
        value = this.filterValue;
        displayValue = value;
        label = 'Référence';
        break;
      case 'status':
        value = this.filterValue;
        displayValue = this.statusOptions.find(s => s.value === value)?.label ?? value;
        label = 'Statut';
        break;
      case 'dispatchType':
        value = this.filterValue;
        displayValue = this.dispatchOptions.find(d => d.value === value)?.label ?? value;
        label = "Type d'envoi";
        break;
      case 'courrierDate':
        value = { ...this.dateRange };
        displayValue = `${value.startDate} → ${value.endDate}`;
        label = 'Date courrier';
        break;
    }

    if (value) {
      this.activeFilters.push({ field: this.selectedFilter, label, value, displayValue });
      this.resetFilterValue();
      this.selectedFilter = null;
    }
  }

  removeFilter(index: number): void {
    this.activeFilters.splice(index, 1);
    this._reloadWithFilters();
    this.isSaving = false;
    this.filterApplied = this.activeFilters.length > 0;
  }

  applyFilters(): void {
    this._reloadWithFilters();
    this.isSaving = false;
    this.filterApplied = this.activeFilters.length > 0;
    this.loadedFiltres.forEach(f => (f.active = false));
  }

  private _reloadWithFilters(): void {
    if (this.isAdmin || this.isBoc) {
      this.datasource = this.createDataSource(this.activeFilters);
    } else if (this.currentUserId != null) {
      this.datasource = this.createDataSourceByUserAcl(this.currentUserId);
    }
  }

  // ── Saved filters ──────────────────────────────────────────────
  selectOnlyThisFilter(selected: CustomSearchView): void {
    this.loadedFiltres.forEach(f => {
      if (f === selected) {
        f.active = !f.active;
        if (f.active) {
          const filtersArr: Filter[] = Object.keys(selected.filters).map(key => ({
            field: key,
            label: key,
            value: selected.filters[key],
            displayValue: '',
          }));
          this._applyCustomFilters(filtersArr);
        } else {
          this._reloadWithFilters();
        }
      } else {
        f.active = false;
      }
    });
  }

  private _applyCustomFilters(filters: Filter[]): void {
    if (this.isAdmin || this.isBoc) {
      this.datasource = this.createDataSource(filters);
    } else if (this.currentUserId != null) {
      this.datasource = this.createDataSourceByUserAcl(this.currentUserId);
    }
  }

  openCustomSearchModal(content: any): void {
    this.nameFilter = '';
    this.modalService.open(content, { size: 'lg' });
  }

  saveCustomFilters(): void {
    if (this.isSaving) return;
    this.customSearchService.saveCustomSearch({ request: this.endpoint, entitySearching: 'CORRESP', name: this.nameFilter }).subscribe({
      next: () => {
        this.isSaving = true;
        this.customSearchService.getByUserLogin().subscribe(res => (this.loadedFiltres = res));
        this.nameFilter = '';
        this.modalService.dismissAll();
      },
      error: err => console.error(err),
    });
  }

  selectSearch(search: CustomSearchView): void {
    this.selectedSearch = search;
  }

  // ── Quick search ───────────────────────────────────────────────
  onQuickSearch(): void {
    if (!this.currentUserId) return;
    const q = this.quickSearch.trim();
    if (!q) {
      this.load();
      return;
    }

    this.isSearching = true;
    this.datasource = new CustomStore({
      key: 'id',
      load: async (loadOptions: any) => {
        const skip = loadOptions.skip ?? 0;
        const take = loadOptions.take ?? 15;
        const pageIndex = Math.floor(skip / take) + 1;

        const response = await firstValueFrom(this.correspService.searchCorresps(this.currentUserId!, q, pageIndex, take));
        return { data: response.content, totalCount: response.totalItems };
      },
    });
  }

  clearQuickSearch(): void {
    this.quickSearch = '';
    this.isSearching = false;
    this.load();
  }

  // ── Delete ─────────────────────────────────────────────────────
  delete(corresp: ICorresp): void {
    const modalRef = this.modalService.open(CorrespDeleteDialogComponent, { size: 'lg', backdrop: 'static' });
    modalRef.componentInstance.corresp = corresp;
    modalRef.closed
      .pipe(
        filter(reason => reason === ITEM_DELETED_EVENT),
        switchMap(() => this.loadFromBackendWithRouteInformations())
      )
      .subscribe({ next: (res: EntityArrayResponseType) => this.onResponseSuccess(res) });
  }

  // ── Legacy route helpers (kept for compatibility) ──────────────
  navigateToWithComponentValues(): void {
    this.handleNavigation(this.page, this.predicate, this.ascending);
  }
  navigateToPage(page = this.page): void {
    this.handleNavigation(page, this.predicate, this.ascending);
  }

  protected loadFromBackendWithRouteInformations(): Observable<EntityArrayResponseType> {
    return combineLatest([this.activatedRoute.queryParamMap, this.activatedRoute.data]).pipe(
      tap(([params, data]) => this.fillComponentAttributeFromRoute(params, data)),
      switchMap(() => this.queryBackend(this.page, this.predicate, this.ascending))
    );
  }

  protected fillComponentAttributeFromRoute(params: ParamMap, data: Data): void {
    this.page = +(params.get(PAGE_HEADER) ?? 1);
    const sort = (params.get(SORT) ?? data[DEFAULT_SORT_DATA]).split(',');
    this.predicate = sort[0];
    this.ascending = sort[1] === ASC;
  }

  protected onResponseSuccess(response: EntityArrayResponseType): void {
    this.fillComponentAttributesFromResponseHeader(response.headers);
    this.corresps = this.fillComponentAttributesFromResponseBody(response.body);
  }

  protected fillComponentAttributesFromResponseBody(data: ICorresp[] | null): ICorresp[] {
    return data ?? [];
  }
  protected fillComponentAttributesFromResponseHeader(headers: HttpHeaders): void {
    this.totalItems = Number(headers.get(TOTAL_COUNT_RESPONSE_HEADER));
  }

  protected queryBackend(page?: number, predicate?: string, ascending?: boolean): Observable<EntityArrayResponseType> {
    this.isLoading = true;
    return this.correspService
      .query({
        page: (page ?? 1) - 1,
        size: this.itemsPerPage,
        eagerload: true,
        sort: this.getSortQueryParam(predicate, ascending),
      })
      .pipe(tap(() => (this.isLoading = false)));
  }

  protected handleNavigation(page = this.page, predicate?: string, ascending?: boolean): void {
    this.router.navigate(['./'], {
      relativeTo: this.activatedRoute,
      queryParams: { page, size: this.itemsPerPage, sort: this.getSortQueryParam(predicate, ascending) },
    });
  }

  protected getSortQueryParam(predicate = this.predicate, ascending = this.ascending): string[] {
    return predicate ? [`${predicate},${ascending ? ASC : DESC}`] : [];
  }

  private constructPage(skip: number, take: number): string {
    return `pageIndex=${(skip + take) / take}&pageSize=${take}`;
  }
}
