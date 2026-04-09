import { ApiError } from "../../utils/api-error.js";
export class RegularJobController {
    regularJobService;
    constructor(regularJobService) {
        this.regularJobService = regularJobService;
    }
    getRegularJobs = async (req, res) => {
        try {
            const result = await this.regularJobService.getRegularJobs();
            res.status(200).json(result);
        }
        catch (error) {
            const status = error instanceof ApiError ? error.status : 500;
            res.status(status).json({ message: error.message });
        }
    };
    createRegularJob = async (req, res) => {
        try {
            const { name, picId } = req.body;
            const result = await this.regularJobService.createRegularJob(name, picId);
            res.status(201).json(result);
        }
        catch (error) {
            const status = error instanceof ApiError ? error.status : 500;
            res.status(status).json({ message: error.message });
        }
    };
    updateRegularJob = async (req, res) => {
        try {
            const id = Number(req.params.id);
            const { name } = req.body;
            const result = await this.regularJobService.updateRegularJob(id, name);
            res.status(200).json(result);
        }
        catch (error) {
            const status = error instanceof ApiError ? error.status : 500;
            res.status(status).json({ message: error.message });
        }
    };
    createRegularTask = async (req, res) => {
        try {
            const regularJobId = Number(req.params.id);
            const result = await this.regularJobService.createRegularTask(regularJobId, req.body);
            res.status(201).json(result);
        }
        catch (error) {
            const status = error instanceof ApiError ? error.status : 500;
            res.status(status).json({ message: error.message });
        }
    };
    deleteRegularJob = async (req, res) => {
        try {
            const id = Number(req.params.id);
            await this.regularJobService.deleteRegularJob(id);
            res.status(200).json({ message: "Regular Job deleted" });
        }
        catch (error) {
            const status = error instanceof ApiError ? error.status : 500;
            res.status(status).json({ message: error.message });
        }
    };
}
