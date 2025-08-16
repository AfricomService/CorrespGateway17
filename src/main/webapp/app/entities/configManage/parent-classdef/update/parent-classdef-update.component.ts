import { Component, OnInit } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';

import { ParentClassdefFormService, ParentClassdefFormGroup } from './parent-classdef-form.service';
import { IParentClassdef } from '../parent-classdef.model';
import { ParentClassdefService } from '../service/parent-classdef.service';
import { INumsequentielle } from 'app/entities/configManage/numsequentielle/numsequentielle.model';
import { NumsequentielleService } from 'app/entities/configManage/numsequentielle/service/numsequentielle.service';
import { CorrespType } from 'app/entities/enumerations/corresp-type.model';

@Component({
  selector: 'jhi-parent-classdef-update',
  templateUrl: './parent-classdef-update.component.html',
})
export class ParentClassdefUpdateComponent implements OnInit {
  isSaving = false;
  parentClassdef: IParentClassdef | null = null;
  correspTypeValues = Object.keys(CorrespType);

  numsequentiellesSharedCollection: INumsequentielle[] = [];

  editForm: ParentClassdefFormGroup = this.parentClassdefFormService.createParentClassdefFormGroup();

  constructor(
    protected parentClassdefService: ParentClassdefService,
    protected parentClassdefFormService: ParentClassdefFormService,
    protected numsequentielleService: NumsequentielleService,
    protected activatedRoute: ActivatedRoute
  ) {}

  compareNumsequentielle = (o1: INumsequentielle | null, o2: INumsequentielle | null): boolean =>
    this.numsequentielleService.compareNumsequentielle(o1, o2);

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ parentClassdef }) => {
      this.parentClassdef = parentClassdef;
      if (parentClassdef) {
        this.updateForm(parentClassdef);
      }

      this.loadRelationshipsOptions();
    });
  }

  previousState(): void {
    window.history.back();
  }

  save(): void {
    this.isSaving = true;
    const parentClassdef = this.parentClassdefFormService.getParentClassdef(this.editForm);
    if (parentClassdef.id !== null) {
      this.subscribeToSaveResponse(this.parentClassdefService.update(parentClassdef));
    } else {
      this.subscribeToSaveResponse(this.parentClassdefService.create(parentClassdef));
    }
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<IParentClassdef>>): void {
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

  protected updateForm(parentClassdef: IParentClassdef): void {
    this.parentClassdef = parentClassdef;
    this.parentClassdefFormService.resetForm(this.editForm, parentClassdef);

    this.numsequentiellesSharedCollection = this.numsequentielleService.addNumsequentielleToCollectionIfMissing<INumsequentielle>(
      this.numsequentiellesSharedCollection,
      parentClassdef.sequenceId
    );
  }

  protected loadRelationshipsOptions(): void {
    this.numsequentielleService
      .query()
      .pipe(map((res: HttpResponse<INumsequentielle[]>) => res.body ?? []))
      .pipe(
        map((numsequentielles: INumsequentielle[]) =>
          this.numsequentielleService.addNumsequentielleToCollectionIfMissing<INumsequentielle>(
            numsequentielles,
            this.parentClassdef?.sequenceId
          )
        )
      )
      .subscribe((numsequentielles: INumsequentielle[]) => (this.numsequentiellesSharedCollection = numsequentielles));
  }
}
