import { Injectable } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { Resolve, ActivatedRouteSnapshot, Router } from '@angular/router';
import { Observable, of, EMPTY } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { ICorresp } from '../corresp.model';
import { CorrespService } from '../service/corresp.service';

@Injectable({ providedIn: 'root' })
export class CorrespRoutingResolveService implements Resolve<ICorresp | null> {
  constructor(protected service: CorrespService, protected router: Router) {}

  resolve(route: ActivatedRouteSnapshot): Observable<ICorresp | null | never> {
    const id = route.params['id'];
    if (id) {
      return this.service.find(id).pipe(
        mergeMap((corresp: HttpResponse<ICorresp>) => {
          if (corresp.body) {
            return of(corresp.body);
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
