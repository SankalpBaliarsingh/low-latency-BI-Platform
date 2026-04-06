const express = require("express");
const BI_Router = express.Router();

const {
    List_Dashboards, Get_Dashboard, Create_Dashboard, Update_Dashboard, Delete_Dashboard,
} = require("./Controllers/Dashboard");

const {
    List_Charts, Get_Chart, Get_Chart_Data, Create_Chart, Update_Chart, Delete_Chart,
} = require("./Controllers/Chart");

const {
    List_Datasets, Get_Dataset, Get_Dataset_Preview, Create_Dataset, Update_Dataset, Delete_Dataset,
} = require("./Controllers/Dataset");

const { Execute_Query } = require("./Controllers/Query");


// Dashboard routes
BI_Router.get("/dashboards", List_Dashboards);
BI_Router.get("/dashboards/:id", Get_Dashboard);
BI_Router.post("/dashboards", Create_Dashboard);
BI_Router.put("/dashboards/:id", Update_Dashboard);
BI_Router.delete("/dashboards/:id", Delete_Dashboard);

// Chart routes
BI_Router.get("/charts", List_Charts);
BI_Router.get("/charts/:id/data", Get_Chart_Data);
BI_Router.get("/charts/:id", Get_Chart);
BI_Router.post("/charts", Create_Chart);
BI_Router.put("/charts/:id", Update_Chart);
BI_Router.delete("/charts/:id", Delete_Chart);

// Dataset routes
BI_Router.get("/datasets", List_Datasets);
BI_Router.get("/datasets/:id/preview", Get_Dataset_Preview);
BI_Router.get("/datasets/:id", Get_Dataset);
BI_Router.post("/datasets", Create_Dataset);
BI_Router.put("/datasets/:id", Update_Dataset);
BI_Router.delete("/datasets/:id", Delete_Dataset);

// Query execution route
BI_Router.post("/query", Execute_Query);

module.exports = BI_Router;