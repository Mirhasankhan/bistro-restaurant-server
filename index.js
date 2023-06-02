const express = require('express');
const app = express()
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const port = process.env.PORT || 5000;

// middlewares
app.use(cors())
app.use(express.json())


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

        //user api
        app.get('/users', async(req, res)=>{
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

        // menu api
        app.get('/menu', async(req, res)=>{
            const result = await menuCollection.find().toArray()
            res.send(result)
        })

        // reviews api
        app.get('/reviews', async(req, res)=>{
            const result = await reviewsCollection.find().toArray()
            res.send(result)
        })

        // cart collection apis

        app.get('/carts', async(req, res)=>{
            const email = req.query.email;
            if(!email){
                res.send([])
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
