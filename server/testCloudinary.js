import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log("Cloud name:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("API key:", process.env.CLOUDINARY_API_KEY ? "Loaded" : "Missing");
console.log("API secret:", process.env.CLOUDINARY_API_SECRET ? "Loaded" : "Missing");

cloudinary.uploader.upload(
    "./test-image.jpg",
    {
        resource_type: "image"
    }
)
.then(result => {
    console.log("UPLOAD SUCCESS!");
    console.log("Image URL:", result.secure_url);
})
.catch(error => {
    console.log("UPLOAD FAILED");
    console.log("Message:", error.message);
    console.log("HTTP Code:", error.http_code);
    console.log(error);
});