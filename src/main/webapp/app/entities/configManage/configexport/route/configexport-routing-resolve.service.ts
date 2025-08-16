import { Injectable } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { Resolve, ActivatedRouteSnapshot, Router } from '@angular/router';
import { Observable, of, EMPTY } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { IConfigexport } from '../configexport.model';
import { ConfigexportService } from '../service/configexport.service';

@Injectable({ providedIn: 'root' })
export class ConfigexportRoutingResolveService implements Resolve<IConfigexport | null> {
  constructor(protected service: ConfigexportService, protected router: Router) {}

  resolve(route: ActivatedRouteSnapshot): Observable<IConfigexport | null | never> {
    const id = route.params['id'];
    if (id) {
      return this.service.find(id).pipe(
        mergeMap((configexport: HttpResponse<IConfigexport>) => {
          if (configexport.body) {
            return of(configexport.body);
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
