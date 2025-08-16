import { Injectable } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { Resolve, ActivatedRouteSnapshot, Router } from '@angular/router';
import { Observable, of, EMPTY } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { IParentClassdef } from '../parent-classdef.model';
import { ParentClassdefService } from '../service/parent-classdef.service';

@Injectable({ providedIn: 'root' })
export class ParentClassdefRoutingResolveService implements Resolve<IParentClassdef | null> {
  constructor(protected service: ParentClassdefService, protected router: Router) {}

  resolve(route: ActivatedRouteSnapshot): Observable<IParentClassdef | null | never> {
    const id = route.params['id'];
    if (id) {
      return this.service.find(id).pipe(
        mergeMap((parentClassdef: HttpResponse<IParentClassdef>) => {
          if (parentClassdef.body) {
            return of(parentClassdef.body);
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
