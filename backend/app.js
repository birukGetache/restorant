// backend/app.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
// Create the app
const app = express();
app.use(express.json()); // Middleware to parse JSON bodies
app.use(cors());
// Define the path to your data.json file
const dataFilePath = path.join(__dirname, '../src/data.json'); // Adjust this path as necessary

// GET route to fetch items
app.get('/api/items', (req, res) => {
    fs.readFile(dataFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to read data' });
        }
        try {
            const items = JSON.parse(data);
            res.json(items);
        } catch (parseError) {
            res.status(500).json({ error: 'Failed to parse data' });
        }
    });
});

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, '../public/images'); // Ensure this folder exists, or create it
  },
  filename: (req, file, cb) => {
    // Create a unique filename based on the current timestamp and file extension
    const uniqueFilename = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueFilename);
  },
});

// Initialize upload
const upload = multer({ storage: storage }).single('Image');

// API to handle item creation
app.post('/api/items', upload, (req, res) => {
  // Convert Price and Rate to numbers
  const price = parseFloat(req.body.Price);
  const rate = parseFloat(req.body.Rate);

  // Check if the conversions were valid
  if (isNaN(price) || isNaN(rate)) {
      return res.status(400).json({ error: 'Price and Rate must be valid numbers' });
  }

  const newItem = {
      id: Date.now().toString(),
      Name: req.body.Name,
      Type: req.body.Type,
      Price: price, // Use the numeric value
      Rate: rate, // Use the numeric value
      detail: req.body.detail,
      ImagePath: `./images/${req.file.filename}` // This should reflect the relative path from your public folder
  };

  fs.readFile(dataFilePath, 'utf8', (err, data) => {
      if (err) {
          return res.status(500).json({ error: 'Failed to read data' }); // Return early if there's an error
      }

      let items = [];
      try {
          items = JSON.parse(data);
      } catch (parseError) {
          return res.status(500).json({ error: 'Failed to parse data' }); // Return early on parse error
      }

      items.push(newItem);

      fs.writeFile(dataFilePath, JSON.stringify(items, null, 2), (writeErr) => {
          if (writeErr) {
              return res.status(500).json({ error: 'Failed to save new item' }); // Return early on write error
          }
          res.status(201).json(newItem); // Only send response once here
      });
  });
});
app.put('/api/items/:id', (req, res) => {
  const itemId = req.params.id; // Get the ID from the URL
  const updatedItem = req.body; // Get the updated item data from the request body

  fs.readFile(dataFilePath, 'utf8', (err, data) => {
      if (err) {
          return res.status(500).json({ error: 'Failed to read data' });
      }

      let items;
      try {
          items = JSON.parse(data);
      } catch (parseError) {
          return res.status(500).json({ error: 'Failed to parse data' });
      }

      // Find the item to update
      const itemIndex = items.findIndex(item => item.id === itemId);
      if (itemIndex === -1) {
          return res.status(404).json({ error: 'Item not found' });
      }

      // Update the item, preserving the other fields
      items[itemIndex] = {
          ...items[itemIndex], // Preserve other current fields
          ...updatedItem, // Add updated fields from request body
      };

      // Write the updated data back to the file
      fs.writeFile(dataFilePath, JSON.stringify(items, null, 2), (writeErr) => {
          if (writeErr) {
              return res.status(500).json({ error: 'Failed to save updated item' });
          }
          res.status(200).json(items[itemIndex]); // Return the updated item
      });
  });
});


app.post('/api/update-data', (req, res) => {
  const { rate, total } = req.body;
  console.log(rate, total);
  const dataPath = path.join(__dirname, '../src/data.json'); // Adjust path as needed

  // Read existing data
  fs.readFile(dataPath, 'utf8', (err, data) => {
    if (err) return res.status(500).send('Error reading data');

    const jsonData = JSON.parse(data);

    // Update data
    jsonData.rate = rate;
    jsonData.total = total;

    // Write updated data
    fs.writeFile(dataPath, JSON.stringify(jsonData, null, 2), (err) => {
      if (err) return res.status(500).send('Error writing data');
      res.status(200).send('Data updated successfully');
    });
  });
});


const deleteItemById = (id) => {
  return new Promise((resolve, reject) => {
    fs.readFile(dataFilePath, 'utf8', (err, data) => {
      if (err) return reject(err);
      try {
        const items = JSON.parse(data);
        const updatedItems = items.filter(item => item.id !== id); // Filter out the item to delete

        // Write the updated items back to the data.json file
        fs.writeFile(dataFilePath, JSON.stringify(updatedItems, null, 2), (writeErr) => {
          if (writeErr) return reject(writeErr);
          resolve(); // Successfully deleted
        });
      } catch (parseError) {
        reject(parseError);
      }
    });
  });
};


app.delete('/api/items/:id', (req, res) => {
  const { id } = req.params;

  // Logic to delete item from database using the provided ID
  // Assuming you have a function deleteItemById that handles this
  deleteItemById(id)
    .then(() => res.status(204).send()) // No content to return on successful delete
    .catch(err => res.status(500).json({ error: 'Could not delete item' }));
});

// Start the server
const PORT = process.env.PORT || 5176;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});