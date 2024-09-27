const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  equipment: { 
    type: String, 
    required: true,
    trim: true
  },
  reservations: [{ 
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^\d{2} \d{2} \d{4}$/.test(v);
      },
      message: props => `${props.value} n'est pas un format de date valide (JJ MM AAAA)!`
    }
  }]
});

module.exports = mongoose.model("Room", roomSchema);