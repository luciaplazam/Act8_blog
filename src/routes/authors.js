const express = require('express');
const pool = require('../db');

const router = express.Router();

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isPositiveInteger(value) {
  return Number.isSafeInteger(Number(value)) && Number(value) > 0;
}

function mapAuthor(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    image: row.image
  };
}

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, email, image FROM authors ORDER BY id'
    );

    return res.json(rows.map(mapAuthor));
  } catch (err) {
    return next(err);
  }
});

router.get('/:id/posts', async (req, res, next) => {
  if (!isPositiveInteger(req.params.id)) {
    return res.status(400).json({ error: 'El id del autor debe ser un entero positivo' });
  }

  try {
    const [authorRows] = await pool.execute(
      'SELECT id, name, email, image FROM authors WHERE id = ?',
      [Number(req.params.id)]
    );

    if (authorRows.length === 0) {
      return res.status(404).json({ error: 'Autor no encontrado' });
    }

    const [postRows] = await pool.execute(`
      SELECT
        p.id, p.title, p.description, p.created_at, p.category,
        a.id AS author_id, a.name AS author_name,
        a.email AS author_email, a.image AS author_image
      FROM posts p
      JOIN authors a ON a.id = p.author_id
      WHERE a.id = ?
      ORDER BY p.created_at DESC, p.id DESC
    `, [Number(req.params.id)]);

    return res.json({
      author: mapAuthor(authorRows[0]),
      posts: postRows.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        created_at: row.created_at,
        category: row.category,
        author: {
          id: row.author_id,
          name: row.author_name,
          email: row.author_email,
          image: row.author_image
        }
      }))
    });
  } catch (err) {
    return next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  if (!isPositiveInteger(req.params.id)) {
    return res.status(400).json({ error: 'El id del autor debe ser un entero positivo' });
  }

  try {
    const [rows] = await pool.execute(
      'SELECT id, name, email, image FROM authors WHERE id = ?',
      [Number(req.params.id)]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Autor no encontrado' });
    }

    return res.json(mapAuthor(rows[0]));
  } catch (err) {
    return next(err);
  }
});

router.post('/', async (req, res, next) => {
  const { name, email, image } = req.body || {};
  const missingFields = [];

  if (!isNonEmptyString(name)) missingFields.push('name');
  if (!isNonEmptyString(email)) missingFields.push('email');
  if (!isNonEmptyString(image)) missingFields.push('image');

  if (missingFields.length) {
    return res.status(400).json({
      error: 'Faltan campos obligatorios',
      fields: missingFields
    });
  }

  const normalizedEmail = email.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return res.status(400).json({
      error: 'El email no tiene un formato válido',
      fields: ['email']
    });
  }

  try {
    const [result] = await pool.execute(
      'INSERT INTO authors (name, email, image) VALUES (?, ?, ?)',
      [name.trim(), normalizedEmail, image.trim()]
    );
    const [rows] = await pool.execute(
      'SELECT id, name, email, image FROM authors WHERE id = ?',
      [result.insertId]
    );

    return res.status(201).json(mapAuthor(rows[0]));
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
