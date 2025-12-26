import { Router } from "express";
import { GetUser, GetUsers } from "../controllers/users/get.controller";
import { UpdateUser } from "../controllers/users/edit.controller";

const router = Router()

router.route('/')
        .get(GetUsers)


router.route('/:_id')
        .get(GetUser)
        .patch(UpdateUser)

export default router