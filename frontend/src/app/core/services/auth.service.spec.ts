import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService, LoginRequest, LoginResponse, User } from './auth.service';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);

    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('login', () => {
    it('should login and store token', () => {
      const mockCredentials: LoginRequest = { email: 'test@test.com', password: 'password' };
      const mockResponse: LoginResponse = {
        accessToken: 'test-token-123',
        refreshToken: 'refresh-token-123',
        tokenType: 'Bearer',
        expiresIn: 3600,
        user: {
          userId: 1,
          email: 'test@test.com',
          name: 'Test User',
          employeeId: 'EMP001'
        }
      };

      service.login(mockCredentials).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(localStorage.getItem('mes_token')).toBe('test-token-123');
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockCredentials);
      req.flush(mockResponse);
    });

    it('should handle login error', () => {
      const mockCredentials: LoginRequest = { email: 'test@test.com', password: 'wrong' };

      service.login(mockCredentials).subscribe({
        error: (error) => {
          expect(error.status).toBe(401);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/login`);
      req.flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('logout', () => {
    it('should clear token and user on logout', () => {
      localStorage.setItem('mes_token', 'test-token');
      localStorage.setItem('mes_user', JSON.stringify({ email: 'test@test.com', fullName: 'Test' }));

      service.logout();

      expect(localStorage.getItem('mes_token')).toBeNull();
      expect(localStorage.getItem('mes_user')).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when token exists and is valid', () => {
      // Create a valid JWT token (expires in the future)
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }));
      const token = `${header}.${payload}.signature`;

      localStorage.setItem('mes_token', token);

      expect(service.isAuthenticated()).toBe(true);
    });

    it('should return false when no token exists', () => {
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should return false when token is expired', () => {
      // Create an expired JWT token
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 3600 }));
      const token = `${header}.${payload}.signature`;

      localStorage.setItem('mes_token', token);

      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('getToken', () => {
    it('should return token from localStorage', () => {
      localStorage.setItem('mes_token', 'test-token');
      expect(service.getToken()).toBe('test-token');
    });

    it('should return null when no token exists', () => {
      expect(service.getToken()).toBeNull();
    });
  });

  describe('currentUser$', () => {
    it('should emit current user', (done) => {
      const mockCredentials: LoginRequest = { email: 'test@test.com', password: 'password' };
      const mockResponse: LoginResponse = {
        accessToken: 'test-token',
        refreshToken: 'refresh-token',
        tokenType: 'Bearer',
        expiresIn: 3600,
        user: {
          userId: 1,
          email: 'test@test.com',
          name: 'Test User',
          employeeId: 'EMP001'
        }
      };

      service.login(mockCredentials).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/auth/login`);
      req.flush(mockResponse);

      service.currentUser$.subscribe(user => {
        if (user) {
          expect(user.email).toBe('test@test.com');
          expect(user.fullName).toBe('Test User');
          done();
        }
      });
    });
  });
});
