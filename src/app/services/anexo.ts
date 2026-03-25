import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AnexoService {
  private apiUrl = 'http://localhost:8080/api/anexos';

  constructor(private http: HttpClient) { }

  private getHeaders() {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  getAnexos(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  guardarAnexo(anexo: any): Observable<any> {
    return this.http.put(this.apiUrl, anexo, { headers: this.getHeaders() });
  }
  // Este es el que faltaba para actualizar (usa PUT)
  actualizarAnexo(id: number, anexo: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, anexo, { headers: this.getHeaders() });
  }

  eliminarAnexo(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }
  // NUEVO: Método para mandar el archivo físico (PDF, Word, etc.)
  subirArchivoFisico(id: number, archivo: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', archivo);
  
    const headersSeguros = this.getHeaders().delete('Content-Type'); 
    
    return this.http.post(`${this.apiUrl}/${id}/archivo`, formData, { 
      headers: headersSeguros, 
      responseType: 'text' 
    });
  }
  // NUEVO: Descargar el archivo físico de forma segura con el Token
  verArchivoFisico(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/archivo`, { 
      headers: this.getHeaders(), 
      responseType: 'blob' // Súper importante: le decimos a Angular que no es texto, es un archivo
    });
  }
}