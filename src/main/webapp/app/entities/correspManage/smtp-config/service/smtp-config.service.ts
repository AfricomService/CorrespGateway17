import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

import { isPresent } from 'app/core/util/operators';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { createRequestOption } from 'app/core/request/request-util';
import { ISmtpConfig, NewSmtpConfig } from '../smtp-config.model';

export type PartialUpdateSmtpConfig = Partial<ISmtpConfig> & Pick<ISmtpConfig, 'id'>;

export type EntityResponseType = HttpResponse<ISmtpConfig>;
export type EntityArrayResponseType = HttpResponse<ISmtpConfig[]>;

@Injectable({ providedIn: 'root' })
export class SmtpConfigService {
  protected resourceUrl = this.applicationConfigService.getEndpointFor('api/smtp-configs', 'correspmanage');

  constructor(protected http: HttpClient, protected applicationConfigService: ApplicationConfigService) {}

  create(smtpConfig: NewSmtpConfig): Observable<EntityResponseType> {
    return this.http.post<ISmtpConfig>(this.resourceUrl, smtpConfig, { observe: 'response' });
  }

  update(smtpConfig: ISmtpConfig): Observable<EntityResponseType> {
    return this.http.put<ISmtpConfig>(`${this.resourceUrl}/${this.getSmtpConfigIdentifier(smtpConfig)}`, smtpConfig, {
      observe: 'response',
    });
  }

  partialUpdate(smtpConfig: PartialUpdateSmtpConfig): Observable<EntityResponseType> {
    return this.http.patch<ISmtpConfig>(`${this.resourceUrl}/${this.getSmtpConfigIdentifier(smtpConfig)}`, smtpConfig, {
      observe: 'response',
    });
  }

  find(id: number): Observable<EntityResponseType> {
    return this.http.get<ISmtpConfig>(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  query(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http.get<ISmtpConfig[]>(this.resourceUrl, { params: options, observe: 'response' });
  }

  delete(id: number): Observable<HttpResponse<{}>> {
    return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  getSmtpConfigIdentifier(smtpConfig: Pick<ISmtpConfig, 'id'>): number {
    return smtpConfig.id;
  }

  compareSmtpConfig(o1: Pick<ISmtpConfig, 'id'> | null, o2: Pick<ISmtpConfig, 'id'> | null): boolean {
    return o1 && o2 ? this.getSmtpConfigIdentifier(o1) === this.getSmtpConfigIdentifier(o2) : o1 === o2;
  }

  addSmtpConfigToCollectionIfMissing<Type extends Pick<ISmtpConfig, 'id'>>(
    smtpConfigCollection: Type[],
    ...smtpConfigsToCheck: (Type | null | undefined)[]
  ): Type[] {
    const smtpConfigs: Type[] = smtpConfigsToCheck.filter(isPresent);
    if (smtpConfigs.length > 0) {
      const smtpConfigCollectionIdentifiers = smtpConfigCollection.map(smtpConfigItem => this.getSmtpConfigIdentifier(smtpConfigItem)!);
      const smtpConfigsToAdd = smtpConfigs.filter(smtpConfigItem => {
        const smtpConfigIdentifier = this.getSmtpConfigIdentifier(smtpConfigItem);
        if (smtpConfigCollectionIdentifiers.includes(smtpConfigIdentifier)) {
          return false;
        }
        smtpConfigCollectionIdentifiers.push(smtpConfigIdentifier);
        return true;
      });
      return [...smtpConfigsToAdd, ...smtpConfigCollection];
    }
    return smtpConfigCollection;
  }
}
