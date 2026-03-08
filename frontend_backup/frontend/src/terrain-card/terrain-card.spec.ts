import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TerrainCard } from './terrain-card';

describe('TerrainCard', () => {
  let component: TerrainCard;
  let fixture: ComponentFixture<TerrainCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TerrainCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TerrainCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
