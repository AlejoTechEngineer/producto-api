export interface Producto {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
}

export interface ProductoRequest {
  nombre: string;
  descripcion: string | null;
  precio: number;
}
