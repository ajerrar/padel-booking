import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserModel, MemberType } from './user-service';

interface LoginRequest {
  matricule: string;
}

interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  level: string;
  memberType: MemberType;
  siteName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthApiService {
  private http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/api/auth';

  // Methode loginByMatricule: authentifie l utilisateur et met a jour la session.
  loginByMatricule
  (matricule: string): Observable<UserModel> {
    const payload: LoginRequest = {
      matricule: String(matricule || '').trim(),
    };

    return this.http.post<UserModel>(`${this.baseUrl}/login`, payload);
  }

  // Methode register: cree ou ajoute un element selon les regles metier.
  register(payload: RegisterRequest): Observable<UserModel> {
    return this.http.post<UserModel>(`${this.baseUrl}/register`, payload);
  }
}
