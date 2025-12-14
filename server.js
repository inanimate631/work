import express from "express";
import cors from "cors";
import { pool } from "./db.js";
import authRoutes from "./auth.routes.js";
import { authMiddleware } from "./auth.middleware.js";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);

app.post("/records", authMiddleware, async (req, res) => {
    const userId = req.user.userId;
  
    const {
      date,
      workers = null,
      products = null,
      students = 0,
      earnings,
      manualEarnings = null,
    } = req.body;
  
    try {
      await pool.query(
        `
        INSERT INTO work_records (
          user_id,
          work_date,
          workers,
          products,
          students,
          earnings,
          manual_earnings
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        ON CONFLICT (user_id, work_date)
        DO UPDATE SET
          workers = EXCLUDED.workers,
          products = EXCLUDED.products,
          students = EXCLUDED.students,
          earnings = EXCLUDED.earnings,
          manual_earnings = EXCLUDED.manual_earnings
        `,
        [
          userId,
          date,
          workers,
          products,
          students,
          earnings,
          manualEarnings,
        ]
      );
  
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "DB error" });
    }
  });

  app.get("/records", authMiddleware, async (req, res) => {
    const { year, month } = req.query;
    const userId = req.user.userId;
  
    const result = await pool.query(
      `
      SELECT
        work_date::text AS date,
        workers,
        products,
        students,
        earnings,
        manual_earnings
      FROM work_records
      WHERE user_id = $1
        AND EXTRACT(YEAR FROM work_date) = $2
        AND EXTRACT(MONTH FROM work_date) = $3
      `,
      [userId, year, Number(month)]
    );
  
    const map = {};
    result.rows.forEach((r) => {
      map[r.date] = {
        date: r.date,
        workers: r.workers,
        products: r.products,
        students: r.students,
        earnings: Number(r.earnings),
        manualEarnings: r.manual_earnings
          ? Number(r.manual_earnings)
          : null,
      };
    });
  
    res.json(map);
  });

  app.delete("/records/:date", authMiddleware, async (req, res) => {
    const userId = req.user.userId;
  
    await pool.query(
      `
      DELETE FROM work_records
      WHERE user_id = $1 AND work_date = $2
      `,
      [userId, req.params.date]
    );
  
    res.json({ success: true });
  });

app.listen(PORT, () => {
  console.log(`✅ Backend running on ${PORT}`);
});
