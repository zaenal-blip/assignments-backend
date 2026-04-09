import express from "express";
export class UserRouter {
    userController;
    router;
    constructor(userController) {
        this.userController = userController;
        this.router = express.Router();
        this.initRoutes();
    }
    initRoutes = () => {
        this.router.get("/", this.userController.getUsers);
        this.router.get("/:id", this.userController.getUser);
        this.router.post("/", this.userController.createUser);
        this.router.patch("/:id", this.userController.updateUser);
        this.router.delete("/:id", this.userController.deleteUser);
    };
    getRouter = () => {
        return this.router;
    };
}
