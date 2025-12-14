import express from 'express';
import cors from 'cors';
import { pool } from './db.js';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

/**
 * Сохранить / обновить день
 */
app.post('/records', async (req, res) => {
  const { date, workers, products, earnings } = req.body;

  try {
    await pool.query(
      `
      INSERT INTO work_records (work_date, workers, products, earnings)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (work_date)
      DO UPDATE SET
        workers = EXCLUDED.workers,
        products = EXCLUDED.products,
        earnings = EXCLUDED.earnings
      `,
      [date, workers, products, earnings]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

/**
 * Получить месяц
 */
app.get('/records', async (req, res) => {
    const { year, month } = req.query;
  
    if (!year || !month) {
      return res.status(400).json({ error: 'Missing year or month query parameter' });
    }
  
    try {
      const result = await pool.query(
        `
        SELECT *
        FROM work_records
        WHERE EXTRACT(YEAR FROM work_date) = $1
          AND EXTRACT(MONTH FROM work_date) = $2
        `,
        [year, Number(month)]
      );
  
      const map = {};
      result.rows.forEach(r => {
        map[r.work_date] = {
          date: r.work_date,
          workers: r.workers,
          products: r.products,
          earnings: r.earnings
        };
      });
  
      res.json(map);
    } catch (err) {
      console.error('Ошибка в GET /records:', err);
      res.status(500).json({ error: 'DB error' });
    }
  });
  

/**
 * Удалить день
 */
app.delete('/records/:date', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM work_records WHERE work_date = $1',
      [req.params.date]
    );
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'DB error' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend running on ${PORT}`);
});
