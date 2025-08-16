import { Injectable } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { Resolve, ActivatedRouteSnapshot, Router } from '@angular/router';
import { Observable, of, EMPTY } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { IMyreport } from '../myreport.model';
import { MyreportService } from '../service/myreport.service';

@Injectable({ providedIn: 'root' })
export class MyreportRoutingResolveService implements Resolve<IMyreport | null> {
  constructor(protected service: MyreportService, protected router: Router) {}

  resolve(route: ActivatedRouteSnapshot): Observable<IMyreport | null | never> {
    const id = route.params['id'];
    if (id) {
      return this.service.find(id).pipe(
        mergeMap((myreport: HttpResponse<IMyreport>) => {
          if (myreport.body) {
            return of(myreport.body);
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
