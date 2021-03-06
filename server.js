require('dotenv').config();
const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect(process.env.MLAB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const { Schema } = mongoose;
app.use(cors())

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())


app.use(express.static('public'))



let UserSchema = new Schema({
  username: { type: String, required: true }
})

let User = mongoose.model('User', UserSchema);

let exerciceSchema = new Schema({
  userId: { type: String, required: true },

  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date }

})

let Exercice = mongoose.model("exercice", exerciceSchema);



app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
 
});



app.get("/api/exercise/users", (req, res) => {
  User.find((err, data) => {
    if(err) console.log("error getting users")
    res.json(data)
  })

})

app.post("/api/exercise/new-user", function (req, res) {


 
  let username = req.body.username;
  User.findOne({username:username},function(err,data){
    if(err) console.log("error adding user 1")
    if(data !=undefined){
      res.send("username alredy taken");
    }else{
      console.log("inserting user ...");
      const doc = new User({
        username: username
      })
      doc.save(function (err, data) {
        if(err) console.log("error adding user 2")
        res.json({
          username,
          _id: data._id
        })
      })
    }
  })
  

})




app.post("/api/exercise/add", (req, res) => {
  let userId = req.body.userId;
  let description = req.body.description;
  let duration = req.body.duration;

  let date = new Date(req.body.date == "" || req.body.date==undefined   ? new Date().toDateString() : req.body.date)
  

  User.findById(userId, function (err, data) {
    if(err) console.log("adding exercise 1")
    if (data == undefined) {
      res.send("there is no such user with id =" + userId);
    } else {

      const doc = new Exercice({

        userId: userId,
        description: description,
        duration: duration,
        date: date

      })
      doc.save(function (err, exerciceData) {

        if(err) {
          console.log(userId +" "+description+" "+duration+" "+req.body.date)
          console.log("error find")
          res.send("error") 
          return;}
        res.json({
          _id: userId,
          username: data.username,
          date: date.toDateString(),
          duration: parseInt(duration),
          description: description
        })
      })
    }

  })

})


app.get("/api/exercise/log", function (req, res) {

  let userId = req.query.userId;
  let from = req.query.from;
  let to = req.query.to;
  let limit = req.query.limit;
  User.findById(userId, function(err, data) {
    if(err) console.log("error logging ex 1")
      if (data == undefined) {
        res.send("unknown userID");
      } 
      else 
      {
        
        let result = Exercice.find({userId})
        if (from != undefined) {
          result = result.where('date').gt(from)
        }

        if (to != undefined) {
          result = result.where('date').lt(to)
        }

        if (limit != undefined) {
          result = result.limit(parseInt(limit))

        }
      
        result.select({_id:0,description:1,duration:1,date:1}).exec(function (err, selectData) {
          if(err) console.log("error logging ex 2")
          if(err) console.log("error")
          let formattedDatearray = selectData.map((x)=>{
            
            return {
              description:x.description,
              duration:x.duration,
              date:x.date.toDateString()
            }
          })
       
          console.log("loging exercise data")
          let responseObj={}
          responseObj["_id"]=data._id;
          responseObj["username"]=data.username;
          responseObj["count"]=formattedDatearray.length;
          responseObj["log"]=formattedDatearray;
          
          res.json(responseObj);
        })
      

      }
  

  })

})

  




  // Not found middleware
  app.use((req, res, next) => {
    return next({ status: 404, message: 'not found' })
  })

  // Error Handling middleware
  app.use((err, req, res, next) => {
    let errCode, errMessage

    if (err.errors) {
      // mongoose validation error
      errCode = 400 // bad request
      const keys = Object.keys(err.errors)
      // report the first validation error
      errMessage = err.errors[keys[0]].message
    } else {
      // generic or custom error
      errCode = err.status || 500
      errMessage = err.message || 'Internal Server Error'
    }
    res.status(errCode).type('txt')
      .send(errMessage)
  })




  const listener = app.listen(process.env.PORT || 3000, () => {
    console.log('Your app is listening on port ' + listener.address().port)
  })
