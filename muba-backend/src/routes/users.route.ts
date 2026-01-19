import express from "express";
import type { Router } from "express";
import { GetUser, GetUsers } from "../controllers/users/get.controller.ts";
import { UpdateUser } from "../controllers/users/edit.controller.ts";

const router = express.Router()

router.route('/')
        .get(GetUsers)


router.route('/:_id')
        .get(GetUser)
        .patch(UpdateUser)

export default router


