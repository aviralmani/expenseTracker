const mongoose = require('mongoose');
let schema = mongoose.Schema;

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
        default: Date.now()
    }
} );

module.exports = mongoose.model('Expense',expenseSchema);