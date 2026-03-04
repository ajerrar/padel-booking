import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminSite } from './admin-site';

describe('AdminSite', () => {
  let component: AdminSite;
  let fixture: ComponentFixture<AdminSite>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminSite]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminSite);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
