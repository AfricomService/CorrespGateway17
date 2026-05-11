import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { ActivatedRoute, Data, ParamMap, Router } from '@angular/router';
import { combineLatest, Observable, forkJoin, of } from 'rxjs';
import { filter, switchMap, tap, map, catchError } from 'rxjs/operators';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

import { IContactCompany, IContactCompanyWithPersons } from 'app/entities/configManage/contact-company/contact-company.model';
import { IPersonCompany } from 'app/entities/configManage/person-company/person-company.model';
import { PersonCompanyService } from 'app/entities/configManage/person-company/service/person-company.service';

import { ITEMS_PER_PAGE, PAGE_HEADER, TOTAL_COUNT_RESPONSE_HEADER } from 'app/config/pagination.constants';
import { ASC, DESC, SORT, ITEM_DELETED_EVENT, DEFAULT_SORT_DATA } from 'app/config/navigation.constants';
import { EntityArrayWithPersonsResponseType, ContactCompanyService } from '../service/contact-company.service';
import { ContactCompanyDeleteDialogComponent } from '../delete/contact-company-delete-dialog.component';
import { PersonCompanyDeleteDialogComponent } from 'app/entities/configManage/person-company/delete/person-company-delete-dialog.component';
import { Authority } from 'app/config/authority.constants';

// TranslateService
import { TranslateService } from '@ngx-translate/core';

type ContactWithState = IContactCompanyWithPersons & { expanded?: boolean };

@Component({
  selector: 'jhi-contact-company',
  templateUrl: './contact-company.component.html',
  styleUrls: ['./contact-company.component.scss'],
})
export class ContactCompanyComponent implements OnInit {
  public readonly Authority = Authority;

  contactCompanies?: ContactWithState[];
  isLoading = false;

  predicate = 'id';
  ascending = true;

  itemsPerPage = ITEMS_PER_PAGE;
  totalItems = 0;
  page = 1;

  searchTerm = '';

  // modal template reference for etat change
  @ViewChild('etatModal') etatModal!: TemplateRef<any>;
  protected currentModalRef?: NgbModalRef;
  protected modalContext: {
    type: 'company' | 'person';
    id: number;
    name: string;
    action: 'activate' | 'deactivate';
    actionLabel?: string;
  } | null = null;

  // --- Import Excel ---
  @ViewChild('importModal') importModal!: TemplateRef<any>;
  selectedFile: File | null = null;
  isLoadingTemplate = false;
  isImporting = false;
  isDragOver = false;
  importResult: { created: number; skipped: number; errors: string[] } | null = null;

  constructor(
    protected contactCompanyService: ContactCompanyService,
    protected activatedRoute: ActivatedRoute,
    public router: Router,
    protected modalService: NgbModal,
    protected personCompanyService: PersonCompanyService,
    protected translate: TranslateService
  ) {}

  trackId = (_index: number, item: IContactCompany): number => this.contactCompanyService.getContactCompanyIdentifier(item);

  ngOnInit(): void {
    this.load();
  }

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

  toggle(contact: ContactWithState): void {
    contact.expanded = !contact.expanded;
  }

  personCount(contact: ContactWithState): number {
    return (contact.personCompanies && contact.personCompanies.length) || 0;
  }

  navigateToWithComponentValues(): void {
    this.handleNavigation(this.page, this.predicate, this.ascending);
  }

  navigateToPage(page = this.page): void {
    this.handleNavigation(page, this.predicate, this.ascending);
  }

  /**
   * Supprimer (soft-delete) une personne (PersonCompany)
   * Ouvre le modal PersonCompanyDeleteDialogComponent.
   * Si modal renvoie ITEM_DELETED_EVENT, on recharge la liste depuis le backend (pour garder la cohérence).
   */
  deletePerson(person: IPersonCompany): void {
    if (!person || person.id == null) {
      console.warn('deletePerson: id manquant', person);
      return;
    }

    const modalRef = this.modalService.open(PersonCompanyDeleteDialogComponent, { size: 'lg', backdrop: 'static' });
    modalRef.componentInstance.personCompany = person;

    modalRef.closed
      .pipe(
        filter((reason: any) => reason && reason.event === ITEM_DELETED_EVENT),
        switchMap(() => this.loadFromBackendWithRouteInformations())
      )
      .subscribe({
        next: (res: EntityArrayWithPersonsResponseType) => {
          this.onResponseSuccess(res);
        },
        error: err => {
          console.error('Erreur lors du rechargement après suppression de la personne', err);
          // fallback local
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
        },
      });
  }

  // ============================
  // Modal-based activation flow
  // ============================
  openEtatModalForCompany(contact: ContactWithState): void {
    if (!contact || contact.id == null) {
      console.warn('openEtatModalForCompany: contact manquant', contact);
      return;
    }
    if (contact.etat === 'Delated') {
      alert(this.translate.instant('correspCareApp.contactCompany.errors.cannotChangeDelated'));
      return;
    }

    const action: 'activate' | 'deactivate' = contact.etat === 'Actif' ? 'deactivate' : 'activate';
    const actionLabel = this.translate.instant('correspCareApp.contactCompany.action.' + action);

    this.modalContext = {
      type: 'company',
      id: contact.id,
      name: contact.nom ?? '—',
      action,
      actionLabel,
    };
    this.currentModalRef = this.modalService.open(this.etatModal, { centered: true, backdrop: 'static' });
  }

  openEtatModalForPerson(person: IPersonCompany): void {
    if (!person || person.id == null) {
      console.warn('openEtatModalForPerson: person manquant', person);
      return;
    }
    if (person.etat === 'Delated') {
      alert(this.translate.instant('correspCareApp.contactCompany.errors.cannotChangeDelated'));
      return;
    }

    const action: 'activate' | 'deactivate' = person.etat === 'Actif' ? 'deactivate' : 'activate';
    const actionLabel = this.translate.instant('correspCareApp.contactCompany.action.' + action);

    this.modalContext = {
      type: 'person',
      id: person.id,
      name: person.nom ?? '—',
      action,
      actionLabel,
    };
    this.currentModalRef = this.modalService.open(this.etatModal, { centered: true, backdrop: 'static' });
  }

  confirmToggle(): void {
    if (!this.modalContext) {
      return;
    }
    const ctx = this.modalContext;

    if (ctx.type === 'company') {
      this.contactCompanyService.toggleActivation(ctx.id).subscribe({
        next: res => {
          this.currentModalRef?.close();
          // reload list to keep consistency
          this.loadFromBackendWithRouteInformations().subscribe({
            next: (resp: EntityArrayWithPersonsResponseType) => this.onResponseSuccess(resp),
            error: err => {
              console.error('Erreur rechargement après toggle company', err);
            },
          });
        },
        error: err => {
          console.error('Erreur lors du toggleActivation (company)', err);
          alert(
            this.translate.instant('correspCareApp.contactCompany.errors.toggleFailed') || "Erreur lors du changement d'état de la société."
          );
          this.currentModalRef?.dismiss(err);
        },
      });
      return;
    }

    // person
    this.personCompanyService.toggleEtat(ctx.id).subscribe({
      next: res => {
        this.currentModalRef?.close();
        this.loadFromBackendWithRouteInformations().subscribe({
          next: (resp: EntityArrayWithPersonsResponseType) => this.onResponseSuccess(resp),
          error: err => {
            console.error('Erreur rechargement après toggle person', err);
          },
        });
      },
      error: err => {
        console.error('Erreur lors du toggleEtat (person)', err);
        alert(
          this.translate.instant('correspCareApp.contactCompany.errors.toggleFailed') || "Erreur lors du changement d'état du contact."
        );
        this.currentModalRef?.dismiss(err);
      },
    });
  }

  cancelModal(): void {
    this.currentModalRef?.dismiss();
  }
  // ============================
  // End modal-based activation
  // ============================

  toggleActivation(contactCompany: ContactWithState): void {
    // kept for compatibility (not used by template when using modal)
    if (!contactCompany || contactCompany.id == null) {
      console.warn('toggleActivation: id manquant', contactCompany);
      return;
    }

    if (contactCompany.etat === 'Delated') {
      alert(this.translate.instant('correspCareApp.contactCompany.errors.cannotChangeDelated'));
      return;
    }

    const wantTo = contactCompany.etat === 'Actif' ? 'désactiver' : 'activer';
    if (
      !confirm(
        this.translate.instant('correspCareApp.contactCompany.modal.confirm.company', { action: wantTo, name: contactCompany.nom ?? '—' })
      )
    ) {
      return;
    }

    this.contactCompanyService.toggleActivation(contactCompany.id).subscribe({
      next: res => {
        const updated = res.body;
        if (!updated) {
          this.load();
          return;
        }

        if (this.contactCompanies && this.contactCompanies.length) {
          this.contactCompanies = this.contactCompanies.map(c => {
            if (c.id === updated.id) {
              const newC: ContactWithState = {
                ...c,
                etat: updated.etat,
              };

              if (newC.personCompanies && newC.personCompanies.length) {
                newC.personCompanies = newC.personCompanies.map(p => {
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
        alert(
          this.translate.instant('correspCareApp.contactCompany.errors.toggleFailed') || "Erreur lors du changement d'état de la société."
        );
      },
    });
  }

  togglePersonActivation(person: IPersonCompany): void {
    // kept for compatibility (not used by template when using modal)
    if (!person || person.id == null) {
      console.warn('togglePersonActivation: id manquant', person);
      return;
    }

    if (person.etat === 'Delated') {
      alert(this.translate.instant('correspCareApp.contactCompany.errors.cannotChangeDelated'));
      return;
    }

    const wantTo = person.etat === 'Actif' ? 'désactiver' : 'activer';
    if (
      !confirm(this.translate.instant('correspCareApp.contactCompany.modal.confirm.person', { action: wantTo, name: person.nom ?? '—' }))
    ) {
      return;
    }

    this.personCompanyService.toggleEtat(person.id).subscribe({
      next: res => {
        const updated = res.body;
        if (updated && updated.id != null) {
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
        alert(
          this.translate.instant('correspCareApp.contactCompany.errors.toggleFailed') || "Erreur lors du changement d'état du contact."
        );
      },
    });
  }

  exportExcel(): void {
    if (this.isLoading) {
      return;
    }
    this.isLoading = true;
    this.contactCompanyService.exportExcel().subscribe({
      next: (res: HttpResponse<Blob>) => {
        const blob = res.body;
        if (!blob) {
          alert(this.translate.instant('correspCareApp.contactCompany.export.noFile') || 'Aucun fichier reçu.');
          this.isLoading = false;
          return;
        }

        const filename = this.extractFilename(res.headers) ?? `contact_companies_${new Date().toISOString().replace(/[:.]/g, '-')}.xlsx`;
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
        alert(this.translate.instant('correspCareApp.contactCompany.export.failed') || "Erreur lors de l'export Excel.");
        this.isLoading = false;
      },
    });
  }

  protected extractFilename(headers: HttpHeaders): string | null {
    const contentDisposition = headers.get('content-disposition') || headers.get('Content-Disposition');
    if (!contentDisposition) {
      return null;
    }
    const result = /filename\*?=(?:UTF-8'')?["']?([^;"']+)["']?/.exec(contentDisposition);
    if (result && result[1]) {
      try {
        return decodeURIComponent(result[1].replace(/['"]/g, ''));
      } catch (e) {
        return result[1].replace(/['"]/g, '');
      }
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

  protected queryBackend(page?: number, predicate?: string, ascending?: boolean): Observable<EntityArrayWithPersonsResponseType> {
    this.isLoading = true;
    const pageToLoad: number = page ?? 1;
    const queryObject = {
      page: pageToLoad - 1,
      size: this.itemsPerPage,
      sort: this.getSortQueryParam(predicate, ascending),
    };

    const trimmed = (this.searchTerm ?? '').trim();
    if (trimmed.length > 0) {
      return this.contactCompanyService.search(trimmed, false, queryObject).pipe(
        switchMap(res => {
          const companies = res.body ?? [];
          if (!companies || companies.length === 0) {
            return of(
              new HttpResponse({ body: [], headers: res.headers, status: res.status })
            ) as unknown as Observable<EntityArrayWithPersonsResponseType>;
          }
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
                return {
                  ...(r.company as any),
                  personCompanies: r.persons,
                } as IContactCompanyWithPersons;
              });
              return new HttpResponse({
                body: combined,
                headers: res.headers,
                status: res.status,
              }) as unknown as EntityArrayWithPersonsResponseType;
            })
          );
        }),
        tap(() => (this.isLoading = false))
      );
    }

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

  openImportModal(): void {
    this.selectedFile = null;
    this.importResult = null;
    this.modalService.open(this.importModal, { size: 'lg', backdrop: 'static' });
  }

  downloadImportTemplate(): void {
    this.isLoadingTemplate = true;
    this.contactCompanyService.downloadImportTemplate().subscribe({
      next: res => {
        const blob = res.body!;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'modele_import_societes.xlsx';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        this.isLoadingTemplate = false;
      },
      error: () => {
        alert('Erreur lors du téléchargement du modèle.');
        this.isLoadingTemplate = false;
      },
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedFile = input.files[0];
      this.importResult = null;
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    const file = event.dataTransfer?.files[0];
    if (file && file.name.endsWith('.xlsx')) {
      this.selectedFile = file;
      this.importResult = null;
    }
  }

  submitImport(): void {
    if (!this.selectedFile) return;
    this.isImporting = true;
    this.importResult = null;

    this.contactCompanyService.importFromExcel(this.selectedFile).subscribe({
      next: result => {
        this.importResult = result;
        this.isImporting = false;
        this.selectedFile = null;
        // Recharger la liste si au moins une société a été créée
        if (result.created > 0) {
          this.load();
        }
      },
      error: () => {
        alert("Erreur lors de l'import.");
        this.isImporting = false;
      },
    });
  }
}
