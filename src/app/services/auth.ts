import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService { // Aunque el archivo se llame auth.ts, la clase se llama AuthService
  // ¡Esta es la URL de tu backend en IntelliJ!
  private apiUrl = 'http://localhost:8080/api/auth';

  constructor(private http: HttpClient) { }

  // Método para iniciar sesión
  login(credenciales: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credenciales);
  }
  // Método para crear cuenta
  register(usuario: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, usuario);
  }

  // Método para guardar el Token en el almacenamiento del navegador
  guardarToken(token: string, rol: string): void {
    localStorage.setItem('token', token);
    localStorage.setItem('rol', rol);
  }

  // Método para saber si alguien está logueado
  estaLogueado(): boolean {
    return localStorage.getItem('token') !== null;
  }

  // Método para cerrar sesión (borra el pase VIP)
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
  }
}