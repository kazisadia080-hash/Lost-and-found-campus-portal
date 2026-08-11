import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI is not set. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

if (uri.includes('+srv')) {
  console.log('Using SRV connection string. If this fails with querySrv ECONNREFUSED,');
  console.log('your network is blocking SRV DNS lookups. Switch to a standard connection string.');
  console.log('See: https://www.mongodb.com/docs/atlas/connect-to-database-deployment/#std-label-connect-driver');
}

mongoose
  .connect(uri, {
    serverSelectionTimeoutMS: 10000,
    tls: true,
  })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    if (err.message.includes('querySrv')) {
      console.error('\n=== HOW TO FIX THIS ===');
      console.error('Your network is blocking the SRV DNS lookup that the "+srv" connection string needs.');
      console.error('To get a standard (non-SRV) connection string:');
      console.error('1. Go to MongoDB Atlas → click "Connect" on your cluster');
      console.error('2. Choose "Connect your application"');
      console.error('3. In the "Driver" dropdown, select "Node.js"');
      console.error('4. In the "Version" dropdown, select "2.2.12 or earlier"');
      console.error('5. Copy the connection string that appears (it starts with "mongodb://" not "mongodb+srv://")');
      console.error('6. Replace <password> with your actual password');
      console.error('7. Paste it as the MONGODB_URI value in your server/.env file');
    }
    process.exit(1);
  });
