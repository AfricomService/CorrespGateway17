import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { OrgaEntityDetailComponent } from './orga-entity-detail.component';

describe('OrgaEntity Management Detail Component', () => {
  let comp: OrgaEntityDetailComponent;
  let fixture: ComponentFixture<OrgaEntityDetailComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OrgaEntityDetailComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { data: of({ orgaEntity: { id: 123 } }) },
        },
      ],
    })
      .overrideTemplate(OrgaEntityDetailComponent, '')
      .compileComponents();
    fixture = TestBed.createComponent(OrgaEntityDetailComponent);
    comp = fixture.componentInstance;
  });

  describe('OnInit', () => {
    it('Should load orgaEntity on init', () => {
      // WHEN
      comp.ngOnInit();

      // THEN
      expect(comp.orgaEntity).toEqual(expect.objectContaining({ id: 123 }));
    });
  });
});
