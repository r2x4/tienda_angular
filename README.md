# Spor-Five 🛒

Proyecto desarrollado en **Angular** como parte de la práctica de frontend.  
El objetivo es crear una aplicación de tienda online con gestión de productos, carrito y navegación entre páginas, desplegado en **Vercel**.

🔗 **Demo en producción:** [Spor-Five en Vercel](https://vercel.com/rodrigos-projects-4a3d9e0f/tienda-angular-2zam)

🔗 **Login Administrador:** [Spor-Five ](http://localhost:4200/admin/login)

---

## 🚀 Tecnologías utilizadas

- [Angular 17+](https://angular.dev/) - Framework principal
- [TypeScript](https://www.typescriptlang.org/) - Lenguaje de desarrollo
- [TailwindCSS](https://tailwindcss.com/) (opcional si lo integras para estilos)
- [Vercel](https://vercel.com/) - Despliegue en la nube

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
 │   ├── core/            # Servicios globales, guardas, interceptores
 │   ├── features/        # Funcionalidades principales
 │   │   ├── products/    # Listado y detalle de productos
 │   │   ├── cart/        # Carrito de compras
 │   │   └── auth/        # Autenticación de usuarios (si aplica)
 │   ├── app.routes.ts    # Definición de rutas
 │   ├── app.component.ts # Componente raíz
 │   └── ...
 ├── assets/              # Imágenes y recursos estáticos
 ├── environments/        # Configuración de entornos (dev/prod)
 └── index.html           # Punto de entrada de la aplicación

