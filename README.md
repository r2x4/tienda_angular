# Spor-Five 🛒  

[![Angular](https://img.shields.io/badge/Angular-20.2-red?logo=angular&logoColor=white)](https://angular.dev/)  
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)  
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)  
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel&logoColor=white)](https://vercel.com/)  

Aplicación desarrollada en **Angular**, que permite a los usuarios navegar por una tienda online, gestionar un carrito de compras y a los administradores administrar productos y exportar reportes.  

🔗 **Demo en producción:** [Ver en Vercel](https://vercel.com/rodrigos-projects-4a3d9e0f/tienda-angular-2zam)  

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
📸 Capturas de pantalla
Header
<img src="https://github.com/user-attachments/assets/1098d7a0-870b-4d5e-8410-1e67d5884fe6" width="800" />
Footer
<img src="https://github.com/user-attachments/assets/9a11c77a-331a-42a8-bdf9-817cd6a9f656" width="800" />
Carrito
<img src="https://github.com/user-attachments/assets/5b2b2145-0597-4ae1-be60-4a2919fcb6f7" width="800" /> <img src="https://github.com/user-attachments/assets/33b80d7c-c2cc-4fd9-b3ab-534d4863a817" width="800" />
Login Usuario
<img src="https://github.com/user-attachments/assets/4c04e72b-732e-4fce-8598-04d28c61c0eb" width="800" />
Panel de Administración
<img src="https://github.com/user-attachments/assets/d3bc03c8-8eaa-4d8c-9a21-42a854f1520f" width="600" /> <img src="https://github.com/user-attachments/assets/9921bdb6-a321-4bc4-9f95-ad458e5f4d8e" width="800" />
Exportación CSV
<img src="https://github.com/user-attachments/assets/15d7f0be-c2ac-482a-9406-5bd9e2582a66" width="800" />
🔐 Acceso
Usuario: login estándar en la tienda.

Administrador: /admin/login

Ejemplo local:

bash
Copiar código
http://localhost:4200/admin/login
📊 Estado del proyecto
✅ Funcionalidades implementadas (Frontend)

Navegación entre páginas (Inicio, Contacto, Reseñas, Nosotros).

Categorías de productos (Implementos, Calzado, Ropa, Suplementos).

Carrito de compras con persistencia en localStorage.

Proceso de compra (actualización de stock y registro de ventas en IndexedDB).

Autenticación básica de usuarios y administradores (simulada en frontend).

CRUD de productos y servicios en el panel de administración (datos en IndexedDB).

Exportación de inventario y ventas en CSV.

Despliegue en Vercel.
