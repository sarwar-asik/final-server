const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const jwt = require('jsonwebtoken');
require('dotenv').config();
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

async function run() {
    try {
        const usersCollection = client.db("find_a_job").collection("users");

        // other site data 
        const dataUsersCollection = client.db("OldMarket").collection("usersCollection");


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