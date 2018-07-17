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
        let numImage = metadata.width / metadata.height;
        for(let i = 0; i < )
        return image
          .extract({ left: 0, top: 0, width: 666, height: 666 })
          .toFile(`./uploadedImages/${filename}_${timestamp}_1.${extention}`);
      })
      .then(function (info, err) {
        console.log(err);
        if (err) {
          reject({ status: "failed" });
        }
        resolve({ status: "success" });
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