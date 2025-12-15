import { Router } from "express";
import { GetUser, GetUsers } from "../controllers/users/get.controller";

const router = Router()

router.route('/')
        .get(GetUsers)


router.route('/:_id')
        .get(GetUser)

export default router