import { Injectable } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { Resolve, ActivatedRouteSnapshot, Router } from '@angular/router';
import { Observable, of, EMPTY } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { IOrgaEntity } from '../orga-entity.model';
import { OrgaEntityService } from '../service/orga-entity.service';

@Injectable({ providedIn: 'root' })
export class OrgaEntityRoutingResolveService implements Resolve<IOrgaEntity | null> {
  constructor(protected service: OrgaEntityService, protected router: Router) {}

  resolve(route: ActivatedRouteSnapshot): Observable<IOrgaEntity | null | never> {
    const id = route.params['id'];
    if (id) {
      return this.service.find(id).pipe(
        mergeMap((orgaEntity: HttpResponse<IOrgaEntity>) => {
          if (orgaEntity.body) {
            return of(orgaEntity.body);
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
