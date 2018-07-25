import React from 'react'
import Link from 'gatsby-link'

const CropPage = () => (
  <div>
    <form
      id='uploadForm'
      action='http://localhost:3000/upload' 
      method='post'
      encType="multipart/form-data">
        <input type="file" name="imageFile" />
        <input type='submit' value='Upload!' />
    </form>
    <Link to="/">Go back to the homepage</Link>
  </div>
)

export default CropPage
