import { Injectable } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { Resolve, ActivatedRouteSnapshot, Router } from '@angular/router';
import { Observable, of, EMPTY } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { IHistAction } from '../hist-action.model';
import { HistActionService } from '../service/hist-action.service';

@Injectable({ providedIn: 'root' })
export class HistActionRoutingResolveService implements Resolve<IHistAction | null> {
  constructor(protected service: HistActionService, protected router: Router) {}

  resolve(route: ActivatedRouteSnapshot): Observable<IHistAction | null | never> {
    const id = route.params['id'];
    if (id) {
      return this.service.find(id).pipe(
        mergeMap((histAction: HttpResponse<IHistAction>) => {
          if (histAction.body) {
            return of(histAction.body);
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
