import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import dayjs from 'dayjs/esm';

import { isPresent } from 'app/core/util/operators';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { createRequestOption } from 'app/core/request/request-util';
import { IOrgaEntity, NewOrgaEntity } from '../orga-entity.model';

export type PartialUpdateOrgaEntity = Partial<IOrgaEntity> & Pick<IOrgaEntity, 'id'>;

type RestOf<T extends IOrgaEntity | NewOrgaEntity> = Omit<T, 'createdDate' | 'updatedDate'> & {
  createdDate?: string | null;
  updatedDate?: string | null;
};

export type RestOrgaEntity = RestOf<IOrgaEntity>;

export type NewRestOrgaEntity = RestOf<NewOrgaEntity>;

export type PartialUpdateRestOrgaEntity = RestOf<PartialUpdateOrgaEntity>;

export type EntityResponseType = HttpResponse<IOrgaEntity>;
export type EntityArrayResponseType = HttpResponse<IOrgaEntity[]>;

@Injectable({ providedIn: 'root' })
export class OrgaEntityService {
  protected resourceUrl = this.applicationConfigService.getEndpointFor('api/orga-entities', 'orgacarecorresp');

  constructor(protected http: HttpClient, protected applicationConfigService: ApplicationConfigService) {}

  create(orgaEntity: NewOrgaEntity): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(orgaEntity);
    return this.http
      .post<RestOrgaEntity>(this.resourceUrl, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  update(orgaEntity: IOrgaEntity): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(orgaEntity);
    return this.http
      .put<RestOrgaEntity>(`${this.resourceUrl}/${this.getOrgaEntityIdentifier(orgaEntity)}`, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  partialUpdate(orgaEntity: PartialUpdateOrgaEntity): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(orgaEntity);
    return this.http
      .patch<RestOrgaEntity>(`${this.resourceUrl}/${this.getOrgaEntityIdentifier(orgaEntity)}`, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  find(id: number): Observable<EntityResponseType> {
    return this.http
      .get<RestOrgaEntity>(`${this.resourceUrl}/${id}`, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  query(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http
      .get<RestOrgaEntity[]>(this.resourceUrl, { params: options, observe: 'response' })
      .pipe(map(res => this.convertResponseArrayFromServer(res)));
  }

  delete(id: number): Observable<HttpResponse<{}>> {
    return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  getOrgaEntityIdentifier(orgaEntity: Pick<IOrgaEntity, 'id'>): number {
    return orgaEntity.id;
  }

  compareOrgaEntity(o1: Pick<IOrgaEntity, 'id'> | null, o2: Pick<IOrgaEntity, 'id'> | null): boolean {
    return o1 && o2 ? this.getOrgaEntityIdentifier(o1) === this.getOrgaEntityIdentifier(o2) : o1 === o2;
  }

  addOrgaEntityToCollectionIfMissing<Type extends Pick<IOrgaEntity, 'id'>>(
    orgaEntityCollection: Type[],
    ...orgaEntitiesToCheck: (Type | null | undefined)[]
  ): Type[] {
    const orgaEntities: Type[] = orgaEntitiesToCheck.filter(isPresent);
    if (orgaEntities.length > 0) {
      const orgaEntityCollectionIdentifiers = orgaEntityCollection.map(orgaEntityItem => this.getOrgaEntityIdentifier(orgaEntityItem)!);
      const orgaEntitiesToAdd = orgaEntities.filter(orgaEntityItem => {
        const orgaEntityIdentifier = this.getOrgaEntityIdentifier(orgaEntityItem);
        if (orgaEntityCollectionIdentifiers.includes(orgaEntityIdentifier)) {
          return false;
        }
        orgaEntityCollectionIdentifiers.push(orgaEntityIdentifier);
        return true;
      });
      return [...orgaEntitiesToAdd, ...orgaEntityCollection];
    }
    return orgaEntityCollection;
  }

  protected convertDateFromClient<T extends IOrgaEntity | NewOrgaEntity | PartialUpdateOrgaEntity>(orgaEntity: T): RestOf<T> {
    return {
      ...orgaEntity,
      createdDate: orgaEntity.createdDate?.toJSON() ?? null,
      updatedDate: orgaEntity.updatedDate?.toJSON() ?? null,
    };
  }

  protected convertDateFromServer(restOrgaEntity: RestOrgaEntity): IOrgaEntity {
    return {
      ...restOrgaEntity,
      createdDate: restOrgaEntity.createdDate ? dayjs(restOrgaEntity.createdDate) : undefined,
      updatedDate: restOrgaEntity.updatedDate ? dayjs(restOrgaEntity.updatedDate) : undefined,
    };
  }

  protected convertResponseFromServer(res: HttpResponse<RestOrgaEntity>): HttpResponse<IOrgaEntity> {
    return res.clone({
      body: res.body ? this.convertDateFromServer(res.body) : null,
    });
  }

  protected convertResponseArrayFromServer(res: HttpResponse<RestOrgaEntity[]>): HttpResponse<IOrgaEntity[]> {
    return res.clone({
      body: res.body ? res.body.map(item => this.convertDateFromServer(item)) : null,
    });
  }
}
