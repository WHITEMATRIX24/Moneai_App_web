import express from "express";import {getPublicConfig} from "../controllers/appConfig.controller.js";const r=express.Router();r.get("/public",getPublicConfig);export default r;
