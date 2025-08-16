import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

import { isPresent } from 'app/core/util/operators';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { createRequestOption } from 'app/core/request/request-util';
import { IEmploye, NewEmploye } from '../employe.model';

export type PartialUpdateEmploye = Partial<IEmploye> & Pick<IEmploye, 'id'>;

export type EntityResponseType = HttpResponse<IEmploye>;
export type EntityArrayResponseType = HttpResponse<IEmploye[]>;

@Injectable({ providedIn: 'root' })
export class EmployeService {
  protected resourceUrl = this.applicationConfigService.getEndpointFor('api/employes');

  constructor(protected http: HttpClient, protected applicationConfigService: ApplicationConfigService) {}

  create(employe: NewEmploye): Observable<EntityResponseType> {
    return this.http.post<IEmploye>(this.resourceUrl, employe, { observe: 'response' });
  }

  update(employe: IEmploye): Observable<EntityResponseType> {
    return this.http.put<IEmploye>(`${this.resourceUrl}/${this.getEmployeIdentifier(employe)}`, employe, { observe: 'response' });
  }

  partialUpdate(employe: PartialUpdateEmploye): Observable<EntityResponseType> {
    return this.http.patch<IEmploye>(`${this.resourceUrl}/${this.getEmployeIdentifier(employe)}`, employe, { observe: 'response' });
  }

  find(id: number): Observable<EntityResponseType> {
    return this.http.get<IEmploye>(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  query(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http.get<IEmploye[]>(this.resourceUrl, { params: options, observe: 'response' });
  }

  delete(id: number): Observable<HttpResponse<{}>> {
    return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  getEmployeIdentifier(employe: Pick<IEmploye, 'id'>): number {
    return employe.id;
  }

  compareEmploye(o1: Pick<IEmploye, 'id'> | null, o2: Pick<IEmploye, 'id'> | null): boolean {
    return o1 && o2 ? this.getEmployeIdentifier(o1) === this.getEmployeIdentifier(o2) : o1 === o2;
  }

  addEmployeToCollectionIfMissing<Type extends Pick<IEmploye, 'id'>>(
    employeCollection: Type[],
    ...employesToCheck: (Type | null | undefined)[]
  ): Type[] {
    const employes: Type[] = employesToCheck.filter(isPresent);
    if (employes.length > 0) {
      const employeCollectionIdentifiers = employeCollection.map(employeItem => this.getEmployeIdentifier(employeItem)!);
      const employesToAdd = employes.filter(employeItem => {
        const employeIdentifier = this.getEmployeIdentifier(employeItem);
        if (employeCollectionIdentifiers.includes(employeIdentifier)) {
          return false;
        }
        employeCollectionIdentifiers.push(employeIdentifier);
        return true;
      });
      return [...employesToAdd, ...employeCollection];
    }
    return employeCollection;
  }
}
