import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Data, ParamMap, Router } from '@angular/router';
import { combineLatest, filter, Observable, switchMap, tap } from 'rxjs';
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

  selection = {
    deferred: false,
    mode: 'single',
  };

  loadPanel = {
    enabled: true,
  };

  sorting = {
    mode: 'none',
  };

  datasource: any = {};

  // selectedFilter: string = '';
  // filterValue: any = '';
  // dateRange = {startDate: '', endDate: ''};
  //
  // activeFilters: { key: string, value: any, label: string, displayValue: string }[] = [];

  selectedFilter: string | null = null;
  filterValue: any = null;
  dateRange = { startDate: null, endDate: null };

  activeFilters: Filter[] = [];

  endpoint!: string;

  filterApplied = false;

  isSaving = false;

  nameFilter = '';

  loadedFiltres: CustomSearchView[] = [];

  selectedSearch: CustomSearchView | null = null;

  // Options
  statusOptions = [
    { value: 'DRAFT', label: 'Brouillon' },
    { value: 'IN_PROGRESS', label: 'En cours' },
    { value: 'CLOSED', label: 'Clôturé' },
    { value: 'CANCELLED', label: 'Annulé' },
  ];

  dispatchOptions = [
    { value: 'LETTER', label: 'Lettre' },
    { value: 'REGISTERED_LETTER', label: 'Lettre Recommandée' },
    { value: 'EMAIL', label: 'Email' },
    { value: 'FAX', label: 'Fax' },
  ];

  // All possible filters
  allFilters = [
    { value: 'reference', label: 'Référence' },
    { value: 'status', label: 'Statut' },
    { value: 'dispatchType', label: 'Type d’envoi' },
    { value: 'courrierDate', label: 'Date courrier' },
  ];

  FILTER_LABELS_FR: { [key: string]: string } = {
    reference: 'Référence',
    dispatchType: 'Type d’envoi',
    status: 'Statut',
    startDate: 'Date de début',
    endDate: 'Date de fin',
  };

  // Dynamic list depending on active filters
  get availableFilters() {
    const usedFields = this.activeFilters.map(f => f.field);
    return this.allFilters.filter(f => !usedFields.includes(f.value));
  }

  public resourceUrl = SERVER_API_URL + 'services/correspmanage/api/corresps';

  presentFilter = false;

  @ViewChild(DxDataGridComponent, { static: false }) dataGrid!: DxDataGridComponent;

  constructor(
    protected correspService: CorrespService,
    protected activatedRoute: ActivatedRoute,
    public router: Router,
    protected dataUtils: DataUtils,
    protected modalService: NgbModal,
    protected http: HttpClient,
    protected customSearchService: CustomSearchService
  ) {}

  trackId = (_index: number, item: ICorresp): number => this.correspService.getCorrespIdentifier(item);

  ngOnInit(): void {
    this.selectedItemsAcc = ['Information Generales', 'Tasks'];
    this.customSearchService.getByUserLogin().subscribe(res => (this.loadedFiltres = res));
    this.load();
  }

  byteSize(base64String: string): string {
    return this.dataUtils.byteSize(base64String);
  }

  openFile(base64String: string, contentType: string | null | undefined): void {
    return this.dataUtils.openFile(base64String, contentType);
  }

  delete(corresp: ICorresp): void {
    const modalRef = this.modalService.open(CorrespDeleteDialogComponent, { size: 'lg', backdrop: 'static' });
    modalRef.componentInstance.corresp = corresp;
    // unsubscribe not needed because closed completes on modal close
    modalRef.closed
      .pipe(
        filter(reason => reason === ITEM_DELETED_EVENT),
        switchMap(() => this.loadFromBackendWithRouteInformations())
      )
      .subscribe({
        next: (res: EntityArrayResponseType) => {
          this.onResponseSuccess(res);
        },
      });
  }

  // onRowPrepared(e: any) {
  //   if (e.data.priority === true) {
  //     e.rowElement.style.backgroundColor = '#ffcccc';
  //   }
  // }

  onRowPrepared(e: any) {
    console.log(e); // eslint-disable-line no-console
    // e.rowElement.style.fontWeight = 'bold';  // make text bold
    switch (e.data.corresptype) {
      case CorrespType.INCOMING:
        e.rowElement.style.backgroundColor = '#d1f7d6'; // light green
        break;
      case CorrespType.OUTGOING:
        e.rowElement.style.backgroundColor = '#ffe0b3'; // light orange
        break;
      case CorrespType.INTERNAL:
        e.rowElement.style.backgroundColor = '#cce5ff'; // light blue
        break;
    }
  }

  createDataSource(filter?: Filter[]): CustomStore {
    return new CustomStore({
      key: 'id',
      load: (loadOptions: any) => {
        const params: any = {
          ...loadOptions,
          $paging: this.constructPage(loadOptions.skip, loadOptions.take),
        };

        // // append active filters
        // this.activeFilters.forEach(f => {
        //   if (f.key === 'courrierDate') {
        //     params.startDate = this.dateRange.startDate;
        //     params.endDate = this.dateRange.endDate;
        //   } else {
        //     params[f.key] = f.value;
        //   }
        // });

        this.endpoint = `${this.resourceUrl}-filter?${params.$paging}`;

        console.log('filter from inside');
        console.log(filter);

        if (filter && filter.length > 0) {
          filter.forEach(f => {
            switch (f.field) {
              case 'reference':
                this.endpoint += `&reference=${f.value}`;
                break;
              case 'status':
                this.endpoint += `&status=${f.value}`;
                break;
              case 'dispatchType':
                this.endpoint += `&dispatchType=${f.value}`;
                break;
              case 'courrierDate':
                this.endpoint += `&startDate=${f.value.startDate}&endDate=${f.value.endDate}`;
                break;
              default:
                console.log('No Filter');
            }
          });
        }

        // if (params.reference) endpoint += `&reference=${params.reference}`;
        // if (params.status) endpoint += `&status=${params.status}`;
        // if (params.dispatchType) endpoint += `&dispatchType=${params.dispatchType}`;
        // if (params.startDate && params.endDate) endpoint += `&startDate=${params.startDate}&endDate=${params.endDate}`;
        //
        // console.log("endpoint", params);
        // console.log("endpoint", this.dateRange);

        return this.http
          .get(this.endpoint)
          .toPromise()
          .then((data: any) => ({
            data: data.content,
            totalCount: data.totalElements,
          }));
      },
    });
  }

  // resetFilterValue() {
  //   this.filterValue = '';
  //   this.dateRange = {startDate: '', endDate: ''};
  // }
  //
  // applyFilter() {
  //   if (!this.selectedFilter) return;
  //
  //   let label = '';
  //   let displayValue = '';
  //
  //   switch (this.selectedFilter) {
  //     case 'reference':
  //       label = 'Référence';
  //       displayValue = this.filterValue;
  //       break;
  //     case 'status':
  //       label = 'Statut';
  //       displayValue = this.filterValue;
  //       break;
  //     case 'dispatchType':
  //       label = 'Type d’envoi';
  //       displayValue = this.filterValue;
  //       break;
  //     case 'courrierDate':
  //       label = 'Date courrier';
  //       displayValue = `${this.dateRange.startDate} → ${this.dateRange.endDate}`;
  //       break;
  //   }
  //
  //   this.activeFilters.push({
  //     key: this.selectedFilter,
  //     value: this.selectedFilter === 'courrierDate' ? this.dateRange : this.filterValue,
  //     label,
  //     displayValue,
  //   });
  //
  //   this.load(); // reload datasource
  //   this.resetFilterValue();
  //   this.selectedFilter = '';
  // }

  // removeFilter(index: number) {
  //   this.activeFilters.splice(index, 1);
  //   this.load(); // reload datasource
  // }

  // createDataSource(): CustomStore {
  //   return new CustomStore({
  //     key: 'id',
  //     load: (loadOptions: any) => {
  //
  //
  //       const params = {
  //         ...loadOptions,
  //         $paging: this.constructPage(loadOptions.skip, loadOptions.take),
  //       };
  //
  //       let endpoint = `${this.resourceUrl}-page?${params.$paging}`;
  //
  //       console.log("endpoint", endpoint);
  //
  //       return this.http.get(endpoint).toPromise().then((data: any) => ({
  //         data: data.content,
  //         totalCount: data.totalElements,
  //       }));
  //     },
  //   });
  // }

  load(): void {
    this.datasource = this.createDataSource();

    // this.loadFromBackendWithRouteInformations().subscribe({
    //   next: (res: EntityArrayResponseType) => {
    //     this.onResponseSuccess(res);
    //   },
    // });
  }

  private constructFilter(filter: any): string {
    if (!filter) {
      return '';
    }

    let apiReq = '?';

    if (Array.isArray(filter)) {
      //ONLY ONE FILTER
      if (filter[0] !== 'and' && !Array.isArray(filter[0])) {
        apiReq += filter[0] + '=' + filter[2] + '&';
      }

      if (Array.isArray(filter[0]) && (filter[0][0] === 'dateCreated' || filter[0][0] === 'courrierDate')) {
        if (String(filter[0][2]).toUpperCase().includes('TIME')) {
          console.log('INSIDE PLANIFICATION CONDITION'); // eslint-disable-line no-console

          const inputDateString = filter[0][2];
          // console.log(this.isISO8601Format(inputDateString)); // eslint-disable-line no-console

          const parsedDate = moment(inputDateString, 'ddd MMM DD YYYY HH:mm:ss [GMT]ZZ (zz)');
          // console.log(parsedDate); // eslint-disable-line no-console

          const outputDateString = parsedDate.format('YYYY-MM-DDTHH:mm:ss.SSSZ');
          // console.log(outputDateString); // eslint-disable-line no-console

          apiReq += filter[0][0] + '=' + outputDateString + '&';
        } else {
          apiReq += filter[0][0] + '=' + filter[0][2] + '&';
        }
      }

      //MULTIPLE FILTERS
      if (Array.isArray(filter[0]) && filter[0][0] !== 'dateCreated' && filter[0][0] !== 'courrierDate') {
        filter.forEach(filterArr => {
          if (Array.isArray(filterArr)) {
            if (Array.isArray(filterArr[0])) {
              if (String(filterArr[0][2]).toUpperCase().includes('TIME')) {
                // console.log("INSIDE PLANIFICATION CONDITION"); // eslint-disable-line no-console

                const inputDateString = filterArr[0][2];

                const parsedDate = moment(inputDateString, 'ddd MMM DD YYYY HH:mm:ss [GMT]ZZ (zz)');
                // console.log(parsedDate); // eslint-disable-line no-console

                const outputDateString = parsedDate.format('YYYY-MM-DDTHH:mm:ss.SSSZ');
                // console.log(outputDateString); // eslint-disable-line no-console

                apiReq += filterArr[0][0] + '=' + outputDateString + '&';
              } else {
                apiReq += filterArr[0][0] + '=' + filterArr[0][2] + '&';
              }
            } else {
              apiReq += filterArr[0] + '=' + filterArr[2] + '&';
            }
          }
        });
      }
    }

    return apiReq.slice(0, -1);
    // return apiReq;
  }

  private constructPage(skip: number, take: number): string {
    return `pageIndex=${(skip + take) / take}&pageSize=${take}`;
  }

  resetFilterValue() {
    this.filterValue = null;
    this.dateRange = { startDate: null, endDate: null };
  }

  addFilter() {
    if (!this.selectedFilter) return;

    let displayValue = '';
    let value: any = null;
    let label = '';

    switch (this.selectedFilter) {
      case 'reference':
        value = this.filterValue;
        displayValue = value;
        label = 'Référence';
        break;

      case 'status':
        value = this.filterValue;
        displayValue = this.statusOptions.find(s => s.value === value)?.label || value;
        label = 'Statut';
        break;

      case 'dispatchType':
        value = this.filterValue;
        displayValue = this.dispatchOptions.find(d => d.value === value)?.label || value;
        label = 'Type d’envoi';
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

  removeFilter(index: number) {
    this.activeFilters.splice(index, 1);
    this.datasource = this.createDataSource(this.activeFilters);

    this.isSaving = false;
    this.filterApplied = this.activeFilters.length > 0;
  }

  applyFilters() {
    console.log('Filters applied:', this.activeFilters);
    this.datasource = this.createDataSource(this.activeFilters);

    this.isSaving = false;
    this.filterApplied = this.activeFilters.length > 0;

    this.loadedFiltres.forEach(f => (f.active = false));
  }

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
    const page = params.get(PAGE_HEADER);
    this.page = +(page ?? 1);
    const sort = (params.get(SORT) ?? data[DEFAULT_SORT_DATA]).split(',');
    this.predicate = sort[0];
    this.ascending = sort[1] === ASC;
  }

  protected onResponseSuccess(response: EntityArrayResponseType): void {
    this.fillComponentAttributesFromResponseHeader(response.headers);
    const dataFromBody = this.fillComponentAttributesFromResponseBody(response.body);
    this.corresps = dataFromBody;
  }

  protected fillComponentAttributesFromResponseBody(data: ICorresp[] | null): ICorresp[] {
    return data ?? [];
  }

  protected fillComponentAttributesFromResponseHeader(headers: HttpHeaders): void {
    this.totalItems = Number(headers.get(TOTAL_COUNT_RESPONSE_HEADER));
  }

  protected queryBackend(page?: number, predicate?: string, ascending?: boolean): Observable<EntityArrayResponseType> {
    this.isLoading = true;
    const pageToLoad: number = page ?? 1;
    const queryObject = {
      page: pageToLoad - 1,
      size: this.itemsPerPage,
      eagerload: true,
      sort: this.getSortQueryParam(predicate, ascending),
    };
    return this.correspService.query(queryObject).pipe(tap(() => (this.isLoading = false)));
  }

  protected handleNavigation(page = this.page, predicate?: string, ascending?: boolean): void {
    const queryParamsObj = {
      page,
      size: this.itemsPerPage,
      sort: this.getSortQueryParam(predicate, ascending),
    };

    this.router.navigate(['./'], {
      relativeTo: this.activatedRoute,
      queryParams: queryParamsObj,
    });
  }

  protected getSortQueryParam(predicate = this.predicate, ascending = this.ascending): string[] {
    const ascendingQueryParam = ascending ? ASC : DESC;
    if (predicate === '') {
      return [];
    } else {
      return [predicate + ',' + ascendingQueryParam];
    }
  }

  onRowDoubleClick(e: any): void {
    // console.log("event")
    // console.log(e)
    // this.router.navigate(['/corresp', e.data.id, 'view'])
    const url = this.router.serializeUrl(this.router.createUrlTree([`/corresp/${e.data.id}/view`]));
    window.open(url);
  }

  // saveCustomFilters():void {
  //   this.customSearchService.saveCustomSearch({request:this.endpoint,entitySearching:"CORRESP"}).subscribe(res => {
  //     console.log(res)
  //   })
  // }

  openCustomSearchModal(content: any): void {
    this.nameFilter = '';
    this.modalService.open(content, { size: 'xl' });
  }

  saveCustomFilters(): void {
    if (this.isSaving) return;

    console.log('name filter', this.nameFilter);

    this.customSearchService.saveCustomSearch({ request: this.endpoint, entitySearching: 'CORRESP', name: this.nameFilter }).subscribe({
      next: res => {
        console.log(res);
        this.isSaving = true;
        this.customSearchService.getByUserLogin().subscribe(res => (this.loadedFiltres = res));
        this.nameFilter = '';
        this.modalService.dismissAll();
      },
      error: err => {
        console.error(err);
      },
    });
  }

  selectSearch(search: CustomSearchView): void {
    this.selectedSearch = search;
    console.log('Selected search:', search);
  }

  formatFilters(filters: { [key: string]: string }): string {
    return Object.entries(filters)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n'); // newline for each filter
  }

  // getFilterEntries(filters: { [key: string]: string }) {
  //   return Object.entries(filters).map(([key, value]) => ({ key, value }));
  // }

  getFilterEntries(filters: { [key: string]: string }) {
    return Object.entries(filters).map(([key, value]) => ({
      key: this.FILTER_LABELS_FR[key] || key, // fallback to key if not in map
      value,
    }));
  }

  toggleFilterColor(filter: CustomSearchView): void {
    filter.active = !filter.active;
  }

  selectOnlyThisFilter(selectedFilter: CustomSearchView): void {
    this.loadedFiltres.forEach(filter => {
      if (filter === selectedFilter) {
        filter.active = !filter.active;

        if (filter.active) {
          const filtersArray: Filter[] = Object.keys(selectedFilter.filters).map(key => {
            return {
              field: key,
              label: key,
              value: selectedFilter.filters[key],
              displayValue: '',
            };
          });
          this.datasource = this.createDataSource(filtersArray);
        } else {
          this.datasource = this.createDataSource();
        }
      } else {
        filter.active = false;
      }
    });
  }

  isOpen = true; // default open

  togglePanel() {
    this.isOpen = !this.isOpen;
  }
}
