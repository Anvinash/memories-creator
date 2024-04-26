const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises; 
const PORT = process.env.PORT | 3010;

const ImageModel = require("./imagemodel");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

mongoose.connect('mongodb://localhost:27017/imageUpload', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log("db is connected"))
    .catch((err) => console.log(err, "It has an error"));



app.set('views', path.join(__dirname, 'views'));

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Serve static files from the 'uploads' folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



// Storage configuration for multer
const storage = multer.diskStorage({
    destination: 'uploads',
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    },
});

const upload = multer({ storage: storage }).single('testImage');

// Serve the HTML file for uploading images
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'home.html'));
});

app.get('/form', (req, res) => {
    res.sendFile(path.join(__dirname, 'upload.html'));
});


// Handle image upload
app.post('/upload', (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Upload failed.');
        }

        // Save image data to MongoDB
        const newImage = new ImageModel({
            name: req.body.name,
            image: {
                data: req.file.buffer,
                contentType: req.file.mimetype
            }
        });
        newImage.save()
            .then(() => {
                // Send alert message
                res.send("<script>alert('Successfully uploaded'); window.location.href = '/display';</script>");
            })
            .catch(err => console.log(err));
    });
});

// Handle image deletion
app.delete('/delete', async (req, res) => {
    try {
        const { filename } = req.query;
        // Logic to delete the image with the given filename from the server
        const imagePath = path.join(__dirname, 'uploads', filename);
        await fs.unlink(imagePath); // Delete the image file
        // You might also need to delete the corresponding entry from the database if applicable
        res.sendStatus(200); // Send a success response
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});





app.get('/display', async (req, res) => {
    try {
        // Read all images from the 'uploads' folder
        const files = await fs.readdir('uploads');
        
        // Get all images stored in the database
        const images = await ImageModel.find({}).exec();
        
        // Assuming you have an array of dates corresponding to each image
        const dates = []; // Populate this array with the dates
        
        // Render HTML page with images and dates
        res.render('display', { images: images, uploadedFiles: files, dates: dates });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});





// Listen for connections
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});




