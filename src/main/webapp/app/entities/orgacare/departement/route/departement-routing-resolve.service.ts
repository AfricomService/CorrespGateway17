import { Injectable } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { Resolve, ActivatedRouteSnapshot, Router } from '@angular/router';
import { Observable, of, EMPTY } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { IDepartement } from '../departement.model';
import { DepartementService } from '../service/departement.service';

@Injectable({ providedIn: 'root' })
export class DepartementRoutingResolveService implements Resolve<IDepartement | null> {
  constructor(protected service: DepartementService, protected router: Router) {}

  resolve(route: ActivatedRouteSnapshot): Observable<IDepartement | null | never> {
    const id = route.params['id'];
    if (id) {
      return this.service.find(id).pipe(
        mergeMap((departement: HttpResponse<IDepartement>) => {
          if (departement.body) {
            return of(departement.body);
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
