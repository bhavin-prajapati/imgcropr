import React from 'react';
const queryString = require('query-string');

const IndexPage = () => {
  const params = queryString.parse(location.search);
  let page = "";
  if(Object.keys(params).length === 0) {
    page = (
      <div>
        <h1>Hi folks!</h1>
        <p>Welcome to imgcropr.</p>
        <p>Upload an image to begin.</p>
  
        <form
          id='uploadForm'
          action='http://localhost:3000/upload' 
          method='post'
          encType="multipart/form-data">
            <input type="file" name="imageFile" />
            <input type='submit' value='Upload!' />
        </form>
      </div>
    );
  } else {
    page = (
      <div>
        <p>Click the hamburger to perform to modify this image.</p>
        <img src={`http://localhost:3000/${params.image}`} />
      </div>
    );
  }
  
  return page;
};

export default IndexPage;
