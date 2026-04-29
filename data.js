const express = require("express");
const { MongoClient } = require("mongodb");

const app = express();
app.use(express.json());

const PORT = 10000;
const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.DB_NAME || "gameData";
const API_KEY = process.env.API_KEY;
const DEFAULT_GAME_ID = "game1";

let collection;

async function start() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();

  const db = client.db(DB_NAME);
  collection = db.collection("playerData");

  // One save per user per game
  await collection.createIndex({ gameId: 1, userId: 1 }, { unique: true });

  console.log("Connected to MongoDB");
}

function defaultData() {
  return {
    Coins: 0,
    Level: 1,
  };
}

function auth(req, res, next) {
  const key = req.headers["x-api-key"];
  if (key !== API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

app.use(auth);

app.get("/:gameId/load/:userId", async (req, res) => {
  try {
    const gameId = req.params.gameId || DEFAULT_GAME_ID;
    const userId = String(req.params.userId);

    let doc = await collection.findOne({ gameId, userId });

    if (!doc) {
      const data = defaultData();

      await collection.insertOne({
        gameId,
        userId,
        data,
        updatedAt: new Date(),
      });

      return res.json(data);
    }

    return res.json(doc.data || defaultData());
  } catch (err) {
    console.error("Load error:", err);
    return res.status(500).json({ error: "Failed to load" });
  }
});

app.post("/:gameId/save", async (req, res) => {
  try {
    const gameId = req.params.gameId || DEFAULT_GAME_ID;
    const { userId, data } = req.body || {};

    if (!userId || typeof data !== "object") {
      return res.status(400).json({ error: "Missing userId or data" });
    }

    await collection.updateOne(
      { gameId, userId: String(userId) },
      {
        $set: {
          data,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          gameId,
          userId: String(userId),
        },
      },
      { upsert: true }
    );

    return res.json({ ok: true });
  } catch (err) {
    console.error("Save error:", err);
    return res.status(500).json({ error: "Failed to save" });
  }
});

start()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Startup error:", err);
    process.exit(1);
  });
