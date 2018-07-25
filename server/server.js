const express = require('express');
const path = require('path');
const fs = require('fs');
const fileUpload = require('express-fileupload');
const app = express();
const sharp = require('sharp');
const Promise = require("bluebird");


var staticPath = path.join(__dirname, '/uploadedImages');
app.use(express.static(staticPath));

// default options
app.use(fileUpload());

// CORS
if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'acceptance') {
  app.use((req, res, next) => {
      res.removeHeader('x-powered-by');
      res.header('Access-Control-Allow-Origin', 'http://localhost:8000');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
      next();
  });
}

const splitImage = function (id, extention = 'jpg') {
  return new Promise(function (resolve, reject) {
    const image = sharp(`./uploadedImages/${id}.${extention}`);
    image
      .metadata()
      .then(function (metadata) {
        console.log(metadata);
        let numImage = Math.floor(metadata.width / metadata.height);

        let croppingPromises = []
        for (let i = 0; i < numImage; i++) {
          croppingPromises.push(image
            .extract({ left: i * metadata.height, top: 0, width: metadata.height, height: metadata.height })
            .toFile(`./uploadedImages/${id}_${i+1}.${extention}`));
        }

        Promise.all(croppingPromises)
          .then(function () {
            console.log("all the files were created");
            resolve({ status: "success" });
          })
          .catch(function () {
            reject({ status: "failed" });
          });
      });
  });
};

const getFilename = function(fileName) {
  return fileName.split('.')[0];
}

app.post('/upload', function (req, res) {
  if (!req.files)
    return res.status(400).send('No files were uploaded.');

  let file = req.files.imageFile;

  const filename = file.name.split('.')[0];
  const extention = file.name.split('.')[1];
  const timestamp = (new Date()).valueOf();

  // Use the mv() method to place the file somewhere on your server
  file.mv(`./uploadedImages/${filename}_${timestamp}.${extention}`, function (err) {
    if (err)
      return res.status(500).send(err);
    
    res.redirect(`http://localhost:8000?image=${filename}_${timestamp}.${extention}`);
  });
});

app.get('/crop/:results?', function (req, res) {
  let results = req.params.results;
  let imageId = getFilename(req.query.image);
  if(!results) {
    if (!req.query.image)
      return res.status(400).send('Unknown image');
    splitImage(imageId).then(function(result) {
      res.redirect(`/crop/results?${req.query.image}`);
    });
  } else {
    let files = fs.readdirSync(`./uploadedImages`);
    let match = new RegExp(`${imageId}_`);
    console.log(imageId);
    let images = files.filter(function(file) {
      return file.match(match);
    });
    res.send(images);
  }
});

app.listen(3000, () => {
  console.log(`Server is listening on port 3000`);
});
