import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

import { isPresent } from 'app/core/util/operators';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { createRequestOption } from 'app/core/request/request-util';
import { IPersonCompany, NewPersonCompany } from '../person-company.model';

export type PartialUpdatePersonCompany = Partial<IPersonCompany> & Pick<IPersonCompany, 'id'>;

export type EntityResponseType = HttpResponse<IPersonCompany>;
export type EntityArrayResponseType = HttpResponse<IPersonCompany[]>;

@Injectable({ providedIn: 'root' })
export class PersonCompanyService {
  protected resourceUrl = this.applicationConfigService.getEndpointFor('api/person-companies', 'configmanage');

  constructor(protected http: HttpClient, protected applicationConfigService: ApplicationConfigService) {}

  create(personCompany: NewPersonCompany): Observable<EntityResponseType> {
    return this.http.post<IPersonCompany>(this.resourceUrl, personCompany, { observe: 'response' });
  }

  update(personCompany: IPersonCompany): Observable<EntityResponseType> {
    return this.http.put<IPersonCompany>(`${this.resourceUrl}/${this.getPersonCompanyIdentifier(personCompany)}`, personCompany, {
      observe: 'response',
    });
  }

  partialUpdate(personCompany: PartialUpdatePersonCompany): Observable<EntityResponseType> {
    return this.http.patch<IPersonCompany>(`${this.resourceUrl}/${this.getPersonCompanyIdentifier(personCompany)}`, personCompany, {
      observe: 'response',
    });
  }

  find(id: number): Observable<EntityResponseType> {
    return this.http.get<IPersonCompany>(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  query(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http.get<IPersonCompany[]>(this.resourceUrl, { params: options, observe: 'response' });
  }

  delete(id: number): Observable<HttpResponse<{}>> {
    return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  getPersonCompanyIdentifier(personCompany: Pick<IPersonCompany, 'id'>): number {
    return personCompany.id;
  }

  comparePersonCompany(o1: Pick<IPersonCompany, 'id'> | null, o2: Pick<IPersonCompany, 'id'> | null): boolean {
    return o1 && o2 ? this.getPersonCompanyIdentifier(o1) === this.getPersonCompanyIdentifier(o2) : o1 === o2;
  }

  addPersonCompanyToCollectionIfMissing<Type extends Pick<IPersonCompany, 'id'>>(
    personCompanyCollection: Type[],
    ...personCompaniesToCheck: (Type | null | undefined)[]
  ): Type[] {
    const personCompanies: Type[] = personCompaniesToCheck.filter(isPresent);
    if (personCompanies.length > 0) {
      const personCompanyCollectionIdentifiers = personCompanyCollection.map(
        personCompanyItem => this.getPersonCompanyIdentifier(personCompanyItem)!
      );
      const personCompaniesToAdd = personCompanies.filter(personCompanyItem => {
        const personCompanyIdentifier = this.getPersonCompanyIdentifier(personCompanyItem);
        if (personCompanyCollectionIdentifiers.includes(personCompanyIdentifier)) {
          return false;
        }
        personCompanyCollectionIdentifiers.push(personCompanyIdentifier);
        return true;
      });
      return [...personCompaniesToAdd, ...personCompanyCollection];
    }
    return personCompanyCollection;
  }
}
