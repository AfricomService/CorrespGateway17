import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpResponse } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, Subject, from } from 'rxjs';

import { NoteFormService } from './note-form.service';
import { NoteService } from '../service/note.service';
import { INote } from '../note.model';
import { IPj } from 'app/entities/correspManage/pj/pj.model';
import { PjService } from 'app/entities/correspManage/pj/service/pj.service';

import { NoteUpdateComponent } from './note-update.component';

describe('Note Management Update Component', () => {
  let comp: NoteUpdateComponent;
  let fixture: ComponentFixture<NoteUpdateComponent>;
  let activatedRoute: ActivatedRoute;
  let noteFormService: NoteFormService;
  let noteService: NoteService;
  let pjService: PjService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule.withRoutes([])],
      declarations: [NoteUpdateComponent],
      providers: [
        FormBuilder,
        {
          provide: ActivatedRoute,
          useValue: {
            params: from([{}]),
          },
        },
      ],
    })
      .overrideTemplate(NoteUpdateComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(NoteUpdateComponent);
    activatedRoute = TestBed.inject(ActivatedRoute);
    noteFormService = TestBed.inject(NoteFormService);
    noteService = TestBed.inject(NoteService);
    pjService = TestBed.inject(PjService);

    comp = fixture.componentInstance;
  });

  describe('ngOnInit', () => {
    it('Should call Pj query and add missing value', () => {
      const note: INote = { id: 456 };
      const attachment: IPj = { id: 18732 };
      note.attachment = attachment;

      const pjCollection: IPj[] = [{ id: 14625 }];
      jest.spyOn(pjService, 'query').mockReturnValue(of(new HttpResponse({ body: pjCollection })));
      const additionalPjs = [attachment];
      const expectedCollection: IPj[] = [...additionalPjs, ...pjCollection];
      jest.spyOn(pjService, 'addPjToCollectionIfMissing').mockReturnValue(expectedCollection);

      activatedRoute.data = of({ note });
      comp.ngOnInit();

      expect(pjService.query).toHaveBeenCalled();
      expect(pjService.addPjToCollectionIfMissing).toHaveBeenCalledWith(pjCollection, ...additionalPjs.map(expect.objectContaining));
      expect(comp.pjsSharedCollection).toEqual(expectedCollection);
    });

    it('Should update editForm', () => {
      const note: INote = { id: 456 };
      const attachment: IPj = { id: 55651 };
      note.attachment = attachment;

      activatedRoute.data = of({ note });
      comp.ngOnInit();

      expect(comp.pjsSharedCollection).toContain(attachment);
      expect(comp.note).toEqual(note);
    });
  });

  describe('save', () => {
    it('Should call update service on save for existing entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<INote>>();
      const note = { id: 123 };
      jest.spyOn(noteFormService, 'getNote').mockReturnValue(note);
      jest.spyOn(noteService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ note });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: note }));
      saveSubject.complete();

      // THEN
      expect(noteFormService.getNote).toHaveBeenCalled();
      expect(comp.previousState).toHaveBeenCalled();
      expect(noteService.update).toHaveBeenCalledWith(expect.objectContaining(note));
      expect(comp.isSaving).toEqual(false);
    });

    it('Should call create service on save for new entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<INote>>();
      const note = { id: 123 };
      jest.spyOn(noteFormService, 'getNote').mockReturnValue({ id: null });
      jest.spyOn(noteService, 'create').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ note: null });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: note }));
      saveSubject.complete();

      // THEN
      expect(noteFormService.getNote).toHaveBeenCalled();
      expect(noteService.create).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).toHaveBeenCalled();
    });

    it('Should set isSaving to false on error', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<INote>>();
      const note = { id: 123 };
      jest.spyOn(noteService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ note });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.error('This is an error!');

      // THEN
      expect(noteService.update).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).not.toHaveBeenCalled();
    });
  });

  describe('Compare relationships', () => {
    describe('comparePj', () => {
      it('Should forward to pjService', () => {
        const entity = { id: 123 };
        const entity2 = { id: 456 };
        jest.spyOn(pjService, 'comparePj');
        comp.comparePj(entity, entity2);
        expect(pjService.comparePj).toHaveBeenCalledWith(entity, entity2);
      });
    });
  });
});
