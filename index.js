const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const jwt = require('jsonwebtoken');
require('dotenv').config();
const stripe = require("stripe")("sk_test_51M6TOhLZ8s0yewmCKIERlWDqgmuV0dUPMcqr6t68lquLbV9ES0l7wH2zsYyXgZUjwvvhxFeUujmMHDWRGVOZnxSM00E1Hd7kmq");
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


app.get('/', async (req, res) => {
    res.send('Find A Job server is running')
})

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.bbbtstv.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('UnAuthorized Access')
    }
    const token = authHeader.split(' ')[1];
    // console.log(token)
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            console.log('token a somossa')
            return res.status(403).send({ Massage: 'Forbidden Access' })
        }
        req.decoded = decoded;
        next()
    })
}

app.post('/user/jwt', (req, res) => {
    const user = (req.body)
    const token = jwt.sign(user, process.env.ACCESS_TOKEN)
    res.send({ token })
    // console.log(user)
})

app.post("/payment/intent", async (req, res) => {
    // console.log('hit')
    try {
        const { amount } = req.body
        const amou = amount * 100
        const paymentIntent = await stripe.paymentIntents.create({
            currency: 'usd',
            amount: amou,
            "payment_method_types": [
                "card"
            ]
        })
        // console.log(paymentIntent)
        res.send({
            success: true,
            message: 'Successfully stripe payment created',
            clientSecret: paymentIntent.client_secret
        })
    } catch (error) {
        console.log(error)
        res.send({
            success: false,
            error: error.message
        })
    }
})



async function run() {
    try {
        const usersCollection = client.db("find_a_job").collection("users");

        // other site data 
        const dataUsersCollection = client.db("OldMarket").collection("usersCollection");

        // currency data fetch
        const currencyCollection = client.db("find_a_job").collection("currency");
        const jobsCollection = client.db("find_a_job").collection("jobsCollection");


        // get current user to update subscribetion status
        app.put("/users/subscribe/:email", async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const option = { upsert: true };
            const updatedUser = {
                $set: {
                    isSubscibed: true
                }
            }
            const result = await usersCollection.updateOne(filter, updatedUser, option)
            res.send({ message: "subscription completed", data: result })
        })
        app.get('/currency', async (req, res) => {
            const query = {}
            const currency = await currencyCollection.find(query).toArray()
            res.send(currency);
        })





        // This is for Find Job 




        app.post('/jobs', async (req, res) => {
            console.log(req.body);
            const jobInfo = req.body;
            const result = await jobsCollection.insertOne(jobInfo);
            res.send(result)
        })

        app.get('/jobs', async (req, res) => {
            const jobstype = req.query.jobstype;
            const result = await jobsCollection.find({}).toArray();
            console.log(jobstype);
            if (jobstype === "all") {
                res.send(result)
            }
            else {
                const filterData = result.filter(job => job.job_details.job.job_title.toLowerCase().includes(jobstype))
                // console.log(filterData);
                res.send(filterData)
            }
        })

        app.post('/jobs/exp', async (req, res) => {
            const checkItem = req.body;
            const result = await jobsCollection.find({}).toArray();
            console.log(checkItem);

            const filterData = result.filter(job => {
                let filData = checkItem.forEach(item => item.toLowerCase() === job.job_details.experience.toLowerCase())
                console.log(filData);
                return filData
            })
            // console.log(filterData);
            // res.send(filterData)

            // for (const exp of checkItem) {
            //     let filterData = result.filter(job => {
            //         job.job_details.experience === exp;
            //     }
            //     )
            console.log(filterData);

            // }
        })



        app.get('/jobDetails/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id)
            const job = await jobsCollection.findOne({ _id: ObjectId(id) })
            res.send(job)
        })





        // this is for user 



        // this is user create api 
        app.post('/addUsers', async (req, res) => {
            console.log(req.body);
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result)
        })

        // this is for check user type 
        app.get('/checkUser/type', async (req, res) => {
            const email = req.query.email;
            const query = {
                email: email
            }
            const user = await usersCollection.findOne(query)
            if (!user) {
                return res.status(401).send('You Have No account')
            }
            const userType = user.userType;
            // console.log(user)
            res.json(userType);
        })


    }
    finally {

    }

}
run().catch(console.log);


app.listen(port, () => console.log(`find job Server Running on port ${port}`))