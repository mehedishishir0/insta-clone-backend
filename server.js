const app = require("./app");

require("dotenv").config();
const { server } = require("./Socket/socket")(app);

server.listen(process.env.PORT, () => {
  console.log(`Server is running on port http://localhost:${process.env.PORT}`);
  // Connect to MongoDB database
  require("./Config/db")();
});
