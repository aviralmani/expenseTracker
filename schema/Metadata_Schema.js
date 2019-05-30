const mongoose = require('mongoose');
let schema = mongoose.Schema;

let metadata = new schema({    
    userID: {
        type :  String,
        required : true
    },
    managerEmail: {
        type :  String,
        required : true
    }   
} );

module.exports = mongoose.model('metadata',metadata);