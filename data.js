const express = require("express");
const mongoose = require("mongoose");

const app = express();
app.use(express.json());

const PORT = 10000;
const MONGODB_URI = "mongodb+srv://peepeemanok_db_user:goononmytoes@cluster0.yb5p0oc.mongodb.net/?appName=Cluster0";

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

const userDataSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    Coins: {
      type: Number,
      default: 0,
    },
    Level: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

const UserData = mongoose.model("UserData", userDataSchema);

function defaultData(userId) {
  return {
    userId,
    Coins: 0,
    Level: 1,
  };
}

app.get("/load/:userId", async (req, res) => {
  const { userId } = req.params;

  console.log("LOAD request for:", userId);

  try {
    let user = await UserData.findOne({ userId });

    if (!user) {
      user = await UserData.create(defaultData(userId));
      console.log("Created new record for:", userId);
    }

    return res.json({
      userId: user.userId,
      Coins: user.Coins,
      Level: user.Level,
    });
  } catch (err) {
    console.error("Load error:", err);
    return res.status(500).json({ error: "Failed to load user data" });
  }
});

app.post("/save", async (req, res) => {
  const { userId, data } = req.body || {};

  console.log("SAVE request for:", userId);

  if (!userId || typeof data !== "object" || data === null) {
    return res.status(400).json({ error: "Missing userId or data" });
  }

  try {
    const updated = await UserData.findOneAndUpdate(
      { userId },
      {
        $set: {
          Coins: typeof data.Coins === "number" ? data.Coins : 0,
          Level: typeof data.Level === "number" ? data.Level : 1,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    console.log("Saved record for:", userId);

    return res.json({
      ok: true,
      data: {
        userId: updated.userId,
        Coins: updated.Coins,
        Level: updated.Level,
      },
    });
  } catch (err) {
    console.error("Save error:", err);
    return res.status(500).json({ error: "Failed to save" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
