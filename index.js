require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(cors()); // Habilitar CORS para permitir llamadas desde Vercel

// Pool de conexión con soporte SSL para Aiven
const conexion = mysql.createPool({
host: process.env.DB_HOST,
user: process.env.DB_USER,
password: process.env.DB_PASSWORD,
database: process.env.DB_NAME,
port: process.env.DB_PORT || 3306,
ssl: { rejectUnauthorized: false }, // Permite la conexión cifrada requerida por Aiven
waitForConnections: true,
connectionLimit: 10
});

// GET /ventas (JOIN múltiple)[cite: 16, 17, 19, 20]
app.get('/ventas', (req, res) => {
const sql = `
SELECT v.id, e.nombre AS estudiante, p.nombre AS producto,
v.cantidad, v.fecha, p.precio, (v.cantidad * p.precio) AS total,
v.estudiante_id, v.producto_id
FROM ventas v
INNER JOIN estudiantes e ON v.estudiante_id = e.id
INNER JOIN productos p ON v.producto_id = p.id
`;[cite=16]
conexion.query(sql, (err, resultados) => {
if (err) return res.status(500).send(err);
res.json(resultados);[cite = 16]
});
});
// GET /estudiantes y GET /productos
app.get('/estudiantes', (req, res) => {
conexion.query('SELECT * FROM estudiantes', (err, r) => err ? res.status(500).send(err) : res.json(r));[cite=
16, 18, 19]
});
app.get('/productos', (req, res) => {
conexion.query('SELECT * FROM productos', (err, r) => err ? res.status(500).send(err) : res.json(r));[cite = 16,
18, 19]
});

// POST /ventas[cite: 16, 18, 19, 20]
app.post('/ventas', (req, res) => {
const { estudiante_id, producto_id, cantidad, fecha } = req.body;[cite = 16, 18, 19]
conexion.query(
'INSERT INTO ventas (estudiante_id, producto_id, cantidad, fecha) VALUES (?, ?, ?, ?)',[cite = 16, 18, 19]
[estudiante_id, producto_id, cantidad, fecha],[cite = 16, 18, 19],
(err) => err ? res.status(500).send(err) : res.send({ message: 'Venta registrada correctamente' })[cite = 18]
);
});

// PUT /ventas/:id[cite: 16, 19, 20]
app.put('/ventas/:id', (req, res) => {
const id = req.params.id;[cite = 16, 19]
const { estudiante_id, producto_id, cantidad, fecha } = req.body;[cite = 16, 19]
conexion.query(
'UPDATE ventas SET estudiante_id=?, producto_id=?, cantidad=?, fecha=? WHERE id=?',[cite = 16, 19]
[estudiante_id, producto_id, cantidad, fecha, id],[cite = 16, 19],
(err) => err ? res.status(500).send(err) : res.send({ message: `Venta con ID ${id} actualizada` })[cite = 19]
);
});
// DELETE /ventas/:id[cite: 16, 20]
app.delete('/ventas/:id', (req, res) => {
const id = req.params.id;[cite = 16, 20]
conexion.query('DELETE FROM ventas WHERE id=?', [id], (err) =>[cite = 16, 20],
err ? res.status(500).send(err) : res.send({ message: `Venta con ID ${id} eliminada` })[cite = 20]
);
});

app.listen(PORT, () => {
console.log(`Servidor Express corriendo en puerto ${PORT}`);
});