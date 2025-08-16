import { Injectable } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { Resolve, ActivatedRouteSnapshot, Router } from '@angular/router';
import { Observable, of, EMPTY } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { INumsequentielle } from '../numsequentielle.model';
import { NumsequentielleService } from '../service/numsequentielle.service';

@Injectable({ providedIn: 'root' })
export class NumsequentielleRoutingResolveService implements Resolve<INumsequentielle | null> {
  constructor(protected service: NumsequentielleService, protected router: Router) {}

  resolve(route: ActivatedRouteSnapshot): Observable<INumsequentielle | null | never> {
    const id = route.params['id'];
    if (id) {
      return this.service.find(id).pipe(
        mergeMap((numsequentielle: HttpResponse<INumsequentielle>) => {
          if (numsequentielle.body) {
            return of(numsequentielle.body);
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
