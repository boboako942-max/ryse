require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Check if user exists
    const existing = await User.findOne({ email: 'test@example.com' });
    if (existing) {
      console.log('✅ Test user already exists');
      console.log('   Email: test@example.com');
      console.log('   Password: Test123456');
      await mongoose.disconnect();
      process.exit(0);
    }

    // Create new user
    const user = await User.create({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'Test123456'
    });

    console.log('✅ Test user created successfully');
    console.log('   Email: test@example.com');
    console.log('   Password: Test123456');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
