// src/main/webapp/app/entities/configManage/contact-company/service/contact-company.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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
export type BlobResponseType = HttpResponse<Blob>;

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
   * Toggle activation for a ContactCompany (Actif <-> Desactivated).
   * Backend endpoint: PUT /api/contact-companies/{id}/toggle-activation
   * returns the updated ContactCompany DTO.
   */
  toggleActivation(id: number): Observable<EntityResponseType> {
    return this.http.put<IContactCompany>(`${this.resourceUrl}/${id}/toggle-activation`, null, { observe: 'response' });
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

  /**
   * NOUVEAU : appelle l'endpoint de recherche backend :
   * GET /api/contact-companies/search?query=...&includeDelated=... + pagination params
   */
  search(query: string, includeDelated = false, req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    // createRequestOption retourne HttpParams ; on y ajoute query et includeDelated
    let params = options;
    params = params.set('query', query);
    params = params.set('includeDelated', String(includeDelated));
    return this.http.get<IContactCompany[]>(`${this.resourceUrl}/search`, { params, observe: 'response' });
  }

  /**
   * NOUVEAU : récupérer toutes les personnes (non paginées) d'une société
   * GET /api/contact-companies/{id}/person-companies/all
   */
  getAllPersonCompanies(contactCompanyId: number): Observable<HttpResponse<IPersonCompany[]>> {
    return this.http.get<IPersonCompany[]>(`${this.resourceUrl}/${contactCompanyId}/person-companies/all`, {
      observe: 'response',
    });
  }

  /**
   * NOUVEAU : appeler l'endpoint d'export Excel (backend renvoie un blob)
   * GET /api/contact-companies/export/excel
   *
   * Renvoie la HttpResponse<Blob> (observe: 'response') pour permettre de lire les headers
   * (Content-Disposition) côté composant et déclencher le téléchargement.
   */
  exportExcel(): Observable<BlobResponseType> {
    // -> observe: 'response' pour pouvoir lire les headers (Content-Disposition)
    // TypeScript typing quirk : on cast en HttpResponse<Blob>
    return this.http.get(`${this.resourceUrl}/export/excel`, {
      observe: 'response',
      responseType: 'blob' as 'json',
    }) as Observable<BlobResponseType>;
  }

  /**
   * Méthode utilitaire : appelle l'export et extrait également le nom de fichier depuis le header
   * Content-Disposition si disponible. Utile pour le composant qui veut lancer le téléchargement
   * avec le nom correct.
   *
   * Retourne un objet { blob, filename }.
   */
  exportExcelWithFilename(): Observable<{ blob: Blob; filename: string | null }> {
    return this.exportExcel().pipe(
      map(res => {
        const blob = res.body as Blob;
        let filename: string | null = null;
        const cd = (res.headers && (res.headers.get('content-disposition') || res.headers.get('Content-Disposition'))) || '';

        if (cd) {
          // Try RFC5987 (filename*=UTF-8'') first
          const fnStarMatch = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(cd);
          if (fnStarMatch && fnStarMatch[1]) {
            try {
              filename = decodeURIComponent(fnStarMatch[1]);
            } catch (e) {
              filename = fnStarMatch[1];
            }
          } else {
            // fallback to filename="..."
            const fnMatch = /filename[^;=\n]*=(?:\"([^\"\n]*)\"|([^;\n]*))/i.exec(cd);
            if (fnMatch) {
              filename = fnMatch[1] || fnMatch[2] || null;
              if (filename) {
                filename = filename.replace(/^"(.*)"$/, '$1'); // strip quotes
              }
            }
          }
        }

        return { blob, filename };
      })
    );
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
