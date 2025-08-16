import { Injectable } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { Resolve, ActivatedRouteSnapshot, Router } from '@angular/router';
import { Observable, of, EMPTY } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { IPersonCompany } from '../person-company.model';
import { PersonCompanyService } from '../service/person-company.service';

@Injectable({ providedIn: 'root' })
export class PersonCompanyRoutingResolveService implements Resolve<IPersonCompany | null> {
  constructor(protected service: PersonCompanyService, protected router: Router) {}

  resolve(route: ActivatedRouteSnapshot): Observable<IPersonCompany | null | never> {
    const id = route.params['id'];
    if (id) {
      return this.service.find(id).pipe(
        mergeMap((personCompany: HttpResponse<IPersonCompany>) => {
          if (personCompany.body) {
            return of(personCompany.body);
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
