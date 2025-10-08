import { Component, OnInit } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { CustomSearchFormService, CustomSearchFormGroup } from './custom-search-form.service';
import { ICustomSearch } from '../custom-search.model';
import { CustomSearchService } from '../service/custom-search.service';

@Component({
  selector: 'jhi-custom-search-update',
  templateUrl: './custom-search-update.component.html',
})
export class CustomSearchUpdateComponent implements OnInit {
  isSaving = false;
  customSearch: ICustomSearch | null = null;

  editForm: CustomSearchFormGroup = this.customSearchFormService.createCustomSearchFormGroup();

  constructor(
    protected customSearchService: CustomSearchService,
    protected customSearchFormService: CustomSearchFormService,
    protected activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ customSearch }) => {
      this.customSearch = customSearch;
      if (customSearch) {
        this.updateForm(customSearch);
      }
    });
  }

  previousState(): void {
    window.history.back();
  }

  save(): void {
    this.isSaving = true;
    const customSearch = this.customSearchFormService.getCustomSearch(this.editForm);
    if (customSearch.id !== null) {
      this.subscribeToSaveResponse(this.customSearchService.update(customSearch));
    } else {
      this.subscribeToSaveResponse(this.customSearchService.create(customSearch));
    }
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<ICustomSearch>>): void {
    result.pipe(finalize(() => this.onSaveFinalize())).subscribe({
      next: () => this.onSaveSuccess(),
      error: () => this.onSaveError(),
    });
  }

  protected onSaveSuccess(): void {
    this.previousState();
  }

  protected onSaveError(): void {
    // Api for inheritance.
  }

  protected onSaveFinalize(): void {
    this.isSaving = false;
  }

  protected updateForm(customSearch: ICustomSearch): void {
    this.customSearch = customSearch;
    this.customSearchFormService.resetForm(this.editForm, customSearch);
  }
}
