/*jshint esversion: 6 */
//For database
const mongoose = require('mongoose');
const expense = require('./schema/Expense_Schema.js');
const metadata = require('./schema/Metadata_Schema.js');
const db = 'mongodb://localhost:27017/expenseTracker';

//For API
const express = require('express');
const app = express();
const port = 8080;  
const bodyParse = require('body-parser');
const moment = require("moment");

//For generating CSV
const converter = require('json-2-csv');
const fs = require("fs");
const os = require("os");
app.use(bodyParse.json());   // to extract data for post request from the body.

//For sending Email
const Request = require("request");

mongoose.connect(db,(err)=>{
    if (err) throw err; 
    else
    console.log('Mongoose is connected');
});

// To test connection and basic routes
app.get('/', (req,res)=>{
    res.send("Welcome to Expense Tracker");
});

app.get('/getExpense', (req,res)=>{
    // console.log(req.query.startDate);
    let startDate = new Date(req.query.startDate).toISOString(); //2019-05-27
    let endDate = new Date(req.query.endDate).toISOString();

    expense.find(
        {
            'userID' :req.query.userID,
            $and :[{'date' : {'$gte' : moment(startDate).toISOString()}},{'date': {'$lte':moment(endDate).toISOString()}}]
        },
        // {
        //     $and : [{'userID' :req.params.userID},
        //             {'date' :{'$gte': startDate, '$lte': endDate }}]},
        (err,data)=>{
        if (err) {
            return res.status(500).send({success: false, errorMessage:err});
        }
        if (!data.length) {        
            return res.status(404).send({success: false, errorMessage:"No expense found for the given time period"});
        }
        return res.status(200).send({success: true, data:data});
    });
});

app.post('/addExpense',(req,res)=>{
    
    let newExpense= new expense();
    
    newExpense.userID = req.body.userID;
    newExpense.expenseTitle = req.body.expenseTitle;
    newExpense.currency = req.body.currency;
    newExpense.amount = (req.body.amount);
    newExpense.recipt = req.body.recipt;    

    metadata.findOne(
        {
            'userID' :req.body.userID,
        },(err,data)=>{
            if (err){
                console.log("Error in finding the manager for the employee");
            }
            newExpense.approver=data.managerEmail;

        newExpense.save((err, result) => {
        if (err) {
            console.error(err);
            res.send({success: false, errorMessage: "There is an error in saving the expense"})    
        }
        console.log(result);    
        res.send(({success: true, response: result.expenseTitle + " expense saved to expense tracker.", newExpense}));

    // Trigger mail
    
            console.log(data)
            console.log(data.managerEmail);
            Request.post({
                "headers": { "content-type": "application/json" },
                "url": "https://chatteron.io/api/mail",
                "body": JSON.stringify({
                    "mail" :{
                        "html":"New expense is added by UserID - " + req.body.userID +" is waiting for your approval.",
                        "subject":"New expense added",
                        "to": data.managerEmail
                        }
                    })
                }, (error) => {
                if(error) {
                    console.dir(error);
                   }
                console.log("Mail has successfully sent");
            });
        })
    })
})

app.get('/monthlyExpenseSheet',(req,res) =>{ 
    let tempPath = os.tmpdir();
    tempPath = tempPath + '\\file.csv';
        
    expense.aggregate([
        { "$project": {
            "title" : 1,
            "currency" : 1,
            "amount" : 1,
            "recipt" : 1,
            "date" : 1,
            "userID" : 1,
            "expenseTitle" : 1,
            "approver":1,
            "isApproved":1,
            "month": { "$month": "$date" },
            "year": { "$year": "$date" }
            }
        },
        { "$match": {
            $and : [ {"month": parseInt(req.query.month)},{"year": parseInt(req.query.year)}, {"userID" : req.query.userID} ]
        }}
    ],(err,data) =>{
        
        if (err) return res.status(500).send({success: false, errorMessage:err});
        if (!data.length) {        
            return res.status(404).send({success: false, errorMessage:"No expense found for the given time period"});
        }

        console.log(data);
        options = {
            keys : ["date","expenseTitle","currency","amount","recipt","approver","isApproved"]
           }
    
        converter.json2csv(data, (err,csv)=>{
            if (err) throw err;
    
            fs.writeFile(tempPath, csv, function(err) {
            if (err) throw err;
            console.log('file saved');
            // console.log(tempPath);

            res.set('Content-Type', 'text/csv').download(tempPath,'ExpenseSheetfile.csv');
            });
        },options)
    })
})

app.get('/unApproveBills',(req,res)=>{

    expense.find(
        {
            'approver' :req.query.emailID,
            'isApproved' : false
        },(err,data)=>{
            if (err) {
                return res.status(500).send({success: false, errorMessage:err});
            }
            if (!data.length) {        
                return res.status(404).send({success: false, errorMessage:"Hurrah!! You dont have any bills to approve."});
            }
            return res.status(200).send({success: true, data:data});
        }
)
})

app.post('/addMetadata',(req,res)=>{
    let metaData= new metadata();
    
    metaData.userID = req.body.userID;
    metaData.managerEmail = req.body.managerEmail;
     
    metaData.save((err, result) => {
        if (err) {
            console.error(err);
            res.send({success: false, errorMessage: "There is an error in saving the metadata"})    
        }
        console.log(result);    
        res.send(({success: true, response: result.managerEmail + " saved to database.", metaData}));
      });
})

app.put('/ApproveBill',(req,res)=>{

    expense.findOneAndUpdate({'_id' : req.body.bill_id}, {$set:{'isApproved':true}}, {new: true}, (err, data) => {
        if (err) {
            res.send({success: false, errorMessage: "Opps!! Something went wrong while approving the bill."});
        }
        res.send({success: true, response: "The bill request is successfully been approved.", data});
    });
})

app.listen(port,(err)=>{
    if (err) throw err;
    console.log(`Server is connected on port ${port}`);
});