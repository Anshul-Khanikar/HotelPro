const { MongoMemoryServer } = require('mongodb-memory-server');

async function startDemo() {
  const mongo = await MongoMemoryServer.create({
    instance: { dbName: 'hotelpro_demo' }
  });

  // Use an isolated, temporary database so the demo runs without installing
  // MongoDB or touching any existing database configured in .env.
  process.env.MONGODB_URI = mongo.getUri();
  process.env.NODE_ENV = process.env.NODE_ENV || 'development';

  console.log('HotelPro demo database started (data is temporary).');
  require('./server');

  const shutdown = async () => {
    await mongo.stop();
    process.exit(0);
  };

  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

startDemo().catch((error) => {
  console.error('Could not start the HotelPro demo database:', error);
  process.exitCode = 1;
});