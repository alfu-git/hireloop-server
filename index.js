const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const db = client.db("hireloop-db");
    const jobsCollection = db.collection("jobs");
    const companyCollection = db.collection("companies");

    // get jobs by company id/status
    app.get("/company-jobs", async (req, res) => {
      let query = {};

      if (req.query.companyId) {
        query.companyId = req.query.companyId;
      }

      if (req.query.status) {
        query.status = req.query.status;
      }

      const cursor = jobsCollection.find(query);
      const result = await cursor.toArray();
      res.json(result);
    });

    // get job by job id
    app.get("/company-jobs/:jobId", async (req, res) => {
      const { jobId } = req.params;
      const query = {
        _id: new ObjectId(jobId),
      };
      const result = await jobsCollection.findOne(query);
      res.json(result);
    });

    // post new job
    app.post("/jobs", async (req, res) => {
      const job = req.body;
      const newJob = {
        ...job,
        createdAt: new Date(),
      };
      const result = await jobsCollection.insertOne(newJob);
      res.json(result);
    });

    // post company
    app.post("/companies", async (req, res) => {
      const company = req.body;
      const newCompany = {
        ...company,
        createdAt: new Date(),
      };
      const result = await companyCollection.insertOne(newCompany);
      res.json(result);
    });

    // get companies by recruiter id
    app.get("/my-companies", async (req, res) => {
      const query = {};

      if (req.query.recruiterId) {
        query.recruiterId = req.query.recruiterId;
      }

      const result = await companyCollection.find(query).toArray();
      res.json(result);
    });

    // update recruiter company details
    app.patch("/update/my-companies", async (req, res) => {
      const updatedData = req.body;

      const query = {};

      if (req.query.recruiterId) {
        query.recruiterId = req.query.recruiterId;
      }

      const result = await companyCollection.updateOne(query, {
        $set: updatedData,
      });

      res.json(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
