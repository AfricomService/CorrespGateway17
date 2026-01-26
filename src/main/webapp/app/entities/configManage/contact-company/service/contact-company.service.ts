// src/main/webapp/app/entities/configManage/contact-company/service/contact-company.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

import { isPresent } from 'app/core/util/operators';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { createRequestOption } from 'app/core/request/request-util';
import {
  IContactCompany,
  NewContactCompany,
  IContactCompanyWithPersons,
} from 'app/entities/configManage/contact-company/contact-company.model';
import { IPersonCompany } from 'app/entities/configManage/person-company/person-company.model';

export type PartialUpdateContactCompany = Partial<IContactCompany> & Pick<IContactCompany, 'id'>;

export type EntityResponseType = HttpResponse<IContactCompany>;
export type EntityArrayResponseType = HttpResponse<IContactCompany[]>;
export type EntityArrayWithPersonsResponseType = HttpResponse<IContactCompanyWithPersons[]>;

@Injectable({ providedIn: 'root' })
export class ContactCompanyService {
  protected resourceUrl = this.applicationConfigService.getEndpointFor('api/contact-companies', 'configmanage');

  constructor(protected http: HttpClient, protected applicationConfigService: ApplicationConfigService) {}

  create(contactCompany: NewContactCompany): Observable<EntityResponseType> {
    return this.http.post<IContactCompany>(this.resourceUrl, contactCompany, { observe: 'response' });
  }

  update(contactCompany: IContactCompany): Observable<EntityResponseType> {
    return this.http.put<IContactCompany>(`${this.resourceUrl}/${this.getContactCompanyIdentifier(contactCompany)}`, contactCompany, {
      observe: 'response',
    });
  }

  partialUpdate(contactCompany: PartialUpdateContactCompany): Observable<EntityResponseType> {
    return this.http.patch<IContactCompany>(`${this.resourceUrl}/${this.getContactCompanyIdentifier(contactCompany)}`, contactCompany, {
      observe: 'response',
    });
  }

  find(id: number): Observable<EntityResponseType> {
    return this.http.get<IContactCompany>(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  query(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http.get<IContactCompany[]>(this.resourceUrl, { params: options, observe: 'response' });
  }

  delete(id: number): Observable<HttpResponse<{}>> {
    return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  markAsDelated(id: number): Observable<EntityResponseType> {
    // on n'envoie pas de body, backend retourne le ContactCompany mis à jour
    return this.http.put<IContactCompany>(`${this.resourceUrl}/${id}/delate`, null, { observe: 'response' });
  }

  /**
   * Récupère la liste des ContactCompany avec la clé `personCompanies` jointe.
   * Le backend renvoie un tableau d'objets où chaque objet contient les champs du ContactCompany
   * et la propriété personCompanies (liste).
   */
  queryWithPersons(req?: any): Observable<EntityArrayWithPersonsResponseType> {
    const options = createRequestOption(req);
    return this.http.get<IContactCompanyWithPersons[]>(this.resourceUrl, { params: options, observe: 'response' });
  }

  getContactCompanyIdentifier(contactCompany: Pick<IContactCompany, 'id'>): number {
    return contactCompany.id;
  }

  compareContactCompany(o1: Pick<IContactCompany, 'id'> | null, o2: Pick<IContactCompany, 'id'> | null): boolean {
    return o1 && o2 ? this.getContactCompanyIdentifier(o1) === this.getContactCompanyIdentifier(o2) : o1 === o2;
  }

  addContactCompanyToCollectionIfMissing<Type extends Pick<IContactCompany, 'id'>>(
    contactCompanyCollection: Type[],
    ...contactCompaniesToCheck: (Type | null | undefined)[]
  ): Type[] {
    const contactCompanies: Type[] = contactCompaniesToCheck.filter(isPresent);
    if (contactCompanies.length > 0) {
      const contactCompanyCollectionIdentifiers = contactCompanyCollection.map(
        contactCompanyItem => this.getContactCompanyIdentifier(contactCompanyItem)!
      );
      const contactCompaniesToAdd = contactCompanies.filter(contactCompanyItem => {
        const contactCompanyIdentifier = this.getContactCompanyIdentifier(contactCompanyItem);
        if (contactCompanyCollectionIdentifiers.includes(contactCompanyIdentifier)) {
          return false;
        }
        contactCompanyCollectionIdentifiers.push(contactCompanyIdentifier);
        return true;
      });
      return [...contactCompaniesToAdd, ...contactCompanyCollection];
    }
    return contactCompanyCollection;
  }
}
