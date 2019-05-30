const mongoose = require('mongoose');
let schema = mongoose.Schema;

const moment= require('moment');

require('mongoose-currency').loadType(mongoose);
var Currency = mongoose.Types.Currency

let expenseSchema = new schema({    
    userID: {
        type :  String,
        required : true
    },
    expenseTitle: String,
    currency: String,
    amount:{ type: Currency },
    recipt : String,
    date : {
        type: Date,
        default: moment()
    },
    approver: String,
    isApproved : {
        type :Boolean,
        default:false
    }
} );

module.exports = mongoose.model('Expense',expenseSchema);