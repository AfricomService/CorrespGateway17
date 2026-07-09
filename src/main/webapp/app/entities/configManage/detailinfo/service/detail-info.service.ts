import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

import { isPresent } from 'app/core/util/operators';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { createRequestOption } from 'app/core/request/request-util';
import { IDetailInfo, NewDetailInfo } from '../detail-info.model';

export type PartialUpdateDetailInfo = Partial<IDetailInfo> & Pick<IDetailInfo, 'id'>;

export type EntityResponseType = HttpResponse<IDetailInfo>;
export type EntityArrayResponseType = HttpResponse<IDetailInfo[]>;

@Injectable({ providedIn: 'root' })
export class DetailInfoService {
  protected resourceUrl = this.applicationConfigService.getEndpointFor('api/detail-infos', 'configmanage');

  constructor(protected http: HttpClient, protected applicationConfigService: ApplicationConfigService) {}

  create(detailInfo: NewDetailInfo): Observable<EntityResponseType> {
    return this.http.post<IDetailInfo>(this.resourceUrl, detailInfo, { observe: 'response' });
  }

  update(detailInfo: IDetailInfo): Observable<EntityResponseType> {
    return this.http.put<IDetailInfo>(`${this.resourceUrl}/${this.getDetailInfoIdentifier(detailInfo)}`, detailInfo, {
      observe: 'response',
    });
  }

  partialUpdate(detailInfo: PartialUpdateDetailInfo): Observable<EntityResponseType> {
    return this.http.patch<IDetailInfo>(`${this.resourceUrl}/${this.getDetailInfoIdentifier(detailInfo)}`, detailInfo, {
      observe: 'response',
    });
  }

  find(id: number): Observable<EntityResponseType> {
    return this.http.get<IDetailInfo>(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  query(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http.get<IDetailInfo[]>(this.resourceUrl, { params: options, observe: 'response' });
  }

  delete(id: number): Observable<HttpResponse<{}>> {
    return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  getDetailInfoIdentifier(detailInfo: Pick<IDetailInfo, 'id'>): number {
    return detailInfo.id;
  }

  compareDetailInfo(o1: Pick<IDetailInfo, 'id'> | null, o2: Pick<IDetailInfo, 'id'> | null): boolean {
    return o1 && o2 ? this.getDetailInfoIdentifier(o1) === this.getDetailInfoIdentifier(o2) : o1 === o2;
  }

  addDetailInfoToCollectionIfMissing<Type extends Pick<IDetailInfo, 'id'>>(
    detailInfoCollection: Type[],
    ...detailInfosToCheck: (Type | null | undefined)[]
  ): Type[] {
    const detailInfos: Type[] = detailInfosToCheck.filter(isPresent);
    if (detailInfos.length > 0) {
      const detailInfoCollectionIdentifiers = detailInfoCollection.map(detailInfoItem => this.getDetailInfoIdentifier(detailInfoItem)!);
      const detailInfosToAdd = detailInfos.filter(detailInfoItem => {
        const detailInfoIdentifier = this.getDetailInfoIdentifier(detailInfoItem);
        if (detailInfoCollectionIdentifiers.includes(detailInfoIdentifier)) {
          return false;
        }
        detailInfoCollectionIdentifiers.push(detailInfoIdentifier);
        return true;
      });
      return [...detailInfosToAdd, ...detailInfoCollection];
    }
    return detailInfoCollection;
  }
}
