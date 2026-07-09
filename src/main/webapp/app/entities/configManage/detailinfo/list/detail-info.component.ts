import { Component, OnInit } from '@angular/core';
import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest } from 'rxjs';

import { ITEMS_PER_PAGE, TOTAL_COUNT_RESPONSE_HEADER } from 'app/config/pagination.constants';
import { ASC, DESC, SORT } from 'app/config/navigation.constants';
import { IDetailInfo } from '../detail-info.model';
import { DetailInfoService } from '../service/detail-info.service';

@Component({
  selector: 'jhi-detail-info',
  templateUrl: './detail-info.component.html',
})
export class DetailInfoComponent implements OnInit {
  detailInfos?: IDetailInfo[];
  isLoading = false;
  itemsPerPage = ITEMS_PER_PAGE;
  totalItems = 0;
  page!: number;
  predicate!: string;
  ascending!: boolean;

  constructor(protected detailInfoService: DetailInfoService, protected activatedRoute: ActivatedRoute, protected router: Router) {}

  trackId = (_index: number, item: IDetailInfo): number => this.detailInfoService.getDetailInfoIdentifier(item);

  loadPage(page?: number, dontNavigate?: boolean): void {
    this.isLoading = true;
    const pageToLoad: number = page ?? this.page ?? 1;

    this.detailInfoService
      .query({
        page: pageToLoad - 1,
        size: this.itemsPerPage,
        sort: this.sort(),
      })
      .subscribe({
        next: (res: HttpResponse<IDetailInfo[]>) => {
          this.isLoading = false;
          this.onSuccess(res.body, res.headers, pageToLoad, !dontNavigate);
        },
        error: () => {
          this.isLoading = false;
          this.onError();
        },
      });
  }

  ngOnInit(): void {
    this.handleNavigation();
  }

  delete(detailInfo: IDetailInfo): void {
    if (confirm('Voulez-vous vraiment supprimer cet élément ?')) {
      this.detailInfoService.delete(detailInfo.id).subscribe(() => {
        this.loadPage();
      });
    }
  }

  protected sort(): string[] {
    const result = [this.predicate + ',' + (this.ascending ? ASC : DESC)];
    if (this.predicate !== 'id') {
      result.push('id');
    }
    return result;
  }

  protected handleNavigation(): void {
    combineLatest([this.activatedRoute.data, this.activatedRoute.queryParamMap]).subscribe(([data, params]) => {
      const page = params.get('page');
      const pageNumber = page !== null ? +page : 1;
      const sort = (params.get(SORT) ?? data['defaultSort']).split(',');
      const predicate = sort[0];
      const ascending = sort[1] === ASC;
      if (pageNumber !== this.page || predicate !== this.predicate || ascending !== this.ascending) {
        this.predicate = predicate;
        this.ascending = ascending;
        this.loadPage(pageNumber, true);
      }
    });
  }

  protected onSuccess(data: IDetailInfo[] | null, headers: HttpHeaders, page: number, navigate: boolean): void {
    this.totalItems = Number(headers.get(TOTAL_COUNT_RESPONSE_HEADER));
    this.page = page;
    if (navigate) {
      this.router.navigate(['/detail-info'], {
        queryParams: { page: this.page, sort: this.predicate + ',' + (this.ascending ? ASC : DESC) },
      });
    }
    this.detailInfos = data ?? [];
  }

  protected onError(): void {
    this.page = this.page ?? 1;
  }
}
