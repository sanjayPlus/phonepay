
const express = require('express');
const dotenv = require('dotenv');
const axios = require('axios');
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
app.get('/checkout/:amount/:name/:phone', async (req, res) => {
  try {
    const merchantTransactionId = crypto.randomBytes(16).toString('hex');
    const data = {
        merchantId: process.env.MERCHANT_ID,
        merchantTransactionId: merchantTransactionId,
        merchantUserId:"MUID" + Date.now(),
        name:  req.params.name,
        amount: req.params.amount * 100,
        redirectUrl: process.env.REDIRECT_URL+"/status/" + merchantTransactionId,
        redirectMode: 'POST',
        mobileNumber: req.params.phone,
        paymentInstrument: {
            type: 'PAY_PAGE'
        }
    };
    const payload = JSON.stringify(data);
    const payloadMain = Buffer.from(payload).toString('base64');
    const keyIndex = 1;
    const string = payloadMain + '/pg/v1/pay' + process.env.PHONEPAY_API_KEY;
    const sha256 = crypto.createHash('sha256').update(string).digest('hex');
    const checksum = sha256 + '###' + keyIndex;

    const prod_URL = "https://api.phonepe.com/apis/hermes/pg/v1/pay"
    const options = {
        method: 'POST',
        url: prod_URL,
        headers: {
            accept: 'application/json',
            'Content-Type': 'application/json',
            'X-VERIFY': checksum
        },
        data: {
            request: payloadMain
        }
    };

    axios.request(options).then(function (response) {
        console.log(response.data)
        return res.redirect(response.data.data.instrumentResponse.redirectInfo.url)
    })
    .catch(function (error) {
        console.error(error);
    });

} catch (error) {
    res.status(500).send({
        message: error.message,
        success: false
    })
}
});
app.get('/payment/:amount/:name/:phone', async (req, res) => {
  try {
    const merchantTransactionId = crypto.randomBytes(16).toString('hex');
    const data = {
        merchantId: process.env.MERCHANT_ID,
        merchantTransactionId: merchantTransactionId,
        merchantUserId:"MUID" + Date.now(),
        name:  req.params.name,
        amount: req.params.amount * 100,
        redirectUrl: process.env.REDIRECT_URL+"/status/" + merchantTransactionId,
        redirectMode: 'POST',
        mobileNumber: req.params.phone,
        paymentInstrument: {
            type: 'PAY_PAGE'
        }
    };
    const payload = JSON.stringify(data);
    const payloadMain = Buffer.from(payload).toString('base64');
    const keyIndex = 1;
    const string = payloadMain + '/pg/v1/pay' + process.env.PHONEPAY_API_KEY;
    const sha256 = crypto.createHash('sha256').update(string).digest('hex');
    const checksum = sha256 + '###' + keyIndex;

    const prod_URL = "https://api.phonepe.com/apis/hermes/pg/v1/pay"
    const options = {
        method: 'POST',
        url: prod_URL,
        headers: {
            accept: 'application/json',
            'Content-Type': 'application/json',
            'X-VERIFY': checksum
        },
        data: {
            request: payloadMain
        }
    };

    axios.request(options).then(function (response) {
        console.log(response.data)
        return res.status(200).json(response.data.data.instrumentResponse.redirectInfo.url);
    })
    .catch(function (error) {
        console.error(error);
    });

} catch (error) {
    res.status(500).send({
        message: error.message,
        success: false
    })
}
});




app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
