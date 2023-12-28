
const express = require('express');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 4222;
const crypto = require('crypto');
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!');
});
app.post('/checksum',async(req,res)=>{

    const base64String = Buffer.from(JSON.stringify(req.body)).toString('base64');


    const payloadHash = crypto.createHash('sha256')
      .update(base64String + "/pg/v1/pay" + process.env.PHONEPAY_API_KEY)
      .digest('hex') + '###' + '1';

    res.send(payloadHash);
});
app.post('/base64',async(req,res)=>{

    const base64String = Buffer.from(JSON.stringify(req.body)).toString('base64');
    res.send(base64String);
})
app.get('/checkout', async (req, res) => {
  try {
    const checksum = "d7a8e4458caa6fcd781166bbdc85fec76740c18cb9baa9a4c48cf2387d554180###1";
    const body = "ewogICJtZXJjaGFudElkIjogIlBHVEVTVFBBWVVBVCIsCiAgIm1lcmNoYW50VHJhbnNhY3Rpb25JZCI6ICJNVDc4NTA1OTAwNjgxODgxMDQiLAogICJtZXJjaGFudFVzZXJJZCI6ICJNVUlEMTIzIiwKICAiYW1vdW50IjogMTAwMDAsCiAgInJlZGlyZWN0VXJsIjogImh0dHBzOi8vd2ViaG9vay5zaXRlL3JlZGlyZWN0LXVybCIsCiAgInJlZGlyZWN0TW9kZSI6ICJSRURJUkVDVCIsCiAgImNhbGxiYWNrVXJsIjogImh0dHBzOi8vd2ViaG9vay5zaXRlL2NhbGxiYWNrLXVybCIsCiAgIm1vYmlsZU51bWJlciI6ICI5OTk5OTk5OTk5IiwKICAicGF5bWVudEluc3RydW1lbnQiOiB7CiAgICAidHlwZSI6ICJQQVlfUEFHRSIKICB9Cn0=";

    const response = await fetch("https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay", {
      method: "POST",
      headers: {
        accept: 'text/plain',
        'Content-Type': 'application/json',
        "X-VERIFY": checksum,
      },
      body: JSON.stringify(body),
    });
   
    if (!response.ok) {
      throw new Error('Failed to initiate payment');
    }

    const result = await response.json(); // Parse response body as JSON
    console.log(result); // Log the response data
    res.status(200).json({ message: 'success', data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
