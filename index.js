require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------- CORS (una sola vez, antes de las rutas) ----------
const corsOptions = {
  origin: (origin, callback) => {
    // Permite Vercel (producción y previews), localhost y herramientas sin origin (Postman)
    if (
      !origin ||
      origin === 'https://cafeteria-frontend-o6qk.vercel.app' ||
      origin.endsWith('.vercel.app') ||
      origin.startsWith('https://cafeteria-frontend-o6qk.vercel.app')
    ) {
      return callback(null, true);
    }
    callback(new Error('No permitido por CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // responde los preflight
app.use(express.json());

// ---------- Pool de conexión (Aiven con SSL) ----------
const conexion = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  ssl: { rejectUnauthorized: false },
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true // las fechas llegan como 'YYYY-MM-DD' en vez de ISO con 'T00:00:00.000Z'
});

// Por si la fecha llega en formato ISO desde el frontend: se queda con YYYY-MM-DD
const limpiarFecha = (fecha) => (fecha ? String(fecha).slice(0, 10) : null);

// ---------- GET /ventas (JOIN múltiple) ----------
app.get('/ventas', (req, res) => {
  const sql = `
    SELECT v.id, e.nombre AS estudiante, p.nombre AS producto,
           v.cantidad, v.fecha, p.precio, (v.cantidad * p.precio) AS total,
           v.estudiante_id, v.producto_id
    FROM ventas v
    INNER JOIN estudiantes e ON v.estudiante_id = e.id
    INNER JOIN productos p ON v.producto_id = p.id
  `;
  conexion.query(sql, (err, resultados) => {
    if (err) return res.status(500).send(err);
    res.json(resultados);
  });
});

// ---------- GET /estudiantes y GET /productos ----------
app.get('/estudiantes', (req, res) => {
  conexion.query('SELECT * FROM estudiantes', (err, r) =>
    err ? res.status(500).send(err) : res.json(r)
  );
});

app.get('/productos', (req, res) => {
  conexion.query('SELECT * FROM productos', (err, r) =>
    err ? res.status(500).send(err) : res.json(r)
  );
});

// ---------- POST /ventas ----------
app.post('/ventas', (req, res) => {
  const { estudiante_id, producto_id, cantidad, fecha } = req.body;
  conexion.query(
    'INSERT INTO ventas (estudiante_id, producto_id, cantidad, fecha) VALUES (?, ?, ?, ?)',
    [estudiante_id, producto_id, cantidad, limpiarFecha(fecha)],
    (err) =>
      err
        ? res.status(500).send(err)
        : res.send({ message: 'Venta registrada correctamente' })
  );
});

// ---------- PUT /ventas/:id ----------
app.put('/ventas/:id', (req, res) => {
  const id = req.params.id;
  const { estudiante_id, producto_id, cantidad, fecha } = req.body;
  conexion.query(
    'UPDATE ventas SET estudiante_id=?, producto_id=?, cantidad=?, fecha=? WHERE id=?',
    [estudiante_id, producto_id, cantidad, limpiarFecha(fecha), id],
    (err) =>
      err
        ? res.status(500).send(err)
        : res.send({ message: `Venta con ID ${id} actualizada` })
  );
});

// ---------- DELETE /ventas/:id ----------
app.delete('/ventas/:id', (req, res) => {
  const id = req.params.id;
  conexion.query('DELETE FROM ventas WHERE id=?', [id], (err) =>
    err
      ? res.status(500).send(err)
      : res.send({ message: `Venta con ID ${id} eliminada` })
  );
});

app.listen(PORT, () => {
  console.log(`Servidor Express corriendo en puerto ${PORT}`);
});