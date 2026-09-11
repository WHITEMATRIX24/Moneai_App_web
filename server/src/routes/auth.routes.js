import express from "express";

import {
  registerUser,
  loginUser,
  loginAdmin,
  refreshAccessToken,
  logout,
} from "../controllers/auth.controller.js";

const r = express.Router();


// ==============================
// USER AUTHENTICATION
// ==============================

r.post("/user/register", registerUser);
r.post("/user/login", loginUser);


// ==============================
// ADMIN AUTHENTICATION
// ==============================

r.post("/admin/login", loginAdmin);


// ==============================
// TOKEN MANAGEMENT
// ==============================

r.post("/refresh", refreshAccessToken);
r.post("/logout", logout);


export default r;