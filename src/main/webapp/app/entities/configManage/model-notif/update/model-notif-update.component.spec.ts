import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpResponse } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, Subject, from } from 'rxjs';

import { ModelNotifFormService } from './model-notif-form.service';
import { ModelNotifService } from '../service/model-notif.service';
import { IModelNotif } from '../model-notif.model';

import { ModelNotifUpdateComponent } from './model-notif-update.component';

describe('ModelNotif Management Update Component', () => {
  let comp: ModelNotifUpdateComponent;
  let fixture: ComponentFixture<ModelNotifUpdateComponent>;
  let activatedRoute: ActivatedRoute;
  let modelNotifFormService: ModelNotifFormService;
  let modelNotifService: ModelNotifService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule.withRoutes([])],
      declarations: [ModelNotifUpdateComponent],
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
      .overrideTemplate(ModelNotifUpdateComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(ModelNotifUpdateComponent);
    activatedRoute = TestBed.inject(ActivatedRoute);
    modelNotifFormService = TestBed.inject(ModelNotifFormService);
    modelNotifService = TestBed.inject(ModelNotifService);

    comp = fixture.componentInstance;
  });

  describe('ngOnInit', () => {
    it('Should update editForm', () => {
      const modelNotif: IModelNotif = { id: '1361f429-3817-4123-8ee3-fdf8943310b2' };

      activatedRoute.data = of({ modelNotif });
      comp.ngOnInit();

      expect(comp.modelNotif).toEqual(modelNotif);
    });
  });

  describe('save', () => {
    it('Should call update service on save for existing entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IModelNotif>>();
      const modelNotif = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
      jest.spyOn(modelNotifFormService, 'getModelNotif').mockReturnValue(modelNotif);
      jest.spyOn(modelNotifService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ modelNotif });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: modelNotif }));
      saveSubject.complete();

      // THEN
      expect(modelNotifFormService.getModelNotif).toHaveBeenCalled();
      expect(comp.previousState).toHaveBeenCalled();
      expect(modelNotifService.update).toHaveBeenCalledWith(expect.objectContaining(modelNotif));
      expect(comp.isSaving).toEqual(false);
    });

    it('Should call create service on save for new entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IModelNotif>>();
      const modelNotif = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
      jest.spyOn(modelNotifFormService, 'getModelNotif').mockReturnValue({ id: null });
      jest.spyOn(modelNotifService, 'create').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ modelNotif: null });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: modelNotif }));
      saveSubject.complete();

      // THEN
      expect(modelNotifFormService.getModelNotif).toHaveBeenCalled();
      expect(modelNotifService.create).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).toHaveBeenCalled();
    });

    it('Should set isSaving to false on error', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IModelNotif>>();
      const modelNotif = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
      jest.spyOn(modelNotifService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ modelNotif });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.error('This is an error!');

      // THEN
      expect(modelNotifService.update).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).not.toHaveBeenCalled();
    });
  });
});
