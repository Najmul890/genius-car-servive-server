const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion} = require('mongodb');
const jwt = require('jsonwebtoken');
require("dotenv").config();
const port = process.env.PORT || 5000;
const ObjectId = require('mongodb').ObjectId;
const app=express();

//middleware
app.use(cors());
app.use(express.json());


const verifyJWT=(req,res, next)=>{
    const authHeader= req.headers.authorization;
    if(!authHeader){
        return res.status(401).send({message:'unauthorized access'})
    }
    const token= authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded)=>{
        if(err){
            return res.status(403).send({message: 'Forbidden Access'});
        }
        
        req.decoded=decoded;
        next();
    })
    
    
}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.pukwa.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
        await client.connect();
        const serviceCollection= client.db("geniusCar").collection("services");
        const orderCollection= client.db("geniusCar").collection("orders");
        
        
        //AUTH
        app.post('/login', async(req,res)=>{
            const user= req.body;
            const accessToken= jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1d'
            });
            res.send({accessToken});
        })

        //get services
        app.get("/services", async(req, res)=>{
            const query={};
            const cursor= serviceCollection.find(query);
            const services= await cursor.toArray();
            res.send(services);
        })

        //find single service via id
        app.get("/service/:id", async(req,res)=>{
            const id= req.params.id;
            const query= {_id: ObjectId(id)};
            const service= await serviceCollection.findOne(query);
            res.send(service);
        })

        //post a service
        app.post("/service", async(req, res)=>{
            const newService= req.body;
            const result= await serviceCollection.insertOne(newService);
            res.send(result);
        })

        //delete a service
        app.delete("/service/:id", async(req,res)=>{
            const id= req.params.id;
            const query= {_id: ObjectId(id)};
            const result= await serviceCollection.deleteOne(query);
            res.send(result);
        })

        //get all orders
        app.get('/orders', verifyJWT, async(req, res)=>{
            const decodedEmail= req.decoded.email;
            const email= req.query.email;
            if(email===decodedEmail){
                const query={email: email};
                const cursor= orderCollection.find(query);
                const result= await cursor.toArray();
                res.send(result);
            }else{
                res.status(403).send({message: 'forbidden access'})
            }
        })

        //create a order
        app.post("/order", async(req,res)=>{
            const newOrder= req.body;
            const result= await orderCollection.insertOne(newOrder);
            res.send(result);
        })
    }
    finally{}

}

run().catch(console.dir)


app.get('/',(req,res)=>{
    res.send("genius car service server is running")
})

app.listen(port, ()=>{
    console.log("Listening to port",port);
})