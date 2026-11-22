# Plan de catálogo demo (80 productos) — A+C

## Estado
- **Diagnóstico/depuración documental completado**. **Sin carga a PostgreSQL**, sin POST/PATCH/PUT/DELETE, sin uploads al backend, sin migraciones, sin cambios de backend/frontend/modelos/contratos.
- Todas las imágenes quedan `reviewer_approval=PENDING`. Todos los productos planificados quedan `status=PENDING_REVIEW`.

## Artefactos
- `docs/catalog-image-mapping.csv` — depurado documentalmente (80 filas, 20 por categoría).
- `docs/catalog-demo-product-plan.csv` — plan 80 productos (20 por categoría), 1 imagen candidata por producto.
- `docs/catalog-demo-product-plan.md` — este documento.

## Distribución y criterios
| Categoría | Cantidad | Slug categoría | Rango precio demo COP | Rango stock demo |
|---|---:|---|---:|---:|
| Calzado | 20 | `calzado` | 189.900–399.900 | 7–25 |
| Implementos | 20 | `implementos` | 29.900–249.900 | 6–25 |
| Ropa | 20 | `ropa` | 59.900–169.900 | 12–35 |
| Suplementos | 20 | `suplementos` | 79.900–189.900 | 11–30 |
| **Total** | **80** | | ficticio | ficticio |

## Reglas aplicadas al plan
- `product_name`: incluye `Demo`; sin marcas/referencias/atributos comerciales reales.
- `description`: incluye aviso explícito: “Producto de demostración para entorno de pruebas. No corresponde a un producto real, precio ni inventario comercial.”
- `product_slug`: único, formato `demo-<categoria>-<nn>`.
- `is_active=true` para visibilidad prevista en catálogo público tras carga futura autorizada.
- `category_id`, `upload_url`, `product_id`: vacíos.
- `status=PENDING_REVIEW`.
- 1 imagen candidata por producto; correspondencia por categoría y secuencia.

## Verificación documental ejecutada
- 80 filas en plan; 20 por categoría.
- 80 slugs únicos.
- 80 archivos candidatos existentes.
- Todos `product_name` contienen `Demo`.
- Todos `status=PENDING_REVIEW`, `is_active=true`, campos de ejecución vacíos.
- Mapping: 80 filas, 20 por categoría, `reviewer_approval=PENDING`, archivos existentes.

## Inconsistencias / pendientes de verificación (imágenes)
- **Suplementos candidate-07..20 (14 archivos)**: `source_url=UNVERIFIED`, `original_filename=UNVERIFIED`. La procedencia exacta no pudo confirmarse con evidencia documental en esta sesión; se marcaron explícitamente como pendientes. **No se inventaron fuentes/autores/licencias**.
- **Todos los registros (80)**: licencia marcada como `Unsplash License (https://unsplash.com/license) | verificación documental pendiente por archivo`. Requiere verificación humana por archivo (URL de foto, autor, términos aplicables al momento de descarga).
- `docs/catalog-image-mapping.csv` contiene metadatos previos de nombre original/URL para la mayoría; se conservaron como referencia documental pendiente de verificación, no como prueba definitiva.
- Antes de cualquier carga futura: revisar visualmente cada WebP, confirmar licencia/fuente por archivo, y cambiar `reviewer_approval` solo por decisión humana.

## Próximo paso (requiere nueva autorización expresa)
1. Revisión humana visual y documental de 80 imágenes.
2. Aprobar/marcar imágenes en mapping.
3. Autorizar carga DB: crear categorías si faltan, subir imágenes aprobadas por `/admin/media/images`, crear productos por `/admin/catalog/products`, validar por API/DB read-only.
