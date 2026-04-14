const express = require("express");
const app = express();
const PORT = 3000;

// Root route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

//core server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log("server lokal aktif")
});
