import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatchesPublics } from './matches-publics';

describe('MatchesPublics', () => {
  let component: MatchesPublics;
  let fixture: ComponentFixture<MatchesPublics>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatchesPublics]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MatchesPublics);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
