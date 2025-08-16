import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { ConnecteurDetailComponent } from './connecteur-detail.component';

describe('Connecteur Management Detail Component', () => {
  let comp: ConnecteurDetailComponent;
  let fixture: ComponentFixture<ConnecteurDetailComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ConnecteurDetailComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { data: of({ connecteur: { id: 123 } }) },
        },
      ],
    })
      .overrideTemplate(ConnecteurDetailComponent, '')
      .compileComponents();
    fixture = TestBed.createComponent(ConnecteurDetailComponent);
    comp = fixture.componentInstance;
  });

  describe('OnInit', () => {
    it('Should load connecteur on init', () => {
      // WHEN
      comp.ngOnInit();

      // THEN
      expect(comp.connecteur).toEqual(expect.objectContaining({ id: 123 }));
    });
  });
});
