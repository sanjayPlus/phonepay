
const express = require('express');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
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
})
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
