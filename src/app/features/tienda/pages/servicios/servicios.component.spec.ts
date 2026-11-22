import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { provideRouter } from '@angular/router';
import { ServiciosComponent } from './servicios.component';
import { PublicServicesApiService } from '../../services/public-services-api.service';

describe('ServiciosComponent', () => {
  let api: jasmine.SpyObj<PublicServicesApiService>;

  async function setup() {
    await TestBed.configureTestingModule({
      imports: [ServiciosComponent],
      providers: [provideRouter([]), { provide: PublicServicesApiService, useValue: api }],
    }).compileComponents();
    const fixture = TestBed.createComponent(ServiciosComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    api = jasmine.createSpyObj<PublicServicesApiService>('PublicServicesApiService', ['list']);
  });

  it('renders active services and excludes inactive', async () => {
    api.list.and.returnValue(of({ items: [
      { id:'1', name:'Activo', slug:'a', description:'d', price_cop:'1000', duration_minutes:30, image_url:null, is_active:true, created_at:'', updated_at:'' },
      { id:'2', name:'Inactivo', slug:'i', description:null, price_cop:'1000', duration_minutes:null, image_url:null, is_active:false, created_at:'', updated_at:'' },
    ], total:2, skip:0, limit:100 } as any));
    const fixture = await setup();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Activo');
    expect(text).not.toContain('Inactivo');
  });

  it('shows empty state', async () => {
    api.list.and.returnValue(of({ items: [], total:0, skip:0, limit:100 } as any));
    const fixture = await setup();
    expect(fixture.nativeElement.textContent).toContain('No hay servicios disponibles');
  });

  it('shows error and retries', async () => {
    api.list.and.returnValue(throwError(() => ({ status: 500, message: 'fail' })));
    const fixture = await setup();
    expect(fixture.nativeElement.textContent).toContain('Reintentar');
    api.list.and.returnValue(of({ items: [], total:0, skip:0, limit:100 } as any));
    fixture.componentInstance.load();
    fixture.detectChanges();
    expect(api.list.calls.count()).toBeGreaterThan(1);
  });
});
