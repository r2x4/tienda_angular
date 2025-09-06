# Spor-Five 🛒  

[![Angular](https://img.shields.io/badge/Angular-20.2-red?logo=angular&logoColor=white)](https://angular.dev/)  
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)  
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)  
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel&logoColor=white)](https://vercel.com/)  

Aplicación desarrollada en **Angular**, que permite a los usuarios navegar por una tienda online, gestionar un carrito de compras y a los administradores administrar productos y exportar reportes.  

🔗 **Demo en producción:** [Ver en Vercel](https://tienda-angular-2zam.vercel.app/inicial)  

---

## 🚀 Tecnologías utilizadas  

- **Framework Frontend:** [Angular 20.2](https://angular.dev/)  
- **Lenguaje:** [TypeScript](https://www.typescriptlang.org/)  
- **Estilos:** [TailwindCSS](https://tailwindcss.com/)  
- **Gestión de Estado:** Signals de Angular  
- **Almacenamiento en el Navegador:**  
  - `IndexedDB`: productos, ventas y usuarios  
  - `localStorage`: carrito y autenticación  
- **Enrutamiento:** Angular Router  
- **Testing:** Karma + Jasmine  
- **Despliegue:** [Vercel](https://vercel.com/)  

---

📊 Estado del proyecto
✅ Funcionalidades implementadas (Frontend)
- Proyecto en Construccion 


---
## 📦 Funcionalidades principales  

### 🛍️ Tienda (Cliente)  
- Navegación entre páginas: Inicio, Contacto, Reseñas, Nosotros.  
- Categorías de productos: Implementos, Calzado, Ropa, Suplementos.  
- **Carrito de Compras** con persistencia en `localStorage`.  
- **Proceso de compra**: actualización de stock y registro de ventas en `IndexedDB`.  
- Autenticación básica de usuario (simulada en frontend).  

### ⚙️ Administración  
- **Login de Administrador** con permisos simulados en frontend.  
- CRUD de productos y servicios (persistencia en `IndexedDB`).  
- Exportación de **ventas** e **inventario** en CSV.  
- Panel independiente para gestión interna.  

---

🔐 Acceso
- Usuario: login estándar en la tienda.
- Administrador: /admin/login
  
### Ejemplo local:
- http://localhost:4200/admin/login

---
## Imagenes de Proyecto 

### Header
<img width="1915" height="1069" alt="Screenshot 2025-09-02 210215" src="https://github.com/user-attachments/assets/1098d7a0-870b-4d5e-8410-1e67d5884fe6" />

### Footer
<img width="1914" height="1068" alt="Screenshot 2025-09-02 210231" src="https://github.com/user-attachments/assets/9a11c77a-331a-42a8-bdf9-817cd6a9f656" />

### Carrito
<img width="1917" height="1072" alt="Screenshot 2025-09-02 133500" src="https://github.com/user-attachments/assets/5b2b2145-0597-4ae1-be60-4a2919fcb6f7" />

<img width="1917" height="1073" alt="Screenshot 2025-09-02 133347" src="https://github.com/user-attachments/assets/ad571950-9213-4cd1-8b74-df21b367c22f" />

### carrito
<img width="1916" height="1074" alt="Screenshot 2025-09-02 133534" src="https://github.com/user-attachments/assets/33b80d7c-c2cc-4fd9-b3ab-534d4863a817" />

### Login Usuario

<img width="1916" height="1074" alt="Screenshot 2025-09-02 133606" src="https://github.com/user-attachments/assets/4c04e72b-732e-4fce-8598-04d28c61c0eb" />

### Ingreso Administrador
<img width="933" height="807" alt="image" src="https://github.com/user-attachments/assets/d3bc03c8-8eaa-4d8c-9a21-42a854f1520f" />

### Ingreso de prodructos e inventario 

<img width="1916" height="1073" alt="image" src="https://github.com/user-attachments/assets/9921bdb6-a321-4bc4-9f95-ad458e5f4d8e" />

### Descargue Ventas E inventario

<img width="1908" height="215" alt="image" src="https://github.com/user-attachments/assets/15d7f0be-c2ac-482a-9406-5bd9e2582a66" />

---

## 📂 Estructura del proyecto  

```bash
src/
 ├── app/
 │   ├── core/            # Servicios globales, guardas, layouts
 │   ├── features/        # Funcionalidades principales
 │   │   ├── tienda/      # Vistas de cliente
 │   │   ├── admin/       # Panel de administración
 │   │   ├── cart/        # Carrito de compras
 │   │   └── auth/        # Autenticación
 │   ├── app.routes.ts    # Definición de rutas
 │   └── app.component.ts # Componente raíz
 ├── assets/              # Imágenes y recursos estáticos
 ├── environments/        # Configuración dev/prod
 └── index.html           # Punto de entrada

