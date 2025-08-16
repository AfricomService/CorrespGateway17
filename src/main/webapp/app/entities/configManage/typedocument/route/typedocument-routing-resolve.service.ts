import { Injectable } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { Resolve, ActivatedRouteSnapshot, Router } from '@angular/router';
import { Observable, of, EMPTY } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { ITypedocument } from '../typedocument.model';
import { TypedocumentService } from '../service/typedocument.service';

@Injectable({ providedIn: 'root' })
export class TypedocumentRoutingResolveService implements Resolve<ITypedocument | null> {
  constructor(protected service: TypedocumentService, protected router: Router) {}

  resolve(route: ActivatedRouteSnapshot): Observable<ITypedocument | null | never> {
    const id = route.params['id'];
    if (id) {
      return this.service.find(id).pipe(
        mergeMap((typedocument: HttpResponse<ITypedocument>) => {
          if (typedocument.body) {
            return of(typedocument.body);
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
