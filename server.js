const express = require('express');
const path = require('path');
const fileUpload = require('express-fileupload');
const app = express();
const sharp = require('sharp');
const Promise = require("bluebird");

var staticPath = path.join(__dirname, '/public');
app.use(express.static(staticPath));

// default options
app.use(fileUpload());

const splitImage = function (filename, extention, timestamp) {
  return new Promise(function (resolve, reject) {
    const image = sharp(`./uploadedImages/${filename}_${timestamp}.${extention}`);
    image
      .metadata()
      .then(function (metadata) {
        console.log(metadata);
        let numImage = Math.floor(metadata.width / metadata.height);

        let croppingPromises = []
        for (let i = 0; i < numImage; i++) {
          croppingPromises.push(image
            .extract({ left: i * metadata.height, top: 0, width: metadata.height, height: metadata.height })
            .toFile(`./uploadedImages/${filename}_${timestamp}_${i+1}.${extention}`));
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

    const images = splitImage(filename, extention, timestamp);

    res.send(images);
  });
});

app.listen(3000, () => {
  console.log(`Server is listening on port 3000`);
});