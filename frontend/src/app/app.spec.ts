import { TestBed } from '@angular/core/testing';
import { App } from './app';

// Methode describe: gere describe de ce bloc.
describe('App', () => {
  // Methode beforeEach: gere before each de ce bloc.
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  // Methode it: gere it de ce bloc.
  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    // Methode expect: gere expect de ce bloc.
    expect(app).toBeTruthy();
  });

  // Methode it: gere it de ce bloc.
  it('should render title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    // Methode expect: gere expect de ce bloc.
    expect(compiled.querySelector('h1')?.textContent).toContain('Hello, padel-booking');
  });
});
