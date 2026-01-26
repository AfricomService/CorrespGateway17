// src/main/webapp/app/entities/configManage/contact-company/list/contact-company.component.ts
import { Component, OnInit } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Data, ParamMap, Router } from '@angular/router';
import { combineLatest, filter, Observable, switchMap, tap } from 'rxjs';
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
   * Supprimer une personne (PersonCompany)
   * - confirme la suppression
   * - appelle l'API via PersonCompanyService.delete(id)
   * - met à jour l'affichage localement en retirant la personne du tableau
   */
  deletePerson(person: IPersonCompany): void {
    if (!person || person.id == null) {
      console.warn('deletePerson: id manquant', person);
      return;
    }

    if (!confirm('Confirmer la suppression du contact ?')) {
      return;
    }

    this.personCompanyService.delete(person.id).subscribe({
      next: () => {
        // Supprimer la personne du tableau local pour un feedback instantané
        if (this.contactCompanies && this.contactCompanies.length) {
          this.contactCompanies = this.contactCompanies.map(c => {
            if (c.personCompanies && c.personCompanies.length) {
              c.personCompanies = c.personCompanies.filter(p => p.id !== person.id);
            }
            return c;
          });
        }
      },
      error: err => {
        console.error('Erreur suppression personne', err);
        alert('Erreur lors de la suppression du contact.');
      },
    });
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

  protected queryBackend(page?: number, predicate?: string, ascending?: boolean): Observable<EntityArrayWithPersonsResponseType> {
    this.isLoading = true;
    const pageToLoad: number = page ?? 1;
    const queryObject = {
      page: pageToLoad - 1,
      size: this.itemsPerPage,
      sort: this.getSortQueryParam(predicate, ascending),
    };
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
}
