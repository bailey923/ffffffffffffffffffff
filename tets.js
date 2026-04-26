const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());

const DATA_DIR = path.join(__dirname, "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function defaultData() {
  return {
    Coins: 0,
    Level: 1,
  };
}

app.get("/load/:userId", (req, res) => {
  const userId = req.params.userId;
  const filePath = path.join(DATA_DIR, `${userId}.json`);

  console.log("LOAD request for:", userId);
  console.log("File path:", filePath);

  if (!fs.existsSync(filePath)) {
    const data = defaultData();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log("Created new file for:", userId);
    return res.json(data);
  }

  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(raw);
    return res.json(data);
  } catch (err) {
    console.error("Load error:", err);
    const data = defaultData();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return res.json(data);
  }
});

app.post("/save", (req, res) => {
  const { userId, data } = req.body || {};

  console.log("SAVE request for:", userId);

  if (!userId || typeof data !== "object") {
    return res.status(400).json({ error: "Missing userId or data" });
  }

  const filePath = path.join(DATA_DIR, `${userId}.json`);

  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log("Saved file for:", userId);
    return res.json({ ok: true });
  } catch (err) {
    console.error("Save error:", err);
    return res.status(500).json({ error: "Failed to save" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
