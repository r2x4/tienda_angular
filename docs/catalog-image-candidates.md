# Catálogo - Imágenes candidatas (Etapa 11.3 complemento)

## Alcance
- Preparación local de **80 imágenes candidatas** para catálogo: 20 por categoría (`calzado`, `implementos`, `ropa`, `suplementos`).
- **Sin asociación a productos**. **Sin cambios** en DB, backend, contratos API, precios, inventario, categorías, nombres ni lógica comercial.
- Las imágenes son candidatas pendientes de revisión humana (`reviewer_approval=PENDING`).

## Ubicación
- Imágenes: `src/assets/images/catalog-candidates/<categoria>/candidate-XX.webp`
- Inventario: `docs/catalog-image-mapping.csv`

## Criterios de selección
- Fotografías reales de fuentes públicas Unsplash, relevantes a la categoría.
- Sin marcas de agua; se evitaron composiciones inadecuadas/pixeladas.
- Preferencia por buena iluminación y fondo/composición limpia para tarjeta de producto.
- No se presentan como productos específicos del catálogo actual.
- No se repitieron archivos (verificación por hash SHA256 sin duplicados).

## Optimización
- Formato: WebP (`fm=webp`, Unsplash).
- Resolución solicitada al origen: ancho máximo 1200 px (`w=1200`, `fit=crop`, `q=80`).
- Peso total: 12.12 MB (80 archivos, promedio ~155.1 KB).

## Licencia y fuente
- Fuente: Unsplash (URLs por imagen en `docs/catalog-image-mapping.csv`).
- Licencia: **Unsplash License** — https://unsplash.com/license.
  - Permite descargar, copiar, modificar, distribuir, usar gratis, incluso comercialmente, sin permiso ni atribución obligatoria.
  - No permite vender fotos sin modificación significativa, ni crear servicio espejo/competidor con fotos Unsplash.

## Validación realizada
- Conteo: 80 archivos totales; 20 por categoría.
- Duplicados: no detectados por SHA256.
- CSV: 80 filas, con `source_url` y `license` completos; `reviewer_approval=PENDING`.
- Pruebas/build: `npm test -- --watch=false` y `npm run build` ejecutados tras agregar assets (ver reporte de entrega).
