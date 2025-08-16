import { Injectable } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { Resolve, ActivatedRouteSnapshot, Router } from '@angular/router';
import { Observable, of, EMPTY } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { IHistConsult } from '../hist-consult.model';
import { HistConsultService } from '../service/hist-consult.service';

@Injectable({ providedIn: 'root' })
export class HistConsultRoutingResolveService implements Resolve<IHistConsult | null> {
  constructor(protected service: HistConsultService, protected router: Router) {}

  resolve(route: ActivatedRouteSnapshot): Observable<IHistConsult | null | never> {
    const id = route.params['id'];
    if (id) {
      return this.service.find(id).pipe(
        mergeMap((histConsult: HttpResponse<IHistConsult>) => {
          if (histConsult.body) {
            return of(histConsult.body);
          } else {
            this.router.navigate(['404']);
            return EMPTY;
          }
        })
      );
    }
    return of(null);
  }
}
