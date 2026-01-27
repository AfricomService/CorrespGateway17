import { Component, OnInit } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Data, ParamMap, Router } from '@angular/router';
import { combineLatest, Observable, forkJoin, of } from 'rxjs';
import { filter, switchMap, tap, map, catchError } from 'rxjs/operators';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { IContactCompany, IContactCompanyWithPersons } from 'app/entities/configManage/contact-company/contact-company.model';
import { IPersonCompany } from 'app/entities/configManage/person-company/person-company.model';
import { PersonCompanyService } from 'app/entities/configManage/person-company/service/person-company.service';

import { ITEMS_PER_PAGE, PAGE_HEADER, TOTAL_COUNT_RESPONSE_HEADER } from 'app/config/pagination.constants';
import { ASC, DESC, SORT, ITEM_DELETED_EVENT, DEFAULT_SORT_DATA } from 'app/config/navigation.constants';
import { EntityArrayWithPersonsResponseType, ContactCompanyService } from '../service/contact-company.service';
import { ContactCompanyDeleteDialogComponent } from '../delete/contact-company-delete-dialog.component';

type ContactWithState = IContactCompanyWithPersons & { expanded?: boolean };

@Component({
  selector: 'jhi-contact-company',
  templateUrl: './contact-company.component.html',
  styleUrls: ['./contact-company.component.scss'],
})
export class ContactCompanyComponent implements OnInit {
  contactCompanies?: ContactWithState[];
  isLoading = false;

  predicate = 'id';
  ascending = true;

  itemsPerPage = ITEMS_PER_PAGE;
  totalItems = 0;
  page = 1;

  searchTerm = '';

  constructor(
    protected contactCompanyService: ContactCompanyService,
    protected activatedRoute: ActivatedRoute,
    public router: Router,
    protected modalService: NgbModal,
    protected personCompanyService: PersonCompanyService
  ) {}

  // utilisé par *ngFor trackBy
  trackId = (_index: number, item: IContactCompany): number => this.contactCompanyService.getContactCompanyIdentifier(item);

  ngOnInit(): void {
    this.load();
  }

  /**
   * Ouvre le modal de confirmation existant (ContactCompanyDeleteDialogComponent).
   * Le modal appelle contactCompanyService.delete(id) — et nous écoutons ITEM_DELETED_EVENT pour recharger.
   */
  delete(contactCompany: IContactCompany): void {
    const modalRef = this.modalService.open(ContactCompanyDeleteDialogComponent, { size: 'lg', backdrop: 'static' });
    modalRef.componentInstance.contactCompany = contactCompany;
    modalRef.closed
      .pipe(
        filter(reason => reason === ITEM_DELETED_EVENT),
        switchMap(() => this.loadFromBackendWithRouteInformations())
      )
      .subscribe({
        next: (res: EntityArrayWithPersonsResponseType) => {
          this.onResponseSuccess(res);
        },
        error: err => {
          console.error('Erreur lors du rechargement après suppression/delate', err);
        },
      });
  }

  load(): void {
    this.loadFromBackendWithRouteInformations().subscribe({
      next: (res: EntityArrayWithPersonsResponseType) => {
        this.onResponseSuccess(res);
      },
    });
  }

  /** Ouvre / ferme l'affichage des personnes pour une société (appelé uniquement depuis le lien "X contact(s)") */
  toggle(contact: ContactWithState): void {
    contact.expanded = !contact.expanded;
  }

  personCount(contact: ContactWithState): number {
    return (contact.personCompanies && contact.personCompanies.length) || 0;
  }

  navigateToWithComponentValues(): void {
    this.handleNavigation(this.page, this.predicate, this.ascending);
  }

  // <-- méthode requise par le template : garde-la publique
  navigateToPage(page = this.page): void {
    this.handleNavigation(page, this.predicate, this.ascending);
  }

  /**
   * Supprimer (soft-delete) une personne (PersonCompany) via l'API delate
   * - confirme la suppression (soft)
   * - appelle l'API via PersonCompanyService.delate(id)
   * - met à jour localement la personne : etat = 'Delated'
   */
  deletePerson(person: IPersonCompany): void {
    if (!person || person.id == null) {
      console.warn('deletePerson: id manquant', person);
      return;
    }

    // si déjà delated, rien à faire
    if (person.etat === 'Delated') {
      alert('Ce contact est déjà supprimé.');
      return;
    }

    const name = person.nom ?? '—';
    // Message de confirmation qui affiche le nom de la personne
    if (!confirm(`Confirmer la suppression du contact avec le nom "${name}" ?`)) {
      return;
    }

    this.personCompanyService.delate(person.id).subscribe({
      next: res => {
        const updated = res.body;
        if (updated && updated.id != null) {
          // mettre à jour localement la personne trouvée
          if (this.contactCompanies && this.contactCompanies.length) {
            this.contactCompanies = this.contactCompanies.map(c => {
              if (c.personCompanies && c.personCompanies.length) {
                c.personCompanies = c.personCompanies.map(p => {
                  if (p.id === updated.id) {
                    return { ...p, etat: updated.etat } as IPersonCompany;
                  }
                  return p;
                });
              }
              return c;
            });
          }
        } else {
          // fallback: si aucune réponse body, marquer localement
          if (this.contactCompanies && this.contactCompanies.length) {
            this.contactCompanies = this.contactCompanies.map(c => {
              if (c.personCompanies && c.personCompanies.length) {
                c.personCompanies = c.personCompanies.map(p => {
                  if (p.id === person.id) {
                    return { ...p, etat: 'Delated' } as IPersonCompany;
                  }
                  return p;
                });
              }
              return c;
            });
          }
        }
      },
      error: err => {
        console.error('Erreur lors du soft-delete de la personne', err);
        alert('Erreur lors de la suppression du contact.');
      },
    });
  }

  /**
   * Bascule l'état (Actif <-> Desactivated) d'une société via l'API toggleActivation.
   * Met à jour localement la société et ses personnes (conforme à la logique backend).
   */
  toggleActivation(contactCompany: ContactWithState): void {
    if (!contactCompany || contactCompany.id == null) {
      console.warn('toggleActivation: id manquant', contactCompany);
      return;
    }

    // Ne pas permettre si Delated
    if (contactCompany.etat === 'Delated') {
      alert("Impossible de modifier l'état d'une société supprimée.");
      return;
    }

    const wantTo = contactCompany.etat === 'Actif' ? 'désactiver' : 'activer';
    if (!confirm(`Confirmer la ${wantTo} de la société "${contactCompany.nom}" ?`)) {
      return;
    }

    this.contactCompanyService.toggleActivation(contactCompany.id).subscribe({
      next: res => {
        const updated = res.body;
        if (!updated) {
          // fallback: recharger la liste
          this.load();
          return;
        }

        // Mettre à jour localement la société (etat)
        if (this.contactCompanies && this.contactCompanies.length) {
          this.contactCompanies = this.contactCompanies.map(c => {
            if (c.id === updated.id) {
              // update état
              const newC: ContactWithState = {
                ...c,
                etat: updated.etat,
              };

              // mettre à jour les personnes locales : si personne non Delated => prendre le même état
              if (newC.personCompanies && newC.personCompanies.length) {
                newC.personCompanies = newC.personCompanies.map(p => {
                  // si personne est Delated, on garde Delated
                  if (p.etat === 'Delated') {
                    return p;
                  }
                  return { ...p, etat: updated.etat } as IPersonCompany;
                });
              }

              return newC;
            }
            return c;
          });
        }
      },
      error: err => {
        console.error("Erreur lors du changement d'état", err);
        alert("Erreur lors du changement d'état de la société.");
      },
    });
  }

  /**
   * Bascule l'état Actif <-> Desactivated d'une personne via l'API toggleEtat.
   * Affiche confirmation et met à jour localement le contact dans la liste.
   */
  togglePersonActivation(person: IPersonCompany): void {
    if (!person || person.id == null) {
      console.warn('togglePersonActivation: id manquant', person);
      return;
    }

    // Ne pas permettre si Delated
    if (person.etat === 'Delated') {
      alert("Impossible de modifier l'état d'un contact supprimé.");
      return;
    }

    const wantTo = person.etat === 'Actif' ? 'désactiver' : 'activer';
    if (!confirm(`Confirmer la ${wantTo} du contact "${person.nom ?? '—'}" ?`)) {
      return;
    }

    this.personCompanyService.toggleEtat(person.id).subscribe({
      next: res => {
        const updated = res.body;
        if (updated && updated.id != null) {
          // mettre à jour la personne localement
          if (this.contactCompanies && this.contactCompanies.length) {
            this.contactCompanies = this.contactCompanies.map(c => {
              if (c.personCompanies && c.personCompanies.length) {
                c.personCompanies = c.personCompanies.map(p => {
                  if (p.id === updated.id) {
                    return { ...p, etat: updated.etat } as IPersonCompany;
                  }
                  return p;
                });
              }
              return c;
            });
          }
        } else {
          // fallback: si pas de body, inverse localement Actif <-> Desactivated
          if (this.contactCompanies && this.contactCompanies.length) {
            this.contactCompanies = this.contactCompanies.map(c => {
              if (c.personCompanies && c.personCompanies.length) {
                c.personCompanies = c.personCompanies.map(p => {
                  if (p.id === person.id) {
                    const newEtat = p.etat === 'Actif' ? 'Desactivated' : 'Actif';
                    return { ...p, etat: newEtat } as IPersonCompany;
                  }
                  return p;
                });
              }
              return c;
            });
          }
        }
      },
      error: err => {
        console.error("Erreur lors du changement d'état de la personne", err);
        alert("Erreur lors du changement d'état du contact.");
      },
    });
  }

  /**
   * Export Excel
   * Appelle le service exportExcel() qui renvoie un Blob + headers.
   * On recherche un filename dans Content-Disposition, sinon fallback.
   */
  exportExcel(): void {
    this.isLoading = true;
    this.contactCompanyService.exportExcel().subscribe({
      next: res => {
        const blob = res.body;
        if (!blob) {
          alert('Aucun fichier reçu.');
          this.isLoading = false;
          return;
        }

        const filename = this.extractFilename(res.headers) ?? 'contact_companies_no_ids.xlsx';
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);

        this.isLoading = false;
      },
      error: err => {
        console.error("Erreur lors de l'export Excel", err);
        alert("Erreur lors de l'export Excel.");
        this.isLoading = false;
      },
    });
  }

  /**
   * Extrait le filename depuis l'en-tête Content-Disposition si présent.
   */
  protected extractFilename(headers: HttpHeaders): string | null {
    const contentDisposition = headers.get('content-disposition') || headers.get('Content-Disposition');
    if (!contentDisposition) {
      return null;
    }
    // pattern robust pour filename="..." ou filename=...
    const result = /filename\*?=(?:UTF-8'')?["']?([^;"']+)["']?/.exec(contentDisposition);
    if (result && result[1]) {
      return decodeURIComponent(result[1].replace(/['"]/g, ''));
    }
    return null;
  }

  protected loadFromBackendWithRouteInformations(): Observable<EntityArrayWithPersonsResponseType> {
    return combineLatest([this.activatedRoute.queryParamMap, this.activatedRoute.data]).pipe(
      tap(([params, data]) => this.fillComponentAttributeFromRoute(params, data)),
      switchMap(() => this.queryBackend(this.page, this.predicate, this.ascending))
    );
  }

  protected fillComponentAttributeFromRoute(params: ParamMap, data: Data): void {
    const page = params.get(PAGE_HEADER);
    this.page = +(page ?? 1);
    const sort = (params.get(SORT) ?? data[DEFAULT_SORT_DATA]).split(',');
    this.predicate = sort[0];
    this.ascending = sort[1] === ASC;
  }

  protected onResponseSuccess(response: EntityArrayWithPersonsResponseType): void {
    this.fillComponentAttributesFromResponseHeader(response.headers);
    const list = response.body ?? [];
    this.contactCompanies = list.map(item => {
      const c: ContactWithState = {
        ...item,
        personCompanies: item.personCompanies ?? [],
        expanded: false,
      };
      return c;
    });
  }

  protected fillComponentAttributesFromResponseHeader(headers: HttpHeaders): void {
    this.totalItems = Number(headers.get(TOTAL_COUNT_RESPONSE_HEADER));
  }

  /**
   * QUERY BACKEND
   * - Si searchTerm présent : appelle /api/contact-companies/search, puis pour chaque résultat récupère
   *   /api/contact-companies/{id}/person-companies/all et combine persons -> renvoie la même structure
   *   attendue par onResponseSuccess (personCompanies inclus).
   * - Sinon : comportement historique (queryWithPersons)
   */
  protected queryBackend(page?: number, predicate?: string, ascending?: boolean): Observable<EntityArrayWithPersonsResponseType> {
    this.isLoading = true;
    const pageToLoad: number = page ?? 1;
    const queryObject = {
      page: pageToLoad - 1,
      size: this.itemsPerPage,
      sort: this.getSortQueryParam(predicate, ascending),
    };

    // Si searchTerm renseigné -> utiliser l'endpoint search
    const trimmed = (this.searchTerm ?? '').trim();
    if (trimmed.length > 0) {
      // appelle search endpoint
      return this.contactCompanyService.search(trimmed, false, queryObject).pipe(
        switchMap(res => {
          const companies = res.body ?? [];
          // aucun company trouvé -> renvoyer réponse vide avec mêmes headers
          if (!companies || companies.length === 0) {
            return of(
              new (Object.getPrototypeOf(res).constructor)({
                body: [] as any[],
                headers: res.headers,
                status: res.status,
              }) as EntityArrayWithPersonsResponseType
            );
          }

          // pour chaque company, récupérer person-companies/all
          const calls = companies.map(c =>
            this.contactCompanyService.getAllPersonCompanies((c as any).id!).pipe(
              map(personRes => {
                const persons = personRes.body ?? [];
                return { company: c, persons };
              }),
              catchError(() => of({ company: c, persons: [] }))
            )
          );

          return forkJoin(calls).pipe(
            map(results => {
              const combined = results.map(r => {
                // merge la company retournée avec personCompanies
                return {
                  ...(r.company as any),
                  personCompanies: r.persons,
                } as IContactCompanyWithPersons;
              });
              // retourner HttpResponse similaire pour onResponseSuccess
              return new (Object.getPrototypeOf(res).constructor)({
                body: combined,
                headers: res.headers,
                status: res.status,
              }) as EntityArrayWithPersonsResponseType;
            })
          );
        }),
        tap(() => (this.isLoading = false))
      );
    }

    // comportement par défaut (liste with persons fournie par backend)
    return this.contactCompanyService.queryWithPersons(queryObject).pipe(tap(() => (this.isLoading = false)));
  }

  protected handleNavigation(page = this.page, predicate?: string, ascending?: boolean): void {
    const queryParamsObj = {
      page,
      size: this.itemsPerPage,
      sort: this.getSortQueryParam(predicate, ascending),
    };

    this.router.navigate(['./'], {
      relativeTo: this.activatedRoute,
      queryParams: queryParamsObj,
    });
  }

  protected getSortQueryParam(predicate = this.predicate, ascending = this.ascending): string[] {
    const ascendingQueryParam = ascending ? ASC : DESC;
    if (predicate === '') {
      return [];
    } else {
      return [predicate + ',' + ascendingQueryParam];
    }
  }

  protected readonly Math = Math;

  /**
   * Retourne la classe CSS complète pour le badge d'une personne selon son état.
   * Exemples retournés : 'badge ms-2 bg-success text-white', 'badge ms-2 bg-warning text-dark', 'badge ms-2 bg-danger text-white'
   */
  public getPersonBadgeClasses(etat?: string | null): string {
    if (!etat) {
      return 'badge ms-2 bg-secondary text-white';
    }

    switch (etat) {
      case 'Actif':
        return 'badge ms-2 bg-success text-white';
      case 'Desactivated':
        return 'badge ms-2 bg-warning text-dark';
      case 'Delated':
        return 'badge ms-2 bg-danger text-white';
      default:
        return 'badge ms-2 bg-secondary text-white';
    }
  }
}
