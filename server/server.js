const express = require('express');
const path = require('path');
const fileUpload = require('express-fileupload');
const app = express();
const sharp = require('sharp');
const Promise = require("bluebird");

var staticPath = path.join(__dirname, '/uploadedImages');
app.use(express.static(staticPath));

// default options
app.use(fileUpload());

const splitImage = function (id, extention) {
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

app.post('/crop/:id', function (req, res) {
  if (!req.files)
    return res.status(400).send('No files were uploaded.');

  let file = req.files.imageFile;
  const filename = file.name.split('.')[0];
  const extention = file.name.split('.')[1];
  const timestamp = (new Date()).valueOf();

  // Use the mv() method to place the file somewhere on your server
  file.mv(`./uploadedImages/${req.params.id}.${extention}`, function (err) {
    if (err)
      return res.status(500).send(err);
    
    splitImage(req.params.id).then((result) => {
      res.redirect(`/crop/${req.params.id}/result`);
    });
  });
});

app.listen(3000, () => {
  console.log(`Server is listening on port 3000`);
});