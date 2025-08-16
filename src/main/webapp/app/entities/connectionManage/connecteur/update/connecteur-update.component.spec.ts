import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpResponse } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, Subject, from } from 'rxjs';

import { ConnecteurFormService } from './connecteur-form.service';
import { ConnecteurService } from '../service/connecteur.service';
import { IConnecteur } from '../connecteur.model';

import { ConnecteurUpdateComponent } from './connecteur-update.component';

describe('Connecteur Management Update Component', () => {
  let comp: ConnecteurUpdateComponent;
  let fixture: ComponentFixture<ConnecteurUpdateComponent>;
  let activatedRoute: ActivatedRoute;
  let connecteurFormService: ConnecteurFormService;
  let connecteurService: ConnecteurService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule.withRoutes([])],
      declarations: [ConnecteurUpdateComponent],
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
      .overrideTemplate(ConnecteurUpdateComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(ConnecteurUpdateComponent);
    activatedRoute = TestBed.inject(ActivatedRoute);
    connecteurFormService = TestBed.inject(ConnecteurFormService);
    connecteurService = TestBed.inject(ConnecteurService);

    comp = fixture.componentInstance;
  });

  describe('ngOnInit', () => {
    it('Should update editForm', () => {
      const connecteur: IConnecteur = { id: 456 };

      activatedRoute.data = of({ connecteur });
      comp.ngOnInit();

      expect(comp.connecteur).toEqual(connecteur);
    });
  });

  describe('save', () => {
    it('Should call update service on save for existing entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IConnecteur>>();
      const connecteur = { id: 123 };
      jest.spyOn(connecteurFormService, 'getConnecteur').mockReturnValue(connecteur);
      jest.spyOn(connecteurService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ connecteur });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: connecteur }));
      saveSubject.complete();

      // THEN
      expect(connecteurFormService.getConnecteur).toHaveBeenCalled();
      expect(comp.previousState).toHaveBeenCalled();
      expect(connecteurService.update).toHaveBeenCalledWith(expect.objectContaining(connecteur));
      expect(comp.isSaving).toEqual(false);
    });

    it('Should call create service on save for new entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IConnecteur>>();
      const connecteur = { id: 123 };
      jest.spyOn(connecteurFormService, 'getConnecteur').mockReturnValue({ id: null });
      jest.spyOn(connecteurService, 'create').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ connecteur: null });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: connecteur }));
      saveSubject.complete();

      // THEN
      expect(connecteurFormService.getConnecteur).toHaveBeenCalled();
      expect(connecteurService.create).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).toHaveBeenCalled();
    });

    it('Should set isSaving to false on error', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IConnecteur>>();
      const connecteur = { id: 123 };
      jest.spyOn(connecteurService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ connecteur });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.error('This is an error!');

      // THEN
      expect(connecteurService.update).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).not.toHaveBeenCalled();
    });
  });
});
