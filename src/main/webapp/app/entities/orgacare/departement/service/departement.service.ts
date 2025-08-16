import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import dayjs from 'dayjs/esm';

import { isPresent } from 'app/core/util/operators';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { createRequestOption } from 'app/core/request/request-util';
import { IDepartement, NewDepartement } from '../departement.model';

export type PartialUpdateDepartement = Partial<IDepartement> & Pick<IDepartement, 'id'>;

type RestOf<T extends IDepartement | NewDepartement> = Omit<T, 'createdDate' | 'updatedDate'> & {
  createdDate?: string | null;
  updatedDate?: string | null;
};

export type RestDepartement = RestOf<IDepartement>;

export type NewRestDepartement = RestOf<NewDepartement>;

export type PartialUpdateRestDepartement = RestOf<PartialUpdateDepartement>;

export type EntityResponseType = HttpResponse<IDepartement>;
export type EntityArrayResponseType = HttpResponse<IDepartement[]>;

@Injectable({ providedIn: 'root' })
export class DepartementService {
  protected resourceUrl = this.applicationConfigService.getEndpointFor('api/departements', 'orgacare');

  constructor(protected http: HttpClient, protected applicationConfigService: ApplicationConfigService) {}

  create(departement: NewDepartement): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(departement);
    return this.http
      .post<RestDepartement>(this.resourceUrl, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  update(departement: IDepartement): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(departement);
    return this.http
      .put<RestDepartement>(`${this.resourceUrl}/${this.getDepartementIdentifier(departement)}`, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  partialUpdate(departement: PartialUpdateDepartement): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(departement);
    return this.http
      .patch<RestDepartement>(`${this.resourceUrl}/${this.getDepartementIdentifier(departement)}`, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  find(id: number): Observable<EntityResponseType> {
    return this.http
      .get<RestDepartement>(`${this.resourceUrl}/${id}`, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  query(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http
      .get<RestDepartement[]>(this.resourceUrl, { params: options, observe: 'response' })
      .pipe(map(res => this.convertResponseArrayFromServer(res)));
  }

  delete(id: number): Observable<HttpResponse<{}>> {
    return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  getDepartementIdentifier(departement: Pick<IDepartement, 'id'>): number {
    return departement.id;
  }

  compareDepartement(o1: Pick<IDepartement, 'id'> | null, o2: Pick<IDepartement, 'id'> | null): boolean {
    return o1 && o2 ? this.getDepartementIdentifier(o1) === this.getDepartementIdentifier(o2) : o1 === o2;
  }

  addDepartementToCollectionIfMissing<Type extends Pick<IDepartement, 'id'>>(
    departementCollection: Type[],
    ...departementsToCheck: (Type | null | undefined)[]
  ): Type[] {
    const departements: Type[] = departementsToCheck.filter(isPresent);
    if (departements.length > 0) {
      const departementCollectionIdentifiers = departementCollection.map(
        departementItem => this.getDepartementIdentifier(departementItem)!
      );
      const departementsToAdd = departements.filter(departementItem => {
        const departementIdentifier = this.getDepartementIdentifier(departementItem);
        if (departementCollectionIdentifiers.includes(departementIdentifier)) {
          return false;
        }
        departementCollectionIdentifiers.push(departementIdentifier);
        return true;
      });
      return [...departementsToAdd, ...departementCollection];
    }
    return departementCollection;
  }

  protected convertDateFromClient<T extends IDepartement | NewDepartement | PartialUpdateDepartement>(departement: T): RestOf<T> {
    return {
      ...departement,
      createdDate: departement.createdDate?.toJSON() ?? null,
      updatedDate: departement.updatedDate?.toJSON() ?? null,
    };
  }

  protected convertDateFromServer(restDepartement: RestDepartement): IDepartement {
    return {
      ...restDepartement,
      createdDate: restDepartement.createdDate ? dayjs(restDepartement.createdDate) : undefined,
      updatedDate: restDepartement.updatedDate ? dayjs(restDepartement.updatedDate) : undefined,
    };
  }

  protected convertResponseFromServer(res: HttpResponse<RestDepartement>): HttpResponse<IDepartement> {
    return res.clone({
      body: res.body ? this.convertDateFromServer(res.body) : null,
    });
  }

  protected convertResponseArrayFromServer(res: HttpResponse<RestDepartement[]>): HttpResponse<IDepartement[]> {
    return res.clone({
      body: res.body ? res.body.map(item => this.convertDateFromServer(item)) : null,
    });
  }
}
