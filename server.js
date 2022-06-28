require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const mongoose = require('mongoose')

const app = express()

const port = parseInt(process.env.PORT) || 5000

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    UseUnifiedTopology: true
}).then(() => {
    console.log('Connected to mongodb')
}).catch((err) => {
    console.log('Error occured', err)
})

app.use(bodyParser.json())

app.use(cors())

const stripe = require('stripe')(process.env.STRIPE_KEY)

const storeItems = new Map([
        [1, {unit_amount: 10000, name: "8GB Ram"}],
        [2, {unit_amount: 20000, name: "16GB Ram"}],
    ]
)

app.post('/payment', async (req,res) => {
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: req.body.items.map(item => {
               const storeItem = storeItems.get(item.id)
                return {
                   price_data: {
                       currency: 'USD',
                       product_data: {
                           name: storeItem.name,
                       },
                       unit_amount: storeItem.unit_amount
                   },
                    quantity: item.quantity
                }
            }),
            success_url: `http://localhost:3000/success`,
            cancel_url: `http://localhost:3000/cancel`,
        })
        res.json({url: session.url})
    }catch (e){
        res.status(500).json({error: e.message})
    }

})

app.listen(port, () => {
    console.log(`Server listening on port: ${port}`)
})