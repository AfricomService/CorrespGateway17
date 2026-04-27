import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Data, ParamMap, Router } from '@angular/router';
import { combineLatest, filter, firstValueFrom, Observable, switchMap, tap } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { ICorresp } from '../corresp.model';

import { ITEMS_PER_PAGE, PAGE_HEADER, TOTAL_COUNT_RESPONSE_HEADER } from 'app/config/pagination.constants';
import { ASC, DESC, SORT, ITEM_DELETED_EVENT, DEFAULT_SORT_DATA } from 'app/config/navigation.constants';
import { EntityArrayResponseType, CorrespService, ApiFilter } from '../service/corresp.service';
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

/** Shape of the flat filter form bound directly in the template */
interface FlatFilters {
  corresptype: string | null;
  status: string | null;
  dispatchType: string | null;
  priority: boolean | null;
  startDate: string | null;
  endDate: string | null;
  reference: string | null;
  nomSociete: string | null;
}

const EMPTY_FLAT: FlatFilters = {
  corresptype: null,
  status: null,
  dispatchType: null,
  priority: null,
  startDate: null,
  endDate: null,
  reference: null,
  nomSociete: null,
};

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

  selection = { deferred: false, mode: 'single' };
  loadPanel = { enabled: true };
  sorting = { mode: 'none' };

  datasource: any = {};

  // ── Flat filter model (bound to template) ──────────────────────
  flatFilters: FlatFilters = { ...EMPTY_FLAT };

  // ── State ──────────────────────────────────────────────────────
  filterApplied = false;
  isOpen = false; // filter panel starts closed

  isAdmin = false;
  isBoc = false;
  currentUserId: number | null = null;

  isSaving = false;
  nameFilter = '';

  loadedFiltres: CustomSearchView[] = [];

  isExporting = false;

  quickSearch = '';
  isSearching = false;
  societes: { id: number; raisonSociale: string }[] = [];

  // ── Static option lists ────────────────────────────────────────
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

  FILTER_LABELS_FR: Record<string, string> = {
    corresptype: 'Type de courrier',
    reference: 'Référence',
    dispatchType: "Type d'envoi",
    status: 'Statut',
    priority: 'Priorité',
    startDate: 'Date de début',
    endDate: 'Date de fin',
    nomSociete: 'Société',
  };

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
    this.customSearchService.getByUserLogin().subscribe(res => (this.loadedFiltres = res));
    this.correspService.getAllSocietes().subscribe(res => (this.societes = res));

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
    const map: Record<string, string> = { INCOMING: 'Arrivée', OUTGOING: 'Départ', INTERNAL: 'Interne' };
    return map[type] ?? type;
  }

  getFilterEntries(filters: Record<string, string>) {
    return Object.entries(filters).map(([key, value]) => ({
      key: this.FILTER_LABELS_FR[key] || key,
      value,
    }));
  }

  togglePanel(): void {
    this.isOpen = !this.isOpen;
  }

  // ── Row coloring ───────────────────────────────────────────────
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

  onRowDoubleClick(e: any): void {
    window.open(`/cc/corresp/${e.data.id}/view`, '_blank');
  }

  // ── Data loading ───────────────────────────────────────────────
  load(): void {
    if (this.isAdmin || this.isBoc) {
      this.datasource = this.createDataSource();
    } else if (this.currentUserId != null) {
      this.datasource = this.createDataSourceByUserAcl(this.currentUserId);
    }
  }

  createDataSource(apiFilters?: ApiFilter[]): CustomStore {
    return new CustomStore({
      key: 'id',
      load: async (loadOptions: any) => {
        const skip = loadOptions.skip ?? 0;
        const take = loadOptions.take ?? 15;
        const pageIndex = Math.floor(skip / take) + 1;

        const params: any = {};
        if (apiFilters?.length) {
          apiFilters.forEach(f => {
            switch (f.field) {
              case 'corresptype':
                params.corresptype = f.value;
                break;
              case 'reference':
                params.reference = f.value;
                break;
              case 'status':
                params.status = f.value;
                break;
              case 'dispatchType':
                params.dispatchType = f.value;
                break;
              case 'priority':
                params.priority = f.value;
                break;
              case 'nomSociete':
                params.nomSociete = f.value;
                break;
              case 'courrierDate':
                params.startDate = f.value.startDate;
                params.endDate = f.value.endDate;
                break;
            }
          });
        }

        const response = await firstValueFrom(
          this.correspService.getCorrespList(this.currentUserId!, pageIndex, take, this.quickSearch.trim(), {
            corresptype: params.corresptype,
            reference: params.reference,
            status: params.status,
            dispatchType: params.dispatchType,
            priority: params.priority,
            startDate: params.startDate,
            endDate: params.endDate,
            nomSociete: params.nomSociete,
          })
        );
        return { data: response.content, totalCount: response.totalItems };
      },
    });
  }

  createDataSourceByUserAcl(userId: number, apiFilters?: ApiFilter[]): CustomStore {
    return new CustomStore({
      key: 'id',
      load: async (loadOptions: any) => {
        const skip = loadOptions.skip ?? 0;
        const take = loadOptions.take ?? 15;
        const pageIndex = Math.floor(skip / take) + 1;

        const response = await firstValueFrom(
          this.correspService.getCorrespListByAcl(userId, pageIndex, take, this.quickSearch.trim(), apiFilters)
        );
        return { data: response.content, totalCount: response.totalItems };
      },
    });
  }

  // ── Flat filter actions ────────────────────────────────────────
  /** Convert the flat form model → ApiFilter[] and reload */
  applyFlatFilters(): void {
    const apiFilters: ApiFilter[] = [];

    if (this.flatFilters.corresptype) {
      apiFilters.push({
        field: 'corresptype',
        label: 'Type de courrier',
        value: this.flatFilters.corresptype,
        displayValue: this.getCorrespTypeLabel(this.flatFilters.corresptype),
      });
    }
    if (this.flatFilters.status) {
      const label = this.statusOptions.find(s => s.value === this.flatFilters.status)?.label ?? this.flatFilters.status;
      apiFilters.push({ field: 'status', label: 'Statut', value: this.flatFilters.status, displayValue: label });
    }
    if (this.flatFilters.dispatchType) {
      const label = this.dispatchOptions.find(d => d.value === this.flatFilters.dispatchType)?.label ?? this.flatFilters.dispatchType;
      apiFilters.push({ field: 'dispatchType', label: "Type d'envoi", value: this.flatFilters.dispatchType, displayValue: label });
    }
    if (this.flatFilters.priority !== null) {
      apiFilters.push({
        field: 'priority',
        label: 'Priorité',
        value: this.flatFilters.priority,
        displayValue: this.flatFilters.priority ? 'Prioritaire' : 'Normale',
      });
    }
    if (this.flatFilters.reference?.trim()) {
      apiFilters.push({
        field: 'reference',
        label: 'Référence',
        value: this.flatFilters.reference.trim(),
        displayValue: this.flatFilters.reference.trim(),
      });
    }
    if (this.flatFilters.nomSociete?.trim()) {
      apiFilters.push({
        field: 'nomSociete',
        label: 'Société',
        value: this.flatFilters.nomSociete.trim(),
        displayValue: this.flatFilters.nomSociete.trim(),
      });
    }
    if (this.flatFilters.startDate && this.flatFilters.endDate) {
      apiFilters.push({
        field: 'courrierDate',
        label: 'Date courrier',
        value: { startDate: this.flatFilters.startDate, endDate: this.flatFilters.endDate },
        displayValue: `${this.flatFilters.startDate} → ${this.flatFilters.endDate}`,
      });
    }

    this._reloadWithApiFilters(apiFilters);
    this.filterApplied = apiFilters.length > 0;
    this.isSaving = false;
    this.loadedFiltres.forEach(f => (f.active = false));
  }

  resetAllFilters(): void {
    this.flatFilters = { ...EMPTY_FLAT };
    this.filterApplied = false;
    this.isSaving = false;
    this.loadedFiltres.forEach(f => (f.active = false));
    this.load();
  }

  private _reloadWithApiFilters(apiFilters: ApiFilter[]): void {
    if (this.isAdmin || this.isBoc) {
      this.datasource = this.createDataSource(apiFilters);
    } else if (this.currentUserId != null) {
      this.datasource = this.createDataSourceByUserAcl(this.currentUserId, apiFilters); // ✅ filtres passés
    }
  }

  // ── Saved / favourite filters ──────────────────────────────────
  selectOnlyThisFilter(selected: CustomSearchView): void {
    this.loadedFiltres.forEach(f => {
      if (f === selected) {
        f.active = !f.active;
        if (f.active) {
          // Map saved filter keys → ApiFilter[]
          const apiFilters: ApiFilter[] = Object.keys(selected.filters).map(key => ({
            field: key,
            label: this.FILTER_LABELS_FR[key] || key,
            value: selected.filters[key],
            displayValue: String(selected.filters[key]),
          }));
          this._reloadWithApiFilters(apiFilters);
          this.filterApplied = true;
        } else {
          this.filterApplied = false;
          this.load();
        }
      } else {
        f.active = false;
      }
    });
  }

  /** Remove a saved favourite filter (client-side only — add API call if needed) */
  removeSavedFilter(fav: CustomSearchView): void {
    if (!fav.id) return;

    this.customSearchService.delete(fav.id).subscribe({
      next: () => {
        this.loadedFiltres = this.loadedFiltres.filter(f => f !== fav);
        if (fav.active) {
          this.filterApplied = false;
          this.load();
        }
      },
      error: err => console.error('Erreur suppression filtre', err),
    });
  }

  saveCustomFilters(): void {
    if (this.isSaving || !this.nameFilter.trim()) return;

    // Build request object from current flatFilters
    const requestObj: Record<string, any> = {};
    if (this.flatFilters.corresptype) requestObj['corresptype'] = this.flatFilters.corresptype;
    if (this.flatFilters.status) requestObj['status'] = this.flatFilters.status;
    if (this.flatFilters.dispatchType) requestObj['dispatchType'] = this.flatFilters.dispatchType;
    if (this.flatFilters.priority !== null) requestObj['priority'] = this.flatFilters.priority;
    if (this.flatFilters.reference?.trim()) requestObj['reference'] = this.flatFilters.reference.trim();
    if (this.flatFilters.startDate) requestObj['startDate'] = this.flatFilters.startDate;
    if (this.flatFilters.endDate) requestObj['endDate'] = this.flatFilters.endDate;

    this.customSearchService
      .saveCustomSearch({
        request: JSON.stringify(requestObj),
        entitySearching: 'CORRESP',
        name: this.nameFilter.trim(),
      })
      .subscribe({
        next: () => {
          this.isSaving = true;
          this.nameFilter = '';
          this.customSearchService.getByUserLogin().subscribe(res => {
            this.loadedFiltres = res;
            // reset saving indicator after a moment
            setTimeout(() => (this.isSaving = false), 2500);
          });
        },
        error: err => console.error(err),
      });
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

  // ── Legacy route helpers ───────────────────────────────────────
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
    this.corresps = response.body ?? [];
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

  exportToExcel(): void {
    if (this.isExporting || !this.currentUserId) return;
    this.isExporting = true;

    const filters = {
      q: this.quickSearch.trim() || undefined,
      corresptype: this.flatFilters.corresptype ?? undefined,
      reference: this.flatFilters.reference ?? undefined,
      status: this.flatFilters.status ?? undefined,
      dispatchType: this.flatFilters.dispatchType ?? undefined,
      priority: this.flatFilters.priority ?? undefined,
      startDate: this.flatFilters.startDate ?? undefined,
      endDate: this.flatFilters.endDate ?? undefined,
      nomSociete: this.flatFilters.nomSociete ?? undefined,
    };

    this.correspService.exportCorresps(this.currentUserId, this.isAdmin || this.isBoc, filters).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        const today = new Date().toISOString().split('T')[0];
        anchor.href = url;
        anchor.download = `correspondances_${today}.xlsx`;
        anchor.click();
        window.URL.revokeObjectURL(url);
        this.isExporting = false;
      },
      error: err => {
        console.error('Erreur export Excel', err);
        this.isExporting = false;
      },
    });
  }
}
