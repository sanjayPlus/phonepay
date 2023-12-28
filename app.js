
const express = require('express');
const dotenv = require('dotenv');
const axios = require('axios');
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/phonepay')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.log('Error connecting to MongoDB:', err));

const phonePaySchema = new mongoose.Schema({
  data:Object,
  name:String,
  phone:String
})
const PhonePay = mongoose.model('PhonePay',phonePaySchema);
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
        redirectUrl: process.env.REDIRECT_URL+"/status/" + merchantTransactionId+"/"+process.env.MERCHANT_ID+"/"+req.params.name+"/"+req.params.phone,
        redirectMode: 'GET',
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

    const prod_URL = process.env.API_URL+"/pg/v1/pay"
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
        redirectUrl: process.env.REDIRECT_URL+"/status/" + merchantTransactionId+"/"+process.env.MERCHANT_ID+"/"+req.params.name+"/"+req.params.phone,
        redirectMode: 'GET',
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

    const prod_URL = process.env.API_URL+"/pg/v1/pay"
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
        return res.status(200).json({url:response.data.data.instrumentResponse.redirectInfo.url});
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

app.get('/status/:transactionId/:merchantId/:name/:phone', async (req, res) => {
  const merchantTransactionId = req.params.transactionId
    const merchantId = req.params.merchantId
    const  name =  req.params.name;
    const  phone =  req.params.phone;
    console.log(name,phone)
    const keyIndex = 1;
    const string = `/pg/v1/status/${merchantId}/${merchantTransactionId}` + process.env.PHONEPAY_API_KEY;
    const sha256 = crypto.createHash('sha256').update(string).digest('hex');
    const checksum = sha256 + "###" + keyIndex;

    const options = {
    method: 'GET',
    url: `${process.env.API_URL}/pg/v1/status/${merchantId}/${merchantTransactionId}`,
    headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
        'X-VERIFY': checksum,
        'X-MERCHANT-ID': `${merchantId}`
    }
    };

    // CHECK PAYMENT TATUS
    axios.request(options).then(async(response) => {
        if (response.data.success === true) {
          const phonePay = new PhonePay({
            data:response.data.data,
            name:name,
            phone:phone
          })
          await phonePay.save()

            const url = `${process.env.REDIRECT_URL}/success`
            return res.redirect(url)
        } else {
            const url = `${process.env.REDIRECT_URL}/failure`
            return res.redirect(url)
        }
    })
    .catch((error) => {
        console.error(error);
    });
})
app.get("/success", (req, res) => {
  res.send("Payment Successful");
})
app.get("/failure", (req, res) => {
  res.send("Payment Failed");
})
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
