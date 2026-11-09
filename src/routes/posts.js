const express = require('express');
const pool = require('../db');

const router = express.Router();
const postFields = `
  p.id, p.title, p.description, p.created_at, p.category,
  a.id AS author_id, a.name AS author_name,
  a.email AS author_email, a.image AS author_image
`;

function mapPost(row) {
  return {
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
  };
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isPositiveInteger(value) {
  return Number.isSafeInteger(Number(value)) && Number(value) > 0;
}

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.execute(`
      SELECT ${postFields}
      FROM posts p
      JOIN authors a ON a.id = p.author_id
      ORDER BY p.created_at DESC, p.id DESC
    `);

    return res.json(rows.map(mapPost));
  } catch (err) {
    return next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  if (!isPositiveInteger(req.params.id)) {
    return res.status(400).json({ error: 'El id del post debe ser un entero positivo' });
  }

  try {
    const [rows] = await pool.execute(`
      SELECT ${postFields}
      FROM posts p
      JOIN authors a ON a.id = p.author_id
      WHERE p.id = ?
    `, [Number(req.params.id)]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Post no encontrado' });
    }

    return res.json(mapPost(rows[0]));
  } catch (err) {
    return next(err);
  }
});

router.post('/', async (req, res, next) => {
  const { title, description, category, author_id: authorId } = req.body || {};
  const missingFields = [];

  if (!isNonEmptyString(title)) missingFields.push('title');
  if (!isNonEmptyString(description)) missingFields.push('description');
  if (!isNonEmptyString(category)) missingFields.push('category');
  if (!isPositiveInteger(authorId)) missingFields.push('author_id');

  if (missingFields.length) {
    return res.status(400).json({
      error: 'Faltan campos obligatorios o tienen un formato incorrecto',
      fields: missingFields
    });
  }

  try {
    const [result] = await pool.execute(
      'INSERT INTO posts (title, description, category, author_id) VALUES (?, ?, ?, ?)',
      [title.trim(), description.trim(), category.trim(), Number(authorId)]
    );
    const [rows] = await pool.execute(`
      SELECT ${postFields}
      FROM posts p
      JOIN authors a ON a.id = p.author_id
      WHERE p.id = ?
    `, [result.insertId]);

    return res.status(201).json(mapPost(rows[0]));
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
