import { TestBed } from '@angular/core/testing';

import { TerrainCardService } from './terrain-card-service';

describe('TerrainCardService', () => {
  let service: TerrainCardService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TerrainCardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
