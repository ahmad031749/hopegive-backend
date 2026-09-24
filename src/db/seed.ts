import { pool } from "../config/db";

const CAUSES = [
  { slug: "nutrition",  title: "Child Nutrition",  description: "Providing daily meals and nutritional supplements to malnourished children.", goal: 100000, raised: 78400 },
  { slug: "education",  title: "Education Access", description: "Building schools, supplying books and paying teacher salaries.",              goal: 100000, raised: 62000 },
  { slug: "shelter",    title: "Safe Shelter",     description: "Constructing and repairing homes for families in makeshift shelters.",        goal: 100000, raised: 45200 },
  { slug: "general",    title: "Where Needed Most",description: "Allocated monthly to the cause with the greatest urgent need.",              goal: 500000, raised: 185600 },
];

async function seed() {
  for (const c of CAUSES) {
    await pool.query(
      `INSERT INTO causes (slug, title, description, goal_usd, raised_usd)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (slug) DO UPDATE
         SET title=$2, description=$3, goal_usd=$4`,
      [c.slug, c.title, c.description, c.goal, c.raised]
    );
  }
  console.log("✅ Seeded causes");
  await pool.end();
}

seed().catch((err) => { console.error(err); process.exit(1); });
