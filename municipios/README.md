# Arquitectura municipal TerraOS

Cada municipio tiene un paquete independiente. `demo/` es el único paquete con datos territoriales locales activos en esta entrega; conserva las capas con las que trabaja actualmente TerraOS.

Estructura:

- `demo/` — paquete funcional actual, con capas de demostración.
- `villa-de-leyva/` — reservado para capas oficiales de Villa de Leyva.
- `guican/` — reservado para capas oficiales de Güicán.
- `guacamayas/` — reservado para capas oficiales de Guacamayas.
- `tunja/` — reservado para capas oficiales de Tunja.

Todos los paquetes comparten el mismo mapa base. Las capas temáticas se cargan exclusivamente desde el paquete municipal seleccionado.

## Convención futura

`data/` para catálogos/GeoJSON/metadata, `capas/` para GeoPackage u otros recursos SIG y `documentos/` para fuentes normativas, metadatos y documentos de soporte.
