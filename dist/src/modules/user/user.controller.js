export class UserController {
    userService;
    constructor(userService) {
        this.userService = userService;
    }
    getUsers = async (req, res) => {
        const query = {
            page: parseInt(req.query.page) || 1,
            take: parseInt(req.query.take) || 3,
            sortOrder: req.query.sortOrder || "desc",
            sortBy: req.query.sortBy || "createdAt",
            search: req.query.search || "",
        };
        const result = await this.userService.getUsers(query);
        res.status(200).send(result);
    };
    getUser = async (req, res) => {
        const id = Number(req.params.id);
        const result = await this.userService.getUser(id);
        res.status(200).send(result);
    };
    createUser = async (req, res) => {
        const body = req.body;
        const result = await this.userService.createUser(body);
        res.status(200).send(result);
    };
    updateUser = async (req, res) => {
        const id = Number(req.params.id);
        const body = req.body;
        const result = await this.userService.updateUser(id, body);
        res.status(200).send(result);
    };
    deleteUser = async (req, res) => {
        const id = Number(req.params.id);
        const result = await this.userService.deleteUser(id);
        res.status(200).send(result);
    };
}
