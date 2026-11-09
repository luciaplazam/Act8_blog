const express = require('express');
const authorsRouter = require('./routes/authors');
const postsRouter = require('./routes/posts');

const app = express();

app.use(express.json());
app.use('/api/posts', postsRouter);
app.use('/api/authors', authorsRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la petición no es JSON válido' });
  }

  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ error: 'Ya existe un autor con ese email' });
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({ error: 'El autor indicado no existe' });
  }

  console.error(err);
  return res.status(500).json({ error: 'Error interno del servidor' });
});

module.exports = app;
