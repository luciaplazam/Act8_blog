# API de blog con Express y MySQL

API REST para crear y consultar autores y posts de un blog. Cada post incluye los datos completos de su autor.

## Requisitos

- Node.js 18 o superior
- MySQL 8 o compatible

## Instalación y puesta en marcha

1. Crear las tablas importando `sql/blog_db_export.sql` en MySQL:

   ```sh
   mysql -u root -p < sql/blog_db_export.sql
   ```

2. Instalar dependencias:

   ```sh
   pnpm install
   ```

3. Copiar `.env.example` a `.env` y configurar las credenciales de MySQL.
4. Iniciar el servidor:

   ```sh
   pnpm start
   ```

La API estará disponible en `http://localhost:3000`. Para desarrollo, `pnpm dev` reinicia el proceso cuando cambian los archivos.

## Rutas

Todas las rutas comienzan por `/api`.

| Método | URL | Descripción |
|---|---|---|
| GET | `/api/posts` | Lista los posts con el objeto completo del autor |
| GET | `/api/posts/:id` | Recupera un post y su autor |
| POST | `/api/posts` | Crea un post |
| GET | `/api/authors` | Lista los autores |
| GET | `/api/authors/:id` | Recupera un autor |
| POST | `/api/authors` | Crea un autor |
| GET | `/api/authors/:id/posts` | Recupera un autor y los posts que ha escrito |

Las rutas POST reciben y devuelven JSON. Los campos obligatorios para crear un autor son `name`, `email` e `image`. Para crear un post se requieren `title`, `description`, `category` y `author_id`; la fecha `created_at` se establece automáticamente en MySQL.

### Ejemplos

Crear autor:

```sh
curl -X POST http://localhost:3000/api/authors \
  -H 'Content-Type: application/json' \
  -d '{"name":"Lucía Plaza","email":"lucia@example.com","image":"https://example.com/lucia.jpg"}'
```

Crear post:

```sh
curl -X POST http://localhost:3000/api/posts \
  -H 'Content-Type: application/json' \
  -d '{"title":"Mi primer post","description":"Contenido del post","category":"Tecnología","author_id":1}'
```

Consultar posts de un autor:

```sh
curl http://localhost:3000/api/authors/1/posts
```

Las consultas usan parámetros preparados. Los errores de validación devuelven `400`, los recursos inexistentes `404` y los emails duplicados `409`.
