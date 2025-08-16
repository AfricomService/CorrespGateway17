import { Injectable } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { Resolve, ActivatedRouteSnapshot, Router } from '@angular/router';
import { Observable, of, EMPTY } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { IRules } from '../rules.model';
import { RulesService } from '../service/rules.service';

@Injectable({ providedIn: 'root' })
export class RulesRoutingResolveService implements Resolve<IRules | null> {
  constructor(protected service: RulesService, protected router: Router) {}

  resolve(route: ActivatedRouteSnapshot): Observable<IRules | null | never> {
    const id = route.params['id'];
    if (id) {
      return this.service.find(id).pipe(
        mergeMap((rules: HttpResponse<IRules>) => {
          if (rules.body) {
            return of(rules.body);
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
