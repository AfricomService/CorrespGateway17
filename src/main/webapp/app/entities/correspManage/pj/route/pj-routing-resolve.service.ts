import { Injectable } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { Resolve, ActivatedRouteSnapshot, Router } from '@angular/router';
import { Observable, of, EMPTY } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { IPj } from '../pj.model';
import { PjService } from '../service/pj.service';

@Injectable({ providedIn: 'root' })
export class PjRoutingResolveService implements Resolve<IPj | null> {
  constructor(protected service: PjService, protected router: Router) {}

  resolve(route: ActivatedRouteSnapshot): Observable<IPj | null | never> {
    const id = route.params['id'];
    if (id) {
      return this.service.find(id).pipe(
        mergeMap((pj: HttpResponse<IPj>) => {
          if (pj.body) {
            return of(pj.body);
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
