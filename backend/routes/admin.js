// backend/routes/admin.js
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('admin');  // Render the admin.ejs file
});

module.exports = router;
