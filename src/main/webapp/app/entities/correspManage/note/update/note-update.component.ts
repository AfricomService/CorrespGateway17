import { Component, OnInit } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';

import { NoteFormService, NoteFormGroup } from './note-form.service';
import { INote } from '../note.model';
import { NoteService } from '../service/note.service';
import { IPj } from 'app/entities/correspManage/pj/pj.model';
import { PjService } from 'app/entities/correspManage/pj/service/pj.service';
import { CorrespStatus } from 'app/entities/enumerations/corresp-status.model';

@Component({
  selector: 'jhi-note-update',
  templateUrl: './note-update.component.html',
})
export class NoteUpdateComponent implements OnInit {
  isSaving = false;
  note: INote | null = null;
  correspStatusValues = Object.keys(CorrespStatus);

  pjsSharedCollection: IPj[] = [];

  editForm: NoteFormGroup = this.noteFormService.createNoteFormGroup();

  constructor(
    protected noteService: NoteService,
    protected noteFormService: NoteFormService,
    protected pjService: PjService,
    protected activatedRoute: ActivatedRoute
  ) {}

  comparePj = (o1: IPj | null, o2: IPj | null): boolean => this.pjService.comparePj(o1, o2);

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ note }) => {
      this.note = note;
      if (note) {
        this.updateForm(note);
      }

      this.loadRelationshipsOptions();
    });
  }

  previousState(): void {
    window.history.back();
  }

  save(): void {
    this.isSaving = true;
    const note = this.noteFormService.getNote(this.editForm);
    if (note.id !== null) {
      this.subscribeToSaveResponse(this.noteService.update(note));
    } else {
      this.subscribeToSaveResponse(this.noteService.create(note));
    }
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<INote>>): void {
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

  protected updateForm(note: INote): void {
    this.note = note;
    this.noteFormService.resetForm(this.editForm, note);

    this.pjsSharedCollection = this.pjService.addPjToCollectionIfMissing<IPj>(this.pjsSharedCollection, note.attachment);
  }

  protected loadRelationshipsOptions(): void {
    this.pjService
      .query()
      .pipe(map((res: HttpResponse<IPj[]>) => res.body ?? []))
      .pipe(map((pjs: IPj[]) => this.pjService.addPjToCollectionIfMissing<IPj>(pjs, this.note?.attachment)))
      .subscribe((pjs: IPj[]) => (this.pjsSharedCollection = pjs));
  }
}
