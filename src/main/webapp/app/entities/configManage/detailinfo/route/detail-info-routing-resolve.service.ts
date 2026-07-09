import { Injectable } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { Observable, of, EMPTY } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { IDetailInfo, NewDetailInfo } from '../detail-info.model';
import { DetailInfoService } from '../service/detail-info.service';

@Injectable({ providedIn: 'root' })
export class DetailInfoRoutingResolveService {
  constructor(protected service: DetailInfoService, protected router: Router) {}

  resolve(route: ActivatedRouteSnapshot): Observable<IDetailInfo | NewDetailInfo | null> {
    const id = route.params['id'];
    if (id) {
      return this.service.find(id).pipe(
        mergeMap((detailInfo: HttpResponse<IDetailInfo>) => {
          if (detailInfo.body) {
            return of(detailInfo.body);
          } else {
            this.router.navigate(['404']);
            return EMPTY;
          }
        })
      );
    }
    return of({ id: null } as NewDetailInfo);
  }
}
