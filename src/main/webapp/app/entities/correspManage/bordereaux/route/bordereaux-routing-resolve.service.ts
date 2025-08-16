import { Injectable } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { Resolve, ActivatedRouteSnapshot, Router } from '@angular/router';
import { Observable, of, EMPTY } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { IBordereaux } from '../bordereaux.model';
import { BordereauxService } from '../service/bordereaux.service';

@Injectable({ providedIn: 'root' })
export class BordereauxRoutingResolveService implements Resolve<IBordereaux | null> {
  constructor(protected service: BordereauxService, protected router: Router) {}

  resolve(route: ActivatedRouteSnapshot): Observable<IBordereaux | null | never> {
    const id = route.params['id'];
    if (id) {
      return this.service.find(id).pipe(
        mergeMap((bordereaux: HttpResponse<IBordereaux>) => {
          if (bordereaux.body) {
            return of(bordereaux.body);
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
