const express = require('express');
const app = express()
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const port = process.env.PORT || 5000;

// require('crypto').randomBytes(64).toString('hex')

// middlewares
app.use(cors())
app.use(express.json())

const verifyJWT = (req, res, next)=>{
    const authorization = req.headers.authorization;
    if(!authorization){
        return res.status(401).send({error: true, message: 'Unauthorized Access'})
    }
    const token = authorization.split(' ')[1]
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded)=>{
        if(err){
            return res.status(401).send({error: true, message: 'Unauthorized Access'})
        }
        req.decoded = decoded;
        next()
    })
}


const uri = `mongodb+srv://bistroUser:4sONmGeSmk4zuGn5@cluster0.cpvrkgd.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection
        const usersCollection = client.db('bistroDB').collection('users')
        const menuCollection = client.db('bistroDB').collection('menu')
        const reviewsCollection = client.db('bistroDB').collection('reviews')
        const cartCollection = client.db('bistroDB').collection('carts')

        app.post('/jwt', (req, res)=>{
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'})
            res.send({token})
        })

        const verifyAdmin = async(req, res, next)=>{
            const email = req.decoded.email;
            const query = {email: email}
            const user = await usersCollection.findOne(query)
            if(user?.role !== 'admin'){
                return res.status(403).send({error: true, messsage: 'forbidden'})
            }
            next()
        }

        //user api
        app.get('/users', verifyJWT, verifyAdmin, async(req, res)=>{
            const result = await usersCollection.find().toArray()
            res.send(result)
        })
        app.post('/users', async(req, res)=>{
            const user = req.body;
            const query = {email: user.email}
            const existingUser = await usersCollection.findOne(query)           
            if(existingUser){
                return res.send({message: 'User already exist'})
            }
            const result = await usersCollection.insertOne(user)
            res.send(result)
        })

        app.get('/users/admin/:email', verifyJWT, async(req, res)=>{
            const email = req.params.email;
            if(req.decoded.email !== email){
                return res.send({admin: false})
            }
            const query = {email: email}
            const user = await usersCollection.findOne(query)
            const result = {admin : user?.role === 'admin'}         
            res.send(result)
        })

        app.patch('/users/admin/:id', async (req, res)=>{
            const id = req.params.id;
            const filter = {_id : new ObjectId(id)}
            const updatedRole = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await usersCollection.updateOne(filter, updatedRole)
            res.send(result)
        })

        // menu api
        app.get('/menu', async(req, res)=>{
            const result = await menuCollection.find().toArray()
            res.send(result)
        })

        app.post('/menu',verifyJWT, verifyAdmin, async(req, res)=>{
            const item = req.body;
            const result = await menuCollection.insertOne(item)
            res.send(result)
        })

        // reviews api
        app.get('/reviews', async(req, res)=>{
            const result = await reviewsCollection.find().toArray()
            res.send(result)
        })

        // cart collection apis

        app.get('/carts', verifyJWT, async(req, res)=>{
            const email = req.query.email;
            if(!email){
                res.send([])
            }
            const decodedEmail = req.decoded.email;
            if(email !== decodedEmail){
                res.status(403).send({error: true, message: 'Forbidden Access'})
            }
            const query = {email: email}
            const result = await cartCollection.find(query).toArray()
            res.send(result)
        })
        app.post('/carts', async(req, res)=>{
            const item = req.body;
            // console.log(item);
            const result = await cartCollection.insertOne(item)
            res.send(result)
        })

        app.delete('/carts/:id', async(req, res)=>{
            const id = req.params.id;
            const query = {_id : new ObjectId(id)}
            const result = cartCollection.deleteOne(query)
            res.send(result)
        })

        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('bistro boss server')
})

app.listen(port, () => {
    console.log('bistro server running at 5000');
})
