import { Injectable } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { Resolve, ActivatedRouteSnapshot, Router } from '@angular/router';
import { Observable, of, EMPTY } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { IContactCompany } from '../contact-company.model';
import { ContactCompanyService } from '../service/contact-company.service';

@Injectable({ providedIn: 'root' })
export class ContactCompanyRoutingResolveService implements Resolve<IContactCompany | null> {
  constructor(protected service: ContactCompanyService, protected router: Router) {}

  resolve(route: ActivatedRouteSnapshot): Observable<IContactCompany | null | never> {
    const id = route.params['id'];
    if (id) {
      return this.service.find(id).pipe(
        mergeMap((contactCompany: HttpResponse<IContactCompany>) => {
          if (contactCompany.body) {
            return of(contactCompany.body);
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
